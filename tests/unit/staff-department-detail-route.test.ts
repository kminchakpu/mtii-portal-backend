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

const {
  getRequestAuthorization,
  requirePermission,
  requireDepartmentAccess,
  findDepartmentByPublicId,
  updateDepartment,
  revokeSessionsForDepartment,
  writeAuditLog,
  withTransaction,
} = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  requirePermission:
    vi.fn(),
  requireDepartmentAccess:
    vi.fn(),
  findDepartmentByPublicId:
    vi.fn(),
  updateDepartment:
    vi.fn(),
  revokeSessionsForDepartment:
    vi.fn(),
  writeAuditLog:
    vi.fn(),
  withTransaction:
    vi.fn(),
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
  "@/lib/departments/department-repository",
  () => ({
    findDepartmentByPublicId,
    updateDepartment,
  })
);

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    revokeSessionsForDepartment,
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog,
  })
);

vi.mock(
  "@/lib/db/transaction",
  () => ({
    withTransaction,
  })
);

const department = {
  id: 2,
  publicId:
    "trade-public-id",
  code: "TRADE",
  name:
    "Trade Department",
  description:
    "Handles trade services.",
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

const scopedAuthorization = {
  userId: 2,
  publicId:
    "trade-user-public-id",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: [
    "DEPARTMENT_ADMIN",
  ],
  permissions: [
    "DEPARTMENT_VIEW",
  ],
};

const superAdminAuthorization = {
  userId: 1,
  publicId:
    "super-admin-public-id",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: [
    "SUPER_ADMIN",
  ],
  permissions: [
    "DEPARTMENT_VIEW",
    "DEPARTMENT_MANAGE",
  ],
};

function createRequest() {
  return new Request(
    "http://localhost/api/staff/departments/trade-public-id"
  );
}

function createContext(
  publicId =
    "trade-public-id"
) {
  return {
    params:
      Promise.resolve({
        publicId,
      }),
  };
}

describe(
  "staff department detail route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getRequestAuthorization
        .mockResolvedValue(
          scopedAuthorization
        );

      requirePermission
        .mockImplementation(
          () => undefined
        );

      requireDepartmentAccess
        .mockImplementation(
          () => undefined
        );

      findDepartmentByPublicId
        .mockResolvedValue(
          department
        );
    });

    it("returns a department when the staff member is authorized", async () => {
      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(200);

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        scopedAuthorization,
        "DEPARTMENT_VIEW"
      );

      expect(
        findDepartmentByPublicId
      ).toHaveBeenCalledWith(
        "trade-public-id"
      );

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        scopedAuthorization,
        2
      );

      expect(
        body.department
      ).toEqual({
        publicId:
          "trade-public-id",
        code: "TRADE",
        name:
          "Trade Department",
        description:
          "Handles trade services.",
        isActive: true,
        createdAt:
          "2026-10-01T10:00:00.000Z",
        updatedAt:
          "2026-10-01T10:00:00.000Z",
      });

      expect(
        body.department.id
      ).toBeUndefined();
    });

    it("allows a Super Admin to access another department", async () => {
      getRequestAuthorization
        .mockResolvedValue(
          superAdminAuthorization
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        superAdminAuthorization,
        "DEPARTMENT_VIEW"
      );

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        superAdminAuthorization,
        2
      );
    });

    it("returns 401 when the request is unauthenticated", async () => {
      getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(401);

      expect(body).toEqual({
        error:
          "Unauthenticated.",
      });

      expect(
        findDepartmentByPublicId
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when the staff member lacks DEPARTMENT_VIEW", async () => {
      requirePermission
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(403);

      expect(body).toEqual({
        error:
          "Forbidden.",
      });

      expect(
        findDepartmentByPublicId
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when the staff member tries to access another department", async () => {
      requireDepartmentAccess
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(403);

      expect(body).toEqual({
        error:
          "Forbidden.",
      });

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        scopedAuthorization,
        2
      );
    });

    it("returns 404 when the department does not exist", async () => {
      findDepartmentByPublicId
        .mockResolvedValue(
          null
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await GET(
          createRequest(),
          createContext(
            "missing-public-id"
          )
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(404);

      expect(body).toEqual({
        error:
          "Department not found.",
      });

      expect(
        requireDepartmentAccess
      ).not.toHaveBeenCalled();
    });
  }
);