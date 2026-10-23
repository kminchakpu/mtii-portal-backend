import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";
import {
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
  StaffEmailConflictError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  findStaffUserByPublicId:
    vi.fn(),
  updateStaffAccount:
    vi.fn(),
}));

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization:
      mocks.getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    findStaffUserByPublicId:
      mocks.findStaffUserByPublicId,
  })
);

vi.mock(
  "@/lib/staff/staff-user-service",
  () => ({
    updateStaffAccount:
      mocks.updateStaffAccount,
  })
);

import {
  PATCH,
} from "@/app/api/staff/users/[publicId]/route";

const publicId =
  "33333333-3333-4333-8333-333333333333";

const departmentPublicId =
  "11111111-1111-4111-8111-111111111111";

const authorization:
  AuthorizationContext = {
    userId: 1,
    publicId:
      "super-admin-public-id",
    departmentId: 1,
    departmentCode: "ADMIN",
    roles: ["SUPER_ADMIN"],
    permissions: [
      "USER_VIEW",
      "USER_MANAGE",
      "ROLE_VIEW",
      "ROLE_ASSIGN",
    ],
  };

const updatedUser = {
  id: 25,
  publicId,
  departmentId: 2,
  departmentPublicId,
  departmentCode: "TRADE",
  departmentName:
    "Trade Department",
  firstName: "Maryam",
  lastName: "Ibrahim",
  email:
    "maryam@example.com",
  isActive: true,
  lastLoginAt: new Date(
    "2026-10-20T08:00:00.000Z"
  ),
  passwordChangedAt:
    new Date(
      "2026-10-19T08:00:00.000Z"
    ),
  createdAt: new Date(
    "2026-10-18T08:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-21T08:00:00.000Z"
  ),
  roles: [
    "REVIEW_OFFICER",
  ],
};

function createContext(
  id = publicId
) {
  return {
    params: Promise.resolve({
      publicId: id,
    }),
  };
}

function createRequest(
  body: unknown
) {
  return new Request(
    `http://localhost/api/staff/users/${publicId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

function createCrossSiteRequest(
  body: unknown
) {
  return new Request(
    `http://localhost/api/staff/users/${publicId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Origin:
          "https://attacker.example.com",
        "Sec-Fetch-Site":
          "cross-site",
      },
      body: JSON.stringify(body),
    }
  );
}

describe(
  "PATCH /api/staff/users/[publicId]",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks.updateStaffAccount
        .mockResolvedValue(
          updatedUser
        );
    });

    it("updates a staff account and returns the external staff representation", async () => {
      const request =
        createRequest({
          firstName: "Maryam",
          email:
            "maryam@example.com",
        });

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      await expect(
        response.json()
      ).resolves.toEqual({
        user: {
          publicId,
          department: {
            publicId:
              departmentPublicId,
            code: "TRADE",
            name:
              "Trade Department",
          },
          firstName: "Maryam",
          lastName:
            "Ibrahim",
          email:
            "maryam@example.com",
          isActive: true,
          lastLoginAt:
            "2026-10-20T08:00:00.000Z",
          passwordChangedAt:
            "2026-10-19T08:00:00.000Z",
          createdAt:
            "2026-10-18T08:00:00.000Z",
          updatedAt:
            "2026-10-21T08:00:00.000Z",
          roles: [
            "REVIEW_OFFICER",
          ],
        },
      });

      expect(
        mocks.updateStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        publicId,
        {
          firstName:
            "Maryam",
          email:
            "maryam@example.com",
        }
      );
    });

    it("rejects a cross-site request before authentication or staff account update", async () => {
      const response =
        await PATCH(
          createCrossSiteRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        );

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Cross-site request forbidden.",
      });

      expect(
        response.status
      ).toBe(403);

      expect(
        mocks.getRequestAuthorization
      ).not.toHaveBeenCalled();

      expect(
        mocks.findStaffUserByPublicId
      ).not.toHaveBeenCalled();

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("normalizes the email before updating the staff account", async () => {
      const request =
        createRequest({
          email:
            "  MARYAM@EXAMPLE.COM  ",
        });

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        mocks.updateStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        publicId,
        {
          email:
            "maryam@example.com",
        }
      );
    });

    it("supports changing the department", async () => {
      const request =
        createRequest({
          departmentPublicId:
            "22222222-2222-4222-8222-222222222222",
        });

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        mocks.updateStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        publicId,
        {
          departmentPublicId:
            "22222222-2222-4222-8222-222222222222",
        }
      );
    });

    it("supports making a staff account unassigned", async () => {
      const request =
        createRequest({
          departmentPublicId:
            null,
        });

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        mocks.updateStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        publicId,
        {
          departmentPublicId:
            null,
        }
      );
    });

    it("supports activation status updates", async () => {
      const request =
        createRequest({
          isActive: false,
        });

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        mocks.updateStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        publicId,
        {
          isActive: false,
        }
      );
    });

    it("returns 400 for malformed JSON", async () => {
      const request =
        new Request(
          `http://localhost/api/staff/users/${publicId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: "{invalid-json",
          }
        );

      const response =
        await PATCH(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Invalid JSON body.",
      });

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty update", async () => {
      const response =
        await PATCH(
          createRequest({}),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      const body =
        await response.json();

      expect(
        body.error
      ).toBe(
        "Invalid staff user data."
      );

      expect(
        body.issues
      ).toBeDefined();

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid department public ID", async () => {
      const response =
        await PATCH(
          createRequest({
            departmentPublicId:
              "not-a-uuid",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      const body =
        await response.json();

      expect(
        body.error
      ).toBe(
        "Invalid staff user data."
      );

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("rejects password updates through this endpoint", async () => {
      const response =
        await PATCH(
          createRequest({
            password:
              "NewPassword123!",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("rejects role updates through this endpoint", async () => {
      const response =
        await PATCH(
          createRequest({
            roles: [
              "DIRECTOR",
            ],
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 401 when the request is unauthenticated", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await PATCH(
          createRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(401);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Unauthenticated.",
      });

      expect(
        mocks.updateStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff account management is forbidden", async () => {
      mocks.updateStaffAccount
        .mockRejectedValue(
          new ForbiddenError()
        );

      const response =
        await PATCH(
          createRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error: "Forbidden.",
      });
    });

    it("returns 409 for a duplicate email address", async () => {
      mocks.updateStaffAccount
        .mockRejectedValue(
          new StaffEmailConflictError()
        );

      const response =
        await PATCH(
          createRequest({
            email:
              "existing@example.com",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(409);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "A staff account with this email address already exists.",
      });
    });

    it("returns 404 when the staff user does not exist", async () => {
      mocks.updateStaffAccount
        .mockRejectedValue(
          new StaffUserNotFoundError()
        );

      const response =
        await PATCH(
          createRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(404);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Staff user not found.",
      });
    });

    it("returns 404 when the requested department does not exist", async () => {
      mocks.updateStaffAccount
        .mockRejectedValue(
          new StaffDepartmentNotFoundError()
        );

      const response =
        await PATCH(
          createRequest({
            departmentPublicId:
              "22222222-2222-4222-8222-222222222222",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(404);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Department not found.",
      });
    });

    it("returns 409 when the requested department is inactive", async () => {
      mocks.updateStaffAccount
        .mockRejectedValue(
          new StaffDepartmentInactiveError()
        );

      const response =
        await PATCH(
          createRequest({
            departmentPublicId:
              "22222222-2222-4222-8222-222222222222",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(409);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Department is inactive.",
      });
    });

    it("does not expose internal IDs in the response", async () => {
      const response =
        await PATCH(
          createRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        );

      const body =
        await response.json();

      expect(
        body.user.id
      ).toBeUndefined();

      expect(
        body.user.departmentId
      ).toBeUndefined();

      expect(
        body.user.passwordHash
      ).toBeUndefined();
    });

    it("serializes an unassigned staff account with a null department", async () => {
      mocks.updateStaffAccount
        .mockResolvedValue({
          ...updatedUser,
          departmentId: null,
          departmentPublicId:
            null,
          departmentCode: null,
          departmentName: null,
        });

      const response =
        await PATCH(
          createRequest({
            departmentPublicId:
              null,
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      const body =
        await response.json();

      expect(
        body.user.department
      ).toBeNull();
    });

    it("rethrows unexpected errors", async () => {
      const unexpectedError =
        new Error(
          "Unexpected database failure."
        );

      mocks.updateStaffAccount
        .mockRejectedValue(
          unexpectedError
        );

      await expect(
        PATCH(
          createRequest({
            firstName:
              "Maryam",
          }),
          createContext()
        )
      ).rejects.toBe(
        unexpectedError
      );
    });
  }
);