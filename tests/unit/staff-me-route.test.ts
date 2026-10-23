import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const getRequestAuthorization =
  vi.fn();

const dbExecute = vi.fn();

const unstableRethrow =
  vi.fn();

vi.mock(
  "next/navigation",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import(
          "next/navigation"
        )
      >();

    return {
      ...actual,
      unstable_rethrow:
        unstableRethrow,
    };
  }
);

vi.mock(
  "@/lib/rbac/request-authorization",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import(
          "@/lib/rbac/request-authorization"
        )
      >();

    return {
      ...actual,
      getRequestAuthorization,
    };
  }
);

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute: dbExecute,
    },
  })
);

describe("current staff route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for an unauthenticated request", async () => {
    const {
      UnauthenticatedError,
    } = await import(
      "@/lib/rbac/errors"
    );

    getRequestAuthorization
      .mockRejectedValue(
        new UnauthenticatedError()
      );

    const { GET } =
      await import(
        "@/app/api/staff/auth/me/route"
      );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    const response =
      await GET(request);

    expect(
      response.status
    ).toBe(401);

    await expect(
      response.json()
    ).resolves.toEqual({
      error: "Unauthenticated.",
    });

    expect(
      dbExecute
    ).not.toHaveBeenCalled();
  });

  it("returns the authenticated staff authorization profile", async () => {
    getRequestAuthorization
      .mockResolvedValue({
        userId: 25,
        publicId:
          "staff-public-id",
        departmentId: 2,
        departmentCode:
          "TRADE",
        roles: [
          "REVIEW_OFFICER",
        ],
        permissions: [
          "APPLICATION_VIEW",
          "APPLICATION_REVIEW",
          "APPLICATION_RECOMMEND",
        ],
      });

    dbExecute.mockResolvedValue([
      [
        {
          first_name:
            "Review",
          last_name:
            "Officer",
          email:
            "review@example.com",
        },
      ],
    ]);

    const { GET } =
      await import(
        "@/app/api/staff/auth/me/route"
      );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    const response =
      await GET(request);

    expect(
      response.status
    ).toBe(200);

    await expect(
      response.json()
    ).resolves.toEqual({
      user: {
        publicId:
          "staff-public-id",
        firstName:
          "Review",
        lastName:
          "Officer",
        email:
          "review@example.com",
        departmentCode:
          "TRADE",
        roles: [
          "REVIEW_OFFICER",
        ],
        permissions: [
          "APPLICATION_VIEW",
          "APPLICATION_REVIEW",
          "APPLICATION_RECOMMEND",
        ],
      },
    });

    expect(
      dbExecute
    ).toHaveBeenCalledWith(
      expect.stringContaining(
        "WHERE id = ?"
      ),
      [25]
    );
  });

  it("returns 401 if the authenticated user can no longer be loaded", async () => {
    getRequestAuthorization
      .mockResolvedValue({
        userId: 25,
        publicId:
          "staff-public-id",
        departmentId: 2,
        departmentCode:
          "TRADE",
        roles: [
          "REVIEW_OFFICER",
        ],
        permissions: [
          "APPLICATION_VIEW",
        ],
      });

    dbExecute.mockResolvedValue([
      [],
    ]);

    const { GET } =
      await import(
        "@/app/api/staff/auth/me/route"
      );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    const response =
      await GET(request);

    expect(
      response.status
    ).toBe(401);

    await expect(
      response.json()
    ).resolves.toEqual({
      error: "Unauthenticated.",
    });
  });

  it("returns 500 for an unexpected authorization failure", async () => {
    getRequestAuthorization
      .mockRejectedValue(
        new Error(
          "Database unavailable"
        )
      );

    const consoleError = vi
      .spyOn(
        console,
        "error"
      )
      .mockImplementation(
        () => {}
      );

    const { GET } =
      await import(
        "@/app/api/staff/auth/me/route"
      );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    const response =
      await GET(request);

    expect(
      response.status
    ).toBe(500);

    await expect(
      response.json()
    ).resolves.toEqual({
      error:
        "Unable to verify session.",
    });

    consoleError.mockRestore();
  });

  it("passes framework-controlled errors to Next.js before returning a generic 500 response", async () => {
    const frameworkError =
      new Error(
        "NEXT_PRERENDER_INTERRUPTED"
      );

    getRequestAuthorization
      .mockRejectedValue(
        frameworkError
      );

    unstableRethrow
      .mockImplementation(
        (error: unknown) => {
          if (
            error ===
            frameworkError
          ) {
            throw error;
          }
        }
      );

    const consoleError = vi
      .spyOn(
        console,
        "error"
      )
      .mockImplementation(
        () => {}
      );

    const { GET } =
      await import(
        "@/app/api/staff/auth/me/route"
      );

    const request = new Request(
      "http://localhost/api/staff/auth/me"
    );

    await expect(
      GET(request)
    ).rejects.toBe(
      frameworkError
    );

    expect(
      unstableRethrow
    ).toHaveBeenCalledWith(
      frameworkError
    );

    expect(
      consoleError
    ).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});