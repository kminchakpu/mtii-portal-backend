import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  authenticateStaff,
  writeAuditLog,
  createStaffLoginRateLimitKey,
  isStaffLoginBlocked,
  recordFailedStaffLogin,
  clearStaffLoginFailures,
} = vi.hoisted(() => ({
  authenticateStaff: vi.fn(),
  writeAuditLog: vi.fn(),
  createStaffLoginRateLimitKey:
    vi.fn(),
  isStaffLoginBlocked:
    vi.fn(),
  recordFailedStaffLogin:
    vi.fn(),
  clearStaffLoginFailures:
    vi.fn(),
}));

vi.mock(
  "@/lib/auth/staff-auth-service",
  () => ({
    authenticateStaff,
    InvalidStaffCredentialsError:
      class InvalidStaffCredentialsError
        extends Error {
        constructor() {
          super(
            "Invalid email or password."
          );
          this.name =
            "InvalidStaffCredentialsError";
        }
      },
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog,
  })
);

vi.mock(
  "@/lib/auth/staff-login-rate-limit-key",
  () => ({
    createStaffLoginRateLimitKey,
  })
);

vi.mock(
  "@/lib/auth/staff-login-rate-limit-service",
  () => ({
    isStaffLoginBlocked,
    recordFailedStaffLogin,
    clearStaffLoginFailures,
  })
);

describe(
  "staff login route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      createStaffLoginRateLimitKey
        .mockReturnValue(
          "hashed-rate-limit-key"
        );

      isStaffLoginBlocked
        .mockResolvedValue({
          blocked: false,
          retryAfterSeconds: 0,
        });

      recordFailedStaffLogin
        .mockResolvedValue(
          undefined
        );

      clearStaffLoginFailures
        .mockResolvedValue(
          undefined
        );

      writeAuditLog
        .mockResolvedValue(
          undefined
        );
    });

    it("logs in staff and sets the session cookie", async () => {
      authenticateStaff
        .mockResolvedValue({
          user: {
            id: 1,
            publicId:
              "user-public-id",
            firstName: "Kevin",
            lastName:
              "Minchakpu",
            email:
              "kevin@example.com",
            departmentId: 1,
            departmentCode:
              "ADMIN",
          },
          session: {
            token:
              "opaque-session-token",
            expiresAt:
              new Date(
                "2026-10-21T12:00:00.000Z"
              ),
          },
        });

      const { POST } =
        await import(
          "@/app/api/staff/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/staff/auth/login",
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
                "kevin@example.com",
              password:
                "ValidPassword123!",
            }),
          }
        );

      const response =
        await POST(request);

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(200);

      expect(body).toEqual({
        user: {
          publicId:
            "user-public-id",
          firstName: "Kevin",
          lastName:
            "Minchakpu",
          email:
            "kevin@example.com",
          departmentCode:
            "ADMIN",
        },
      });

      expect(
        createStaffLoginRateLimitKey
      ).toHaveBeenCalledWith(
        request,
        "kevin@example.com"
      );

      expect(
        isStaffLoginBlocked
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );

      expect(
        authenticateStaff
      ).toHaveBeenCalledWith({
        email:
          "kevin@example.com",
        password:
          "ValidPassword123!",
      });

      expect(
        clearStaffLoginFailures
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );

      expect(
        recordFailedStaffLogin
      ).not.toHaveBeenCalled();

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "mtii_staff_session="
      );

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "HttpOnly"
      );

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "SameSite=lax"
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith({
        actorUserId: 1,
        departmentId: 1,
        action: "STAFF_LOGIN",
        entityType: "USER",
        entityId:
          "user-public-id",
        metadata: {
          source: "staff-auth",
        },
      });
    });

    it("rejects a blocked login attempt with 429 before authentication", async () => {
      isStaffLoginBlocked
        .mockResolvedValueOnce({
          blocked: true,
          retryAfterSeconds:
            300,
        });

      const { POST } =
        await import(
          "@/app/api/staff/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/staff/auth/login",
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
                "kevin@example.com",
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
          "Too many login attempts. Please try again later.",
      });

      expect(
        response.headers.get(
          "retry-after"
        )
      ).toBe("300");

      expect(
        createStaffLoginRateLimitKey
      ).toHaveBeenCalledWith(
        request,
        "kevin@example.com"
      );

      expect(
        isStaffLoginBlocked
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );

      expect(
        authenticateStaff
      ).not.toHaveBeenCalled();

      expect(
        recordFailedStaffLogin
      ).not.toHaveBeenCalled();

      expect(
        clearStaffLoginFailures
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("rejects a cross-site request before rate limiting or authentication", async () => {
      const { POST } =
        await import(
          "@/app/api/staff/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/staff/auth/login",
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
                "kevin@example.com",
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
        createStaffLoginRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        isStaffLoginBlocked
      ).not.toHaveBeenCalled();

      expect(
        authenticateStaff
      ).not.toHaveBeenCalled();

      expect(
        recordFailedStaffLogin
      ).not.toHaveBeenCalled();

      expect(
        clearStaffLoginFailures
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("records a failed login attempt when credentials are invalid", async () => {
      const {
        InvalidStaffCredentialsError,
      } = await import(
        "@/lib/auth/staff-auth-service"
      );

      authenticateStaff
        .mockRejectedValue(
          new InvalidStaffCredentialsError()
        );

      const { POST } =
        await import(
          "@/app/api/staff/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/staff/auth/login",
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
                "wrong@example.com",
              password:
                "wrong-password",
            }),
          }
        );

      const response =
        await POST(request);

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(401);

      expect(body).toEqual({
        error:
          "Invalid email or password.",
      });

      expect(
        createStaffLoginRateLimitKey
      ).toHaveBeenCalledWith(
        request,
        "wrong@example.com"
      );

      expect(
        isStaffLoginBlocked
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );

      expect(
        recordFailedStaffLogin
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );

      expect(
        clearStaffLoginFailures
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("does not record a failed login attempt for malformed JSON", async () => {
      const { POST } =
        await import(
          "@/app/api/staff/auth/login/route"
        );

      const request =
        new Request(
          "http://localhost/api/staff/auth/login",
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
        createStaffLoginRateLimitKey
      ).not.toHaveBeenCalled();

      expect(
        isStaffLoginBlocked
      ).not.toHaveBeenCalled();

      expect(
        authenticateStaff
      ).not.toHaveBeenCalled();

      expect(
        recordFailedStaffLogin
      ).not.toHaveBeenCalled();

      expect(
        clearStaffLoginFailures
      ).not.toHaveBeenCalled();
    });
  }
);