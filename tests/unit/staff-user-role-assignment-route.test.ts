import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";
import {
  StaffRoleAlreadyAssignedError,
  StaffRoleInactiveError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  assignRoleToStaffUser:
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
  "@/lib/staff/staff-role-service",
  () => ({
    assignRoleToStaffUser:
      mocks.assignRoleToStaffUser,
  })
);

import {
  POST,
} from "@/app/api/staff/users/[publicId]/roles/route";

const authorization = {
  userId: 1,
  publicId:
    "actor-public-id",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: [
    "DEPARTMENT_ADMIN",
  ],
  permissions: [
    "ROLE_ASSIGN",
  ],
};

const userPublicId =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const role = {
  id: 4,
  publicId:
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  code:
    "REVIEW_OFFICER",
  name:
    "Review Officer",
  description:
    "Reviews applications.",
  isActive: true,
  createdAt:
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
  updatedAt:
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
};

function createRequest(
  body: unknown
) {
  return new Request(
    `http://localhost/api/staff/users/${userPublicId}/roles`,
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      body:
        JSON.stringify(body),
    }
  );
}

function createCrossSiteRequest(
  body: unknown
) {
  return new Request(
    `http://localhost/api/staff/users/${userPublicId}/roles`,
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
      body:
        JSON.stringify(body),
    }
  );
}

function createContext() {
  return {
    params:
      Promise.resolve({
        publicId:
          userPublicId,
      }),
  };
}

describe(
  "POST /api/staff/users/[publicId]/roles",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks.assignRoleToStaffUser
        .mockResolvedValue(
          role
        );
    });

    it("assigns a role and returns 201", async () => {
      const request =
        createRequest({
          rolePublicId:
            role.publicId,
        });

      const response =
        await POST(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(201);

      await expect(
        response.json()
      ).resolves.toEqual({
        role: {
          publicId:
            role.publicId,
          code:
            role.code,
          name:
            role.name,
          description:
            role.description,
          isActive:
            role.isActive,
          createdAt:
            role.createdAt.toISOString(),
          updatedAt:
            role.updatedAt.toISOString(),
        },
      });

      expect(
        mocks.getRequestAuthorization
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        mocks.assignRoleToStaffUser
      ).toHaveBeenCalledWith(
        authorization,
        userPublicId,
        role.publicId
      );
    });

    it("rejects a cross-site request before authentication or role assignment", async () => {
      const response =
        await POST(
          createCrossSiteRequest({
            rolePublicId:
              role.publicId,
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Cross-site request forbidden.",
      });

      expect(
        mocks.getRequestAuthorization
      ).not.toHaveBeenCalled();

      expect(
        mocks.assignRoleToStaffUser
      ).not.toHaveBeenCalled();
    });

    it("does not expose the internal role ID", async () => {
      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
          }),
          createContext()
        );

      const body =
        await response.json();

      expect(
        body.role.id
      ).toBeUndefined();
    });

    it("returns 400 for malformed JSON", async () => {
      const request =
        new Request(
          `http://localhost/api/staff/users/${userPublicId}/roles`,
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body: "{",
          }
        );

      const response =
        await POST(
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
          "Invalid JSON request body.",
      });

      expect(
        mocks.assignRoleToStaffUser
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when rolePublicId is missing", async () => {
      const response =
        await POST(
          createRequest({}),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      const body =
        await response.json();

      expect(body).toHaveProperty(
        "error",
        "Invalid staff role data."
      );

      expect(
        body.details
      ).toBeDefined();

      expect(
        mocks.assignRoleToStaffUser
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid role UUID", async () => {
      const response =
        await POST(
          createRequest({
            rolePublicId:
              "not-a-uuid",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        mocks.assignRoleToStaffUser
      ).not.toHaveBeenCalled();
    });

    it("rejects extra request fields", async () => {
      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
            roleId: 4,
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        mocks.assignRoleToStaffUser
      ).not.toHaveBeenCalled();
    });

    it("returns 401 when unauthenticated", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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
    });

    it("returns 403 when role assignment is forbidden", async () => {
      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          new ForbiddenError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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

    it("returns 404 when the staff user does not exist", async () => {
      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          new StaffUserNotFoundError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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

    it("returns 404 when the role does not exist", async () => {
      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          new StaffRoleNotFoundError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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
          "Staff role not found.",
      });
    });

    it("returns 409 when the role is inactive", async () => {
      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          new StaffRoleInactiveError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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
          "Staff role is inactive.",
      });
    });

    it("returns 409 when the role is already assigned", async () => {
      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          new StaffRoleAlreadyAssignedError()
        );

      const response =
        await POST(
          createRequest({
            rolePublicId:
              role.publicId,
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
          "Staff role is already assigned to this user.",
      });
    });

    it("rethrows unexpected errors", async () => {
      const unexpectedError =
        new Error(
          "Unexpected failure"
        );

      mocks.assignRoleToStaffUser
        .mockRejectedValue(
          unexpectedError
        );

      await expect(
        POST(
          createRequest({
            rolePublicId:
              role.publicId,
          }),
          createContext()
        )
      ).rejects.toBe(
        unexpectedError
      );
    });
  }
);