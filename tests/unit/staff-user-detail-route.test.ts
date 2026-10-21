import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getRequestAuthorization,
  requirePermission,
  requireDepartmentAccess,
  findStaffUserByPublicId,
  updateStaffAccount,
} = vi.hoisted(() => ({
  getRequestAuthorization: vi.fn(),
  requirePermission: vi.fn(),
  requireDepartmentAccess: vi.fn(),
  findStaffUserByPublicId: vi.fn(),
  updateStaffAccount: vi.fn(),
}));

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/rbac/permission-guard",
  () => ({
    requirePermission,
  })
);

vi.mock(
  "@/lib/rbac/department-guard",
  () => ({
    requireDepartmentAccess,
  })
);

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    findStaffUserByPublicId,
  })
);

vi.mock(
  "@/lib/staff/staff-user-service",
  () => ({
    updateStaffAccount,
  })
);

import { GET } from "@/app/api/staff/users/[publicId]/route";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

const superAdminContext = {
  userId: 1,
  publicId:
    "super-admin-public-id",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: ["SUPER_ADMIN"],
  permissions: ["USER_VIEW"],
};

const tradeContext = {
  userId: 2,
  publicId:
    "trade-admin-public-id",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: [
    "DEPARTMENT_ADMIN",
  ],
  permissions: ["USER_VIEW"],
};

const tradeUser = {
  id: 10,
  publicId:
    "trade-user-public-id",
  departmentId: 2,
  departmentPublicId:
    "trade-department-public-id",
  departmentCode: "TRADE",
  departmentName:
    "Trade Department",
  firstName: "Amina",
  lastName: "Ibrahim",
  email:
    "amina@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(
    "2026-09-01T08:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-19T10:00:00.000Z"
  ),
  roles: [
    "DEPARTMENT_ADMIN",
  ],
};

function createRequest() {
  return new Request(
    "http://localhost/api/staff/users/trade-user-public-id",
    {
      method: "GET",
    }
  );
}

function createContext(
  publicId =
    "trade-user-public-id"
) {
  return {
    params: Promise.resolve({
      publicId,
    }),
  };
}

describe(
  "staff user detail route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns a staff user for a Super Admin", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          superAdminContext
        );

      findStaffUserByPublicId
        .mockResolvedValueOnce(
          tradeUser
        );

      const request =
        createRequest();

      const response =
        await GET(
          request,
          createContext()
        );

      expect(
        getRequestAuthorization
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        superAdminContext,
        "USER_VIEW"
      );

      expect(
        findStaffUserByPublicId
      ).toHaveBeenCalledWith(
        "trade-user-public-id"
      );

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        superAdminContext,
        2
      );

      expect(
        response.status
      ).toBe(200);

      const body =
        await response.json();

      expect(
        body.user
      ).toEqual({
        publicId:
          "trade-user-public-id",
        department: {
          publicId:
            "trade-department-public-id",
          code: "TRADE",
          name:
            "Trade Department",
        },
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        isActive: true,
        lastLoginAt: null,
        passwordChangedAt:
          null,
        createdAt:
          "2026-09-01T08:00:00.000Z",
        updatedAt:
          "2026-10-19T10:00:00.000Z",
        roles: [
          "DEPARTMENT_ADMIN",
        ],
      });

      expect(
        body.user
      ).not.toHaveProperty(
        "id"
      );

      expect(
        body.user
      ).not.toHaveProperty(
        "departmentId"
      );
    });

    it("allows access to a user in the same department", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          tradeContext
        );

      findStaffUserByPublicId
        .mockResolvedValueOnce(
          tradeUser
        );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        tradeContext,
        2
      );

      expect(
        response.status
      ).toBe(200);
    });

    it("returns 404 when the staff user does not exist", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          superAdminContext
        );

      findStaffUserByPublicId
        .mockResolvedValueOnce(
          null
        );

      const response =
        await GET(
          createRequest(),
          createContext(
            "missing-user"
          )
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

      expect(
        requireDepartmentAccess
      ).not.toHaveBeenCalled();
    });

    it("returns 403 for a staff user outside the caller's department", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          tradeContext
        );

      findStaffUserByPublicId
        .mockResolvedValueOnce({
          ...tradeUser,
          departmentId: 3,
          departmentPublicId:
            "coop-department-public-id",
          departmentCode:
            "COOP",
          departmentName:
            "Cooperative Department",
        });

      requireDepartmentAccess
        .mockImplementationOnce(
          () => {
            throw new ForbiddenError();
          }
        );

      const response =
        await GET(
          createRequest(),
          createContext(
            "coop-user-public-id"
          )
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        tradeContext,
        3
      );
    });

    it("returns 403 when a non-Super-Admin tries to view an unassigned user", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          tradeContext
        );

      findStaffUserByPublicId
        .mockResolvedValueOnce({
          ...tradeUser,
          departmentId: null,
          departmentPublicId:
            null,
          departmentCode: null,
          departmentName: null,
        });

      const response =
        await GET(
          createRequest(),
          createContext(
            "unassigned-user"
          )
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        requireDepartmentAccess
      ).not.toHaveBeenCalled();
    });

    it("returns 401 when unauthenticated", async () => {
      getRequestAuthorization
        .mockRejectedValueOnce(
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

      expect(
        findStaffUserByPublicId
      ).not.toHaveBeenCalled();
    });

    it("returns 403 without USER_VIEW", async () => {
      getRequestAuthorization
        .mockResolvedValueOnce(
          tradeContext
        );

      requirePermission
        .mockImplementationOnce(
          () => {
            throw new ForbiddenError();
          }
        );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        findStaffUserByPublicId
      ).not.toHaveBeenCalled();
    });

    it("rethrows unexpected errors", async () => {
      const error =
        new Error(
          "Unexpected database failure"
        );

      getRequestAuthorization
        .mockResolvedValueOnce(
          superAdminContext
        );

      findStaffUserByPublicId
        .mockRejectedValueOnce(
          error
        );

      await expect(
        GET(
          createRequest(),
          createContext()
        )
      ).rejects.toBe(error);
    });
  }
);