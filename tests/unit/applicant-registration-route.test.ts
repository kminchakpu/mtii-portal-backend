import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  registerApplicant,
  createApplicantAuthIpRateLimitKey,
  createApplicantAuthEmailRateLimitKey,
  getApplicantAuthRateLimitPolicy,
  checkApplicantAuthRateLimit,
  logServerError,
} = vi.hoisted(() => ({
  registerApplicant: vi.fn(),
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
}));

vi.mock(
  "@/lib/applicant-auth/registration-service",
  () => ({
    registerApplicant,
  })
);

vi.mock(
  "@/lib/applicant-auth/errors",
  () => ({
    ApplicantEmailConflictError:
      class ApplicantEmailConflictError
        extends Error {
        constructor() {
          super(
            "An applicant with this email already exists."
          );
          this.name =
            "ApplicantEmailConflictError";
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

vi.mock(
  "@/lib/security/server-error-logger",
  () => ({
    logServerError,
  })
);

const GENERIC_REGISTRATION_MESSAGE =
  "If the registration can be processed, check your email for a verification link.";

describe(
  "applicant registration route",
  () => {
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
        .mockReturnValue({
          windowMinutes: 15,
          maxRequests: 5,
          blockDurationMinutes: 15,
        });

      checkApplicantAuthRateLimit
        .mockResolvedValue({
          allowed: true,
          retryAfterSeconds: 0,
        });

      registerApplicant
        .mockResolvedValue({
          publicId:
            "applicant-public-id",
          firstName: "Amina",
          lastName: "Yusuf",
          email:
            "amina@example.com",
          emailVerified: false,
        });
    });

    it("registers an applicant and returns an enumeration-safe accepted response", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
              email:
                "Amina@Example.COM",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      expect(
        response.status
      ).toBe(202);

      expect(
        await response.json()
      ).toEqual({
        message:
          GENERIC_REGISTRATION_MESSAGE,
      });

      expect(
        registerApplicant
      ).toHaveBeenCalledWith({
        firstName: "Amina",
        lastName: "Yusuf",
        email:
          "Amina@Example.COM",
        password:
          "ValidPassword123!",
      });
    });

    it("applies both IP and email rate limits before registration", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      await POST(request);

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
        getApplicantAuthRateLimitPolicy
      ).toHaveBeenCalledWith(
        "registration"
      );

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenNthCalledWith(
        1,
        "registration",
        "hashed-ip-key",
        {
          windowMinutes: 15,
          maxRequests: 5,
          blockDurationMinutes: 15,
        }
      );

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenNthCalledWith(
        2,
        "registration",
        "hashed-email-key",
        {
          windowMinutes: 15,
          maxRequests: 5,
          blockDurationMinutes: 15,
        }
      );

      expect(
        registerApplicant
      ).toHaveBeenCalledOnce();
    });

    it("rejects an IP rate-limited registration with 429 before checking the email key or registering", async () => {
      checkApplicantAuthRateLimit
        .mockResolvedValueOnce({
          allowed: false,
          retryAfterSeconds: 300,
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
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
      ).toBe(429);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Too many registration attempts. Please try again later.",
      });

      expect(
        response.headers.get(
          "retry-after"
        )
      ).toBe("300");

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenCalledOnce();

      expect(
        createApplicantAuthEmailRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        registerApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects an email rate-limited registration with 429", async () => {
      checkApplicantAuthRateLimit
        .mockResolvedValueOnce({
          allowed: true,
          retryAfterSeconds: 0,
        })
        .mockResolvedValueOnce({
          allowed: false,
          retryAfterSeconds: 600,
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
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
      ).toBe(429);

      expect(
        await response.json()
      ).toEqual({
        error:
          "Too many registration attempts. Please try again later.",
      });

      expect(
        response.headers.get(
          "retry-after"
        )
      ).toBe("600");

      expect(
        checkApplicantAuthRateLimit
      ).toHaveBeenCalledTimes(
        2
      );

      expect(
        registerApplicant
      ).not.toHaveBeenCalled();
    });

    it("returns the same accepted response when the email already exists", async () => {
      const {
        ApplicantEmailConflictError,
      } = await import(
        "@/lib/applicant-auth/errors"
      );

      registerApplicant
        .mockRejectedValueOnce(
          new ApplicantEmailConflictError()
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
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
      ).toBe(202);

      expect(
        await response.json()
      ).toEqual({
        message:
          GENERIC_REGISTRATION_MESSAGE,
      });

      expect(
        logServerError
      ).not.toHaveBeenCalled();
    });

    it("rejects invalid registration data with 400", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "",
              lastName: "Yusuf",
              email:
                "not-an-email",
              password: "short",
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
          "Invalid registration request.",
      });

      expect(
        registerApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects malformed JSON with 400 before rate limiting", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
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
        createApplicantAuthIpRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        createApplicantAuthEmailRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        checkApplicantAuthRateLimit
      ).not.toHaveBeenCalled();

      expect(
        registerApplicant
      ).not.toHaveBeenCalled();
    });

    it("rejects a cross-site registration before parsing or rate limiting", async () => {
      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
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
              firstName: "Amina",
              lastName: "Yusuf",
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
        createApplicantAuthIpRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        createApplicantAuthEmailRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        checkApplicantAuthRateLimit
      ).not.toHaveBeenCalled();

      expect(
        registerApplicant
      ).not.toHaveBeenCalled();
    });

    it("does not expose applicant details, password, or verification token in the success response", async () => {
      registerApplicant
        .mockResolvedValueOnce({
          publicId:
            "secret-public-id",
          firstName: "Amina",
          lastName: "Yusuf",
          email:
            "amina@example.com",
          emailVerified: false,
        });

      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
              email:
                "amina@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      const body =
        await response.json();

      const serializedBody =
        JSON.stringify(body);

      expect(body).toEqual({
        message:
          GENERIC_REGISTRATION_MESSAGE,
      });

      expect(
        serializedBody
      ).not.toContain(
        "secret-public-id"
      );

      expect(
        serializedBody
      ).not.toContain(
        "amina@example.com"
      );

      expect(
        serializedBody
      ).not.toContain(
        "ValidPassword123!"
      );

      expect(
        serializedBody
      ).not.toContain(
        "token"
      );
    });

    it("logs unexpected failures safely and returns a generic 500 response", async () => {
      const unexpectedError =
        new Error(
          "database connection failed"
        );

      registerApplicant
        .mockRejectedValueOnce(
          unexpectedError
        );

      const { POST } =
        await import(
          "@/app/api/applicant/auth/register/route"
        );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/register",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
              "x-real-ip":
                "203.0.113.10",
            },
            body: JSON.stringify({
              firstName: "Amina",
              lastName: "Yusuf",
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

      expect(
        await response.json()
      ).toEqual({
        error:
          "Unable to register at this time.",
      });

      expect(
        logServerError
      ).toHaveBeenCalledWith(
        "Applicant registration failed.",
        unexpectedError
      );
    });
  }
);