import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findStaffSessionByToken = vi.fn();
const revokeStaffSession = vi.fn();
const writeAuditLog = vi.fn();

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    findStaffSessionByToken,
    revokeStaffSession,
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog,
  })
);

describe("staff logout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes the session and expires the cookie", async () => {
    findStaffSessionByToken.mockResolvedValue({
      id: 10,
      publicId: "session-public-id",
      userId: 1,
      expiresAt: new Date(
        "2026-10-21T12:00:00.000Z"
      ),
      revokedAt: null,
    });

    revokeStaffSession.mockResolvedValue(true);

    const { POST } = await import(
      "@/app/api/staff/auth/logout/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/logout",
      {
        method: "POST",
        headers: {
          cookie:
            "mtii_staff_session=opaque-token",
        },
      }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      success: true,
    });

    expect(
      findStaffSessionByToken
    ).toHaveBeenCalledWith(
      "opaque-token"
    );

    expect(
      revokeStaffSession
    ).toHaveBeenCalledWith(
      "opaque-token"
    );

    expect(writeAuditLog).toHaveBeenCalledWith({
      actorUserId: 1,
      action: "STAFF_LOGOUT",
      entityType: "SESSION",
      entityId: "session-public-id",
      metadata: {
        source: "staff-auth",
      },
    });

    const cookie =
      response.headers.get("set-cookie");

    expect(cookie).toContain(
      "mtii_staff_session="
    );

    expect(cookie).toContain("HttpOnly");

    expect(cookie).toContain(
      "Expires=Thu, 01 Jan 1970"
    );
  });

  it("succeeds when no session cookie exists", async () => {
    const { POST } = await import(
      "@/app/api/staff/auth/logout/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/logout",
      {
        method: "POST",
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);

    expect(
      findStaffSessionByToken
    ).not.toHaveBeenCalled();

    expect(
      revokeStaffSession
    ).not.toHaveBeenCalled();

    expect(
      writeAuditLog
    ).not.toHaveBeenCalled();
  });
});