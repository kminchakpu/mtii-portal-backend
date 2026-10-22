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
  StaffRoleNotAssignedError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  removeRoleFromStaffUser:
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
    removeRoleFromStaffUser:
      mocks.removeRoleFromStaffUser,
  })
);

import {
  DELETE,
} from "@/app/api/staff/users/[publicId]/roles/[rolePublicId]/route";

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

function createRequest() {
  return new Request(
    `http://localhost/api/staff/users/${userPublicId}/roles/${role.publicId}`,
    {
      method: "DELETE",
    }
  );
}

function createCrossSiteRequest() {
  return new Request(
    `http://localhost/api/staff/users/${userPublicId}/roles/${role.publicId}`,
    {
      method: "DELETE",
      headers: {
        Origin:
          "https://attacker.example.com",
        "Sec-Fetch-Site":
          "cross-site",
      },
    }
  );
}

function createContext(
  overrides?: {
    publicId?: string;
    rolePublicId?: string;
  }
) {
  return {
    params:
      Promise.resolve({
        publicId:
          overrides?.publicId ??
          userPublicId,
        rolePublicId:
          overrides?.rolePublicId ??
          role.publicId,
      }),
  };
}

describe(
  "DELETE /api/staff/users/[publicId]/roles/[rolePublicId]",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks.removeRoleFromStaffUser
        .mockResolvedValue(
          role
        );
    });

    it("removes the role and returns 200", async () => {
      const request =
        createRequest();

      const response =
        await DELETE(
          request,
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

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
    });

    it("rejects a cross-site request before authentication or role removal", async () => {
      const response =
        await DELETE(
          createCrossSiteRequest(),
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
        mocks.removeRoleFromStaffUser
      ).not.toHaveBeenCalled();
    });

    it("passes the authorization context and public IDs to the service", async () => {
      const request =
        createRequest();

      await DELETE(
        request,
        createContext()
      );

      expect(
        mocks.getRequestAuthorization
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        mocks.removeRoleFromStaffUser
      ).toHaveBeenCalledWith(
        authorization,
        userPublicId,
        role.publicId
      );
    });

    it("does not expose the internal role ID", async () => {
      const response =
        await DELETE(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        body.role.id
      ).toBeUndefined();
    });

    it("returns 401 when unauthenticated", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await DELETE(
          createRequest(),
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
        mocks.removeRoleFromStaffUser
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when role removal is forbidden", async () => {
      mocks.removeRoleFromStaffUser
        .mockRejectedValue(
          new ForbiddenError()
        );

      const response =
        await DELETE(
          createRequest(),
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
      mocks.removeRoleFromStaffUser
        .mockRejectedValue(
          new StaffUserNotFoundError()
        );

      const response =
        await DELETE(
          createRequest(),
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
      mocks.removeRoleFromStaffUser
        .mockRejectedValue(
          new StaffRoleNotFoundError()
        );

      const response =
        await DELETE(
          createRequest(),
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

    it("returns 409 when the user does not hold the role", async () => {
      mocks.removeRoleFromStaffUser
        .mockRejectedValue(
          new StaffRoleNotAssignedError()
        );

      const response =
        await DELETE(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(409);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Staff role is not assigned to this user.",
      });
    });

    it("rethrows unexpected errors", async () => {
      const unexpectedError =
        new Error(
          "Unexpected failure"
        );

      mocks.removeRoleFromStaffUser
        .mockRejectedValue(
          unexpectedError
        );

      await expect(
        DELETE(
          createRequest(),
          createContext()
        )
      ).rejects.toBe(
        unexpectedError
      );
    });
  }
);