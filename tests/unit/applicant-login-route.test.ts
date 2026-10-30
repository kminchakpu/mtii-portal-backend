import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  authenticateApplicant,
  createApplicantAuthIpRateLimitKey,
  createApplicantAuthEmailRateLimitKey,
  getApplicantAuthRateLimitPolicy,
  checkApplicantAuthRateLimit,
} = vi.hoisted(() => ({
  authenticateApplicant:
    vi.fn(),
  createApplicantAuthIpRateLimitKey:
    vi.fn(),
  createApplicantAuthEmailRateLimitKey:
    vi.fn(),
  getApplicantAuthRateLimitPolicy:
    vi.fn(),
  checkApplicantAuthRateLimit:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/login-service",
  () => ({
    authenticateApplicant,

    InvalidApplicantCredentialsError:
      class InvalidApplicantCredentialsError
        extends Error {
        constructor() {
          super(
            "Invalid email or password."
          );

          this.name =
            "InvalidApplicantCredentialsError";
        }
      },

    ApplicantAccountInactiveError:
      class ApplicantAccountInactiveError
        extends Error {
        constructor() {
          super(
            "This applicant account is inactive."
          );

          this.name =
            "ApplicantAccountInactiveError";
        }
      },

    ApplicantEmailNotVerifiedError:
      class ApplicantEmailNotVerifiedError
        extends Error {
        constructor() {
          super(
            "Please verify your email address before signing in."
          );

          this.name =
            "ApplicantEmailNotVerifiedError";
        }
      },
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-key",
  () => ({
    createApplicantAuthIpRateLimitKey,
    createApplicantAuthEmailRateLimitKey,
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-policy",
  () => ({
    getApplicantAuthRateLimitPolicy,
  })
);

vi.mock(
  "@/lib/applicant-auth/rate-limit-service",
  () => ({
    checkApplicantAuthRateLimit,
  })
);

describe(
  "applicant login route",
  () => {
    const loginPolicy = {
      windowMinutes: 15,
      maxRequests: 5,
      blockDurationMinutes: 15,
    };

    beforeEach(() => {
      vi.resetAllMocks();

      createApplicantAuthIpRateLimitKey
        .mockReturnValue(
          "hashed-ip-key"
        );

      createApplicantAuthEmailRateLimitKey
        .mockReturnValue(
          "hashed-email-key"
        );

      getApplicantAuthRateLimitPolicy
        .mockReturnValue(
          loginPolicy
        );

      checkApplicantAuthRateLimit
        .mockResolvedValue({
          allowed: true,
          retryAfterSeconds: 0,
        });
    });

    it("logs in a verified applicant and sets the applicant session cookie", async () => {
      authenticateApplicant
        .mockResolvedValue({
          applicant: {
            id: 25,
            publicId:
              "applicant-public-id",
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
          },
          session: {
            token:
              "opaque-applicant-session-token",
            expiresAt:
              new Date(
                "2026-11-06T12:00:00.000Z"
              ),
          },
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                " Amina@Example.com ",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(200);

      expect(
        await response.json()
      ).toEqual({
        applicant: {
          publicId:
            "applicant-public-id",
          firstName:
            "Amina",
          lastName:
            "Ibrahim",
          email:
            "amina@example.com",
        },
      });

      expect(
        getApplicantAuthRateLimitPolicy
      ).toHaveBeenCalledWith(
        "login"
      );

      expect(
        createApplicantAuthIpRateLimitKey
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        createApplicantAuthEmailRateLimitKey
      ).toHaveBeenCalledWith(
        "amina@example.com"
      );

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenNthCalledWith(
        1,
        "login",
        "hashed-ip-key",
        loginPolicy
      );

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenNthCalledWith(
        2,
        "login",
        "hashed-email-key",
        loginPolicy
      );

      expect(
        authenticateApplicant
      ).toHaveBeenCalledWith({
        email:
          "amina@example.com",
        password:
          "ValidPassword123!",
      });

      const setCookie =
        response.headers.get(
          "set-cookie"
        );

      expect(
        setCookie
      ).toContain(
        "mtii_applicant_session=opaque-applicant-session-token"
      );

      expect(
        setCookie
      ).toContain(
        "HttpOnly"
      );

      expect(
        setCookie
      ).toContain(
        "SameSite=lax"
      );

      expect(
        setCookie
      ).toContain(
        "Path=/"
      );
    });

    it("rejects an IP-rate-limited login before checking the email rate limit or authenticating", async () => {
      checkApplicantAuthRateLimit
        .mockResolvedValueOnce({
          allowed: false,
          retryAfterSeconds: 300,
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "wrong-password",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(429);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Too many login attempts. Please try again later.",
      });

      expect(
        response.headers.get(
          "retry-after"
        )
      ).toBe("300");

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        createApplicantAuthEmailRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        authenticateApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects an email-rate-limited login before authentication", async () => {
      checkApplicantAuthRateLimit
        .mockResolvedValueOnce({
          allowed: true,
          retryAfterSeconds: 0,
        })
        .mockResolvedValueOnce({
          allowed: false,
          retryAfterSeconds: 240,
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "wrong-password",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(429);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Too many login attempts. Please try again later.",
      });

      expect(
        response.headers.get(
          "retry-after"
        )
      ).toBe("240");

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenCalledTimes(
        2
      );

      expect(
        authenticateApplicant
      ).not.toHaveBeenCalled();
    });

    it("returns generic invalid credentials without setting a cookie", async () => {
      const {
        InvalidApplicantCredentialsError,
      } = await import(
        "@/lib/applicant-auth/login-service"
      );

      authenticateApplicant
        .mockRejectedValue(
          new InvalidApplicantCredentialsError()
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "unknown@example.com",
              password:
                "wrong-password",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(401);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Invalid email or password.",
      });

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toBeNull();
    });

    it("rejects an unverified applicant without setting a cookie", async () => {
      const {
        ApplicantEmailNotVerifiedError,
      } = await import(
        "@/lib/applicant-auth/login-service"
      );

      authenticateApplicant
        .mockRejectedValue(
          new ApplicantEmailNotVerifiedError()
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(403);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Please verify your email address before signing in.",
      });

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toBeNull();
    });

    it("rejects an inactive applicant without setting a cookie", async () => {
      const {
        ApplicantAccountInactiveError,
      } = await import(
        "@/lib/applicant-auth/login-service"
      );

      authenticateApplicant
        .mockRejectedValue(
          new ApplicantAccountInactiveError()
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(403);

      expect(
        await response.json()
      ).toEqual({
        error:
          "This applicant account is inactive.",
      });

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toBeNull();
    });

    it("rejects malformed login input before rate limiting or authentication", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body: JSON.stringify({
              email:
                "not-an-email",
              password: "",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(400);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Invalid login request.",
      });

      expect(
        createApplicantAuthIpRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        checkApplicantAuthRateLimit
      ).not.toHaveBeenCalled();

      expect(
        authenticateApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects malformed JSON before rate limiting or authentication", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              "{invalid-json",
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(400);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Invalid request body.",
      });

      expect(
        checkApplicantAuthRateLimit
      ).not.toHaveBeenCalled();

      expect(
        authenticateApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects a cross-site request before rate limiting or authentication", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              Origin:
                "https://attacker.example.com",
              "Sec-Fetch-Site":
                "cross-site",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(403);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Cross-site request forbidden.",
      });

      expect(
        checkApplicantAuthRateLimit
      ).not.toHaveBeenCalled();

      expect(
        authenticateApplicant
      ).not.toHaveBeenCalled();
    });

    it("returns a safe server error without exposing internal details", async () => {
      authenticateApplicant
        .mockRejectedValue(
          new Error(
            "mysql://secret-user:secret-password@database/app"
          )
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/login",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(500);

      const body =
        await response.json();

      expect(body).toEqual({
        error:
          "Unable to sign in at this time.",
      });

      expect(
        JSON.stringify(body)
      ).not.toContain(
        "secret-password"
      );

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toBeNull();
    });
  }
);