import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const authenticateStaff = vi.fn();
const writeAuditLog = vi.fn();

vi.mock(
  "@/lib/auth/staff-auth-service",
  () => ({
    authenticateStaff,
    InvalidStaffCredentialsError:
      class InvalidStaffCredentialsError
        extends Error {
        constructor() {
          super("Invalid email or password.");
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

describe("staff login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in staff and sets the session cookie", async () => {
    authenticateStaff.mockResolvedValue({
      user: {
        id: 1,
        publicId: "user-public-id",
        firstName: "Kevin",
        lastName: "Minchakpu",
        email: "kevin@example.com",
        departmentId: 1,
        departmentCode: "ADMIN",
      },
      session: {
        token: "opaque-session-token",
        expiresAt: new Date(
          "2026-10-21T12:00:00.000Z"
        ),
      },
    });

    const { POST } = await import(
      "@/app/api/staff/auth/login/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "kevin@example.com",
          password: "ValidPassword123!",
        }),
      }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      user: {
        publicId: "user-public-id",
        firstName: "Kevin",
        lastName: "Minchakpu",
        email: "kevin@example.com",
        departmentCode: "ADMIN",
      },
    });

    expect(
      response.headers.get("set-cookie")
    ).toContain("mtii_staff_session=");

    expect(
      response.headers.get("set-cookie")
    ).toContain("HttpOnly");

    expect(
      response.headers.get("set-cookie")
    ).toContain("SameSite=lax");

    expect(writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 1,
      departmentId: 1,
      action: "STAFF_LOGIN",
      entityType: "USER",
      entityId: "user-public-id",
      metadata: {
        source: "staff-auth",
      },
    });
  });

  it("rejects a cross-site request before authentication", async () => {
    const { POST } = await import(
      "@/app/api/staff/auth/login/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Origin:
            "https://attacker.example.com",
          "Sec-Fetch-Site":
            "cross-site",
        },
        body: JSON.stringify({
          email: "kevin@example.com",
          password: "ValidPassword123!",
        }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(403);

    expect(await response.json()).toEqual({
      error:
        "Cross-site request forbidden.",
    });

    expect(
      authenticateStaff
    ).not.toHaveBeenCalled();

    expect(
      writeAuditLog
    ).not.toHaveBeenCalled();
  });

  it("rejects invalid credentials", async () => {
    const {
      InvalidStaffCredentialsError,
    } = await import(
      "@/lib/auth/staff-auth-service"
    );

    authenticateStaff.mockRejectedValue(
      new InvalidStaffCredentialsError()
    );

    const { POST } = await import(
      "@/app/api/staff/auth/login/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "wrong@example.com",
          password: "wrong-password",
        }),
      }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      error: "Invalid email or password.",
    });

    expect(
      writeAuditLog
    ).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const { POST } = await import(
      "@/app/api/staff/auth/login/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{invalid-json",
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);

    expect(await response.json()).toEqual({
      error: "Invalid request body.",
    });

    expect(
      authenticateStaff
    ).not.toHaveBeenCalled();
  });
});