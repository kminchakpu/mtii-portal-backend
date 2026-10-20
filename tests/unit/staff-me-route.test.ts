import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findStaffSessionByToken = vi.fn();
const execute = vi.fn();

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    findStaffSessionByToken,
  })
);

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute,
    },
  })
);

describe("current staff route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a session cookie", async () => {
    const { GET } = await import(
      "@/app/api/staff/auth/me/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    const response = await GET(request);

    expect(response.status).toBe(401);

    expect(await response.json()).toEqual({
      error: "Unauthenticated.",
    });

    expect(
      findStaffSessionByToken
    ).not.toHaveBeenCalled();
  });

  it("rejects an invalid session", async () => {
    findStaffSessionByToken.mockResolvedValue(
      null
    );

    const { GET } = await import(
      "@/app/api/staff/auth/me/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/me",
      {
        headers: {
          cookie:
            "mtii_staff_session=invalid-token",
        },
      }
    );

    const response = await GET(request);

    expect(response.status).toBe(401);

    expect(
      findStaffSessionByToken
    ).toHaveBeenCalledWith(
      "invalid-token"
    );

    expect(execute).not.toHaveBeenCalled();
  });

  it("returns the authenticated staff profile", async () => {
    findStaffSessionByToken.mockResolvedValue({
      id: 10,
      publicId: "session-public-id",
      userId: 1,
      expiresAt: new Date(
        "2026-10-21T12:00:00.000Z"
      ),
      revokedAt: null,
    });

    execute.mockResolvedValue([
      [
        {
          public_id: "user-public-id",
          first_name: "Kevin",
          last_name: "Minchakpu",
          email: "kevin@example.com",
          department_code: "ADMIN",
        },
      ],
      [],
    ]);

    const { GET } = await import(
      "@/app/api/staff/auth/me/route"
    );

    const request = new Request(
      "http://localhost/api/staff/auth/me",
      {
        headers: {
          cookie:
            "mtii_staff_session=valid-token",
        },
      }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      user: {
        publicId: "user-public-id",
        firstName: "Kevin",
        lastName: "Minchakpu",
        email: "kevin@example.com",
        departmentCode: "ADMIN",
      },
    });
  });
});