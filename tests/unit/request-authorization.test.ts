import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findStaffSessionByToken =
  vi.fn();

const getAuthorizationContext =
  vi.fn();

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    findStaffSessionByToken,
  })
);

vi.mock(
  "@/lib/rbac/authorization-repository",
  () => ({
    getAuthorizationContext,
  })
);

describe("request authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without a session cookie", async () => {
    const {
      getRequestAuthorization,
    } = await import(
      "@/lib/rbac/request-authorization"
    );

    const {
      UnauthenticatedError,
    } = await import(
      "@/lib/rbac/errors"
    );

    const request = new Request(
      "http://localhost/api/staff/test"
    );

    await expect(
      getRequestAuthorization(request)
    ).rejects.toBeInstanceOf(
      UnauthenticatedError
    );

    expect(
      findStaffSessionByToken
    ).not.toHaveBeenCalled();

    expect(
      getAuthorizationContext
    ).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired session", async () => {
    findStaffSessionByToken.mockResolvedValue(
      null
    );

    const {
      getRequestAuthorization,
    } = await import(
      "@/lib/rbac/request-authorization"
    );

    const {
      UnauthenticatedError,
    } = await import(
      "@/lib/rbac/errors"
    );

    const request = new Request(
      "http://localhost/api/staff/test",
      {
        headers: {
          cookie:
            "mtii_staff_session=invalid-token",
        },
      }
    );

    await expect(
      getRequestAuthorization(request)
    ).rejects.toBeInstanceOf(
      UnauthenticatedError
    );

    expect(
      findStaffSessionByToken
    ).toHaveBeenCalledWith(
      "invalid-token"
    );

    expect(
      getAuthorizationContext
    ).not.toHaveBeenCalled();
  });

  it("rejects a session whose user has no authorization context", async () => {
    findStaffSessionByToken.mockResolvedValue({
      id: 10,
      publicId: "session-public-id",
      userId: 25,
      expiresAt: new Date(
        "2026-10-21T12:00:00.000Z"
      ),
      revokedAt: null,
    });

    getAuthorizationContext.mockResolvedValue(
      null
    );

    const {
      getRequestAuthorization,
    } = await import(
      "@/lib/rbac/request-authorization"
    );

    const {
      UnauthenticatedError,
    } = await import(
      "@/lib/rbac/errors"
    );

    const request = new Request(
      "http://localhost/api/staff/test",
      {
        headers: {
          cookie:
            "mtii_staff_session=valid-token",
        },
      }
    );

    await expect(
      getRequestAuthorization(request)
    ).rejects.toBeInstanceOf(
      UnauthenticatedError
    );

    expect(
      getAuthorizationContext
    ).toHaveBeenCalledWith(25);
  });

  it("returns the authorization context for authenticated staff", async () => {
    findStaffSessionByToken.mockResolvedValue({
      id: 10,
      publicId: "session-public-id",
      userId: 25,
      expiresAt: new Date(
        "2026-10-21T12:00:00.000Z"
      ),
      revokedAt: null,
    });

    const context = {
      userId: 25,
      publicId: "staff-public-id",
      departmentId: 2,
      departmentCode: "TRADE",
      roles: ["REVIEW_OFFICER"],
      permissions: [
        "APPLICATION_VIEW",
        "APPLICATION_REVIEW",
        "APPLICATION_RECOMMEND",
      ],
    };

    getAuthorizationContext.mockResolvedValue(
      context
    );

    const {
      getRequestAuthorization,
    } = await import(
      "@/lib/rbac/request-authorization"
    );

    const request = new Request(
      "http://localhost/api/staff/test",
      {
        headers: {
          cookie:
            "mtii_staff_session=valid-token",
        },
      }
    );

    await expect(
      getRequestAuthorization(request)
    ).resolves.toEqual(context);

    expect(
      findStaffSessionByToken
    ).toHaveBeenCalledWith(
      "valid-token"
    );

    expect(
      getAuthorizationContext
    ).toHaveBeenCalledWith(25);
  });
});