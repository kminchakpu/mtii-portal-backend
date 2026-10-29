import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(
  () => {
    class ApplicantCrossSiteRequestError
      extends Error {
      constructor() {
        super(
          "Cross-site request forbidden."
        );

        this.name =
          "ApplicantCrossSiteRequestError";
      }
    }

    return {
      ApplicantCrossSiteRequestError,
      resendApplicantVerification:
        vi.fn(),
      enforceApplicantRequestOrigin:
        vi.fn(),
      createApplicantAuthIpRateLimitKey:
        vi.fn(),
      createApplicantAuthEmailRateLimitKey:
        vi.fn(),
      getApplicantAuthRateLimitPolicy:
        vi.fn(),
      checkApplicantAuthRateLimit:
        vi.fn(),
      logServerError:
        vi.fn(),
    };
  }
);

vi.mock(
  "@/lib/applicant-auth/resend-verification-service",
  () => ({
    resendApplicantVerification:
      mocks.resendApplicantVerification,
  })
);

vi.mock(
  "@/lib/http/applicant-request-security",
  () => ({
    ApplicantCrossSiteRequestError:
      mocks.ApplicantCrossSiteRequestError,
    enforceApplicantRequestOrigin:
      mocks.enforceApplicantRequestOrigin,
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-key",
  () => ({
    createApplicantAuthIpRateLimitKey:
      mocks.createApplicantAuthIpRateLimitKey,
    createApplicantAuthEmailRateLimitKey:
      mocks.createApplicantAuthEmailRateLimitKey,
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-policy",
  () => ({
    getApplicantAuthRateLimitPolicy:
      mocks.getApplicantAuthRateLimitPolicy,
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-service",
  () => ({
    checkApplicantAuthRateLimit:
      mocks.checkApplicantAuthRateLimit,
  })
);

vi.mock(
  "@/lib/security/server-error-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  })
);

import {
  POST,
} from "@/app/api/applicant/auth/resend-verification/route";

const GENERIC_MESSAGE =
  "If an eligible account exists, check your email for a verification link.";

const RATE_LIMIT_ERROR =
  "Too many verification email requests. Please try again later.";

function createRequest(
  body: unknown,
  headers: Record<
    string,
    string
  > = {}
): Request {
  return new Request(
    "https://portal.example.com/api/applicant/auth/resend-verification",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
        "x-real-ip":
          "203.0.113.10",
        ...headers,
      },
      body:
        JSON.stringify(
          body
        ),
    }
  );
}

describe(
  "POST /api/applicant/auth/resend-verification",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      mocks.createApplicantAuthIpRateLimitKey.mockReturnValue(
        "ip-rate-limit-key"
      );

      mocks.createApplicantAuthEmailRateLimitKey.mockReturnValue(
        "email-rate-limit-key"
      );

      mocks.getApplicantAuthRateLimitPolicy.mockReturnValue({
        windowMinutes:
          30,
        maxRequests:
          3,
        blockDurationMinutes:
          30,
      });

      mocks.checkApplicantAuthRateLimit.mockResolvedValue({
        allowed:
          true,
        retryAfterSeconds:
          0,
      });

      mocks.resendApplicantVerification.mockResolvedValue(
        undefined
      );
    });

    it(
      "returns the generic accepted response for a valid request",
      async () => {
        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          202
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          message:
            GENERIC_MESSAGE,
        });
      }
    );

    it(
      "normalizes the email before rate limiting and resending",
      async () => {
        await POST(
          createRequest({
            email:
              "  AMINA@EXAMPLE.COM  ",
          })
        );

        expect(
          mocks.createApplicantAuthEmailRateLimitKey
        ).toHaveBeenCalledWith(
          "amina@example.com"
        );

        expect(
          mocks.resendApplicantVerification
        ).toHaveBeenCalledWith(
          "amina@example.com"
        );
      }
    );

    it(
      "uses the resend verification rate-limit policy",
      async () => {
        await POST(
          createRequest({
            email:
              "amina@example.com",
          })
        );

        expect(
          mocks.getApplicantAuthRateLimitPolicy
        ).toHaveBeenCalledWith(
          "resend_verification"
        );
      }
    );

    it(
      "checks the IP rate limit before the email rate limit",
      async () => {
        await POST(
          createRequest({
            email:
              "amina@example.com",
          })
        );

        expect(
          mocks.createApplicantAuthIpRateLimitKey
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.checkApplicantAuthRateLimit
        ).toHaveBeenNthCalledWith(
          1,
          "resend_verification",
          "ip-rate-limit-key",
          {
            windowMinutes:
              30,
            maxRequests:
              3,
            blockDurationMinutes:
              30,
          }
        );

        expect(
          mocks.checkApplicantAuthRateLimit
        ).toHaveBeenNthCalledWith(
          2,
          "resend_verification",
          "email-rate-limit-key",
          {
            windowMinutes:
              30,
            maxRequests:
              3,
            blockDurationMinutes:
              30,
          }
        );
      }
    );

    it(
      "returns 429 when the IP rate limit is exceeded",
      async () => {
        mocks.checkApplicantAuthRateLimit.mockResolvedValueOnce({
          allowed:
            false,
          retryAfterSeconds:
            900,
        });

        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          429
        );

        expect(
          response.headers.get(
            "Retry-After"
          )
        ).toBe(
          "900"
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            RATE_LIMIT_ERROR,
        });

        expect(
          mocks.createApplicantAuthEmailRateLimitKey
        ).not.toHaveBeenCalled();

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 429 when the email rate limit is exceeded",
      async () => {
        mocks.checkApplicantAuthRateLimit
          .mockResolvedValueOnce({
            allowed:
              true,
            retryAfterSeconds:
              0,
          })
          .mockResolvedValueOnce({
            allowed:
              false,
            retryAfterSeconds:
              1200,
          });

        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          429
        );

        expect(
          response.headers.get(
            "Retry-After"
          )
        ).toBe(
          "1200"
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            RATE_LIMIT_ERROR,
        });

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 400 for an invalid email address",
      async () => {
        const response =
          await POST(
            createRequest({
              email:
                "not-an-email",
            })
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid verification resend request.",
        });

        expect(
          mocks.checkApplicantAuthRateLimit
        ).not.toHaveBeenCalled();

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 400 when the email is missing",
      async () => {
        const response =
          await POST(
            createRequest({})
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid verification resend request.",
        });

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 400 for malformed JSON",
      async () => {
        const request =
          new Request(
            "https://portal.example.com/api/applicant/auth/resend-verification",
            {
              method:
                "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-real-ip":
                  "203.0.113.10",
              },
              body:
                "{invalid-json",
            }
          );

        const response =
          await POST(
            request
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid request body.",
        });

        expect(
          mocks.checkApplicantAuthRateLimit
        ).not.toHaveBeenCalled();

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects cross-site requests before processing",
      async () => {
        mocks.enforceApplicantRequestOrigin.mockImplementation(
          () => {
            throw new mocks.ApplicantCrossSiteRequestError();
          }
        );

        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          403
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Cross-site request forbidden.",
        });

        expect(
          mocks.checkApplicantAuthRateLimit
        ).not.toHaveBeenCalled();

        expect(
          mocks.resendApplicantVerification
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns the same generic response when no verification email is sent",
      async () => {
        mocks.resendApplicantVerification.mockResolvedValue(
          undefined
        );

        const response =
          await POST(
            createRequest({
              email:
                "missing@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          202
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          message:
            GENERIC_MESSAGE,
        });
      }
    );

    it(
      "does not expose account existence information",
      async () => {
        const response =
          await POST(
            createRequest({
              email:
                "missing@example.com",
            })
          );

        const body =
          JSON.stringify(
            await response.json()
          );

        expect(
          body
        ).not.toContain(
          "missing@example.com"
        );

        expect(
          body.toLowerCase()
        ).not.toContain(
          "not found"
        );

        expect(
          body.toLowerCase()
        ).not.toContain(
          "already verified"
        );

        expect(
          body.toLowerCase()
        ).not.toContain(
          "inactive"
        );
      }
    );

    it(
      "does not expose a verification token",
      async () => {
        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        const body =
          JSON.stringify(
            await response.json()
          );

        expect(
          body
        ).not.toContain(
          "token"
        );

        expect(
          body
        ).not.toContain(
          "new-secret-verification-token"
        );
      }
    );

    it(
      "logs unexpected failures and returns a safe 500 response",
      async () => {
        const error =
          new Error(
            "SMTP password leaked internally"
          );

        mocks.resendApplicantVerification.mockRejectedValue(
          error
        );

        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        expect(
          response.status
        ).toBe(
          500
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Unable to resend verification email at this time.",
        });

        expect(
          mocks.logServerError
        ).toHaveBeenCalledWith(
          "Applicant verification resend failed.",
          error
        );
      }
    );

    it(
      "does not expose unexpected internal error details",
      async () => {
        mocks.resendApplicantVerification.mockRejectedValue(
          new Error(
            "database password secret-value"
          )
        );

        const response =
          await POST(
            createRequest({
              email:
                "amina@example.com",
            })
          );

        const body =
          JSON.stringify(
            await response.json()
          );

        expect(
          body
        ).not.toContain(
          "database password"
        );

        expect(
          body
        ).not.toContain(
          "secret-value"
        );
      }
    );
  }
);