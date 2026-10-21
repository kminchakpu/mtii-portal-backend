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

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  findStaffRoleByPublicId:
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
  "@/lib/staff/staff-role-repository",
  () => ({
    findStaffRoleByPublicId:
      mocks.findStaffRoleByPublicId,
  })
);

import {
  GET,
} from "@/app/api/staff/roles/[publicId]/route";

const rolePublicId =
  "11111111-1111-4111-8111-111111111111";

const authorization:
  AuthorizationContext = {
    userId: 1,
    publicId:
      "staff-public-id",
    departmentId: 2,
    departmentCode: "TRADE",
    roles: [
      "DEPARTMENT_ADMIN",
    ],
    permissions: [
      "ROLE_VIEW",
    ],
  };

const role = {
  id: 3,
  publicId: rolePublicId,
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
      "2026-10-02T10:00:00.000Z"
    ),
};

function createRequest() {
  return new Request(
    `http://localhost/api/staff/roles/${rolePublicId}`
  );
}

function createContext(
  publicId = rolePublicId
) {
  return {
    params:
      Promise.resolve({
        publicId,
      }),
  };
}

describe(
  "GET /api/staff/roles/[publicId]",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks.findStaffRoleByPublicId
        .mockResolvedValue(
          role
        );
    });

    it("returns a staff role for staff with ROLE_VIEW permission", async () => {
      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        mocks.findStaffRoleByPublicId
      ).toHaveBeenCalledWith(
        rolePublicId
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        role: {
          publicId:
            rolePublicId,
          code:
            "REVIEW_OFFICER",
          name:
            "Review Officer",
          description:
            "Reviews applications.",
          isActive: true,
          createdAt:
            "2026-10-01T10:00:00.000Z",
          updatedAt:
            "2026-10-02T10:00:00.000Z",
        },
      });
    });

    it("does not expose the internal role ID", async () => {
      const response =
        await GET(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        body.role
      ).not.toHaveProperty(
        "id"
      );
    });

    it("allows inactive roles to be inspected", async () => {
      mocks.findStaffRoleByPublicId
        .mockResolvedValue({
          ...role,
          isActive: false,
        });

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      const body =
        await response.json();

      expect(
        body.role.isActive
      ).toBe(false);
    });

    it("returns 404 when the role does not exist", async () => {
      mocks.findStaffRoleByPublicId
        .mockResolvedValue(
          null
        );

      const response =
        await GET(
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

    it("returns 401 when the request is unauthenticated", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await GET(
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
        mocks.findStaffRoleByPublicId
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff lacks ROLE_VIEW permission", async () => {
      mocks.getRequestAuthorization
        .mockResolvedValue({
          ...authorization,
          permissions: [],
        });

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Forbidden.",
      });

      expect(
        mocks.findStaffRoleByPublicId
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when authorization rejects the request", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new ForbiddenError()
        );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Forbidden.",
      });

      expect(
        mocks.findStaffRoleByPublicId
      ).not.toHaveBeenCalled();
    });

    it("rethrows unexpected repository errors", async () => {
      const unexpectedError =
        new Error(
          "Database unavailable."
        );

      mocks.findStaffRoleByPublicId
        .mockRejectedValue(
          unexpectedError
        );

      await expect(
        GET(
          createRequest(),
          createContext()
        )
      ).rejects.toBe(
        unexpectedError
      );
    });
  }
);