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
  isSuperAdmin,
  listDepartments,
  listDepartmentsById,
  createDepartment,
  writeAuditLog,
  withTransaction,
} = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  requirePermission:
    vi.fn(),
  isSuperAdmin:
    vi.fn(),
  listDepartments:
    vi.fn(),
  listDepartmentsById:
    vi.fn(),
  createDepartment:
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
  "@/lib/rbac/department-scope",
  () => ({
    isSuperAdmin,
  })
);

vi.mock(
  "@/lib/departments/department-repository",
  () => ({
    listDepartments,
    listDepartmentsById,
    createDepartment,
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

const noDepartmentAuthorization = {
  userId: 3,
  publicId:
    "reporting-user-public-id",
  departmentId: null,
  departmentCode: null,
  roles: [
    "REPORTING_OFFICER",
  ],
  permissions: [
    "DEPARTMENT_VIEW",
  ],
};

const departments = [
  {
    id: 1,
    publicId:
      "admin-public-id",
    code: "ADMIN",
    name:
      "Administration",
    description:
      "System administration.",
    isActive: true,
    createdAt:
      new Date(
        "2026-10-01T10:00:00.000Z"
      ),
    updatedAt:
      new Date(
        "2026-10-01T10:00:00.000Z"
      ),
  },
  {
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
  },
];

function createRequest() {
  return new Request(
    "http://localhost/api/staff/departments"
  );
}

describe(
  "staff departments route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      requirePermission
        .mockImplementation(
          () => undefined
        );
    });

    it("returns all departments for an authorized Super Admin", async () => {
      getRequestAuthorization
        .mockResolvedValue(
          superAdminAuthorization
        );

      isSuperAdmin
        .mockReturnValue(
          true
        );

      listDepartments
        .mockResolvedValue(
          departments
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await GET(
          createRequest()
        );

      const body =
        await response.json();

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
        isSuperAdmin
      ).toHaveBeenCalledWith(
        superAdminAuthorization
      );

      expect(
        listDepartments
      ).toHaveBeenCalledOnce();

      expect(
        listDepartmentsById
      ).not.toHaveBeenCalled();

      expect(
        body.departments
      ).toHaveLength(2);

      expect(
        body.departments[0]
      ).toEqual({
        publicId:
          "admin-public-id",
        code: "ADMIN",
        name:
          "Administration",
        description:
          "System administration.",
        isActive: true,
        createdAt:
          "2026-10-01T10:00:00.000Z",
        updatedAt:
          "2026-10-01T10:00:00.000Z",
      });

      expect(
        body.departments[0].id
      ).toBeUndefined();
    });

    it("returns only the staff member's department for scoped access", async () => {
      getRequestAuthorization
        .mockResolvedValue(
          scopedAuthorization
        );

      isSuperAdmin
        .mockReturnValue(
          false
        );

      listDepartmentsById
        .mockResolvedValue([
          departments[1],
        ]);

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await GET(
          createRequest()
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
        listDepartments
      ).not.toHaveBeenCalled();

      expect(
        listDepartmentsById
      ).toHaveBeenCalledWith(
        2
      );

      expect(
        body.departments
      ).toHaveLength(1);

      expect(
        body.departments[0]
      ).toMatchObject({
        publicId:
          "trade-public-id",
        code: "TRADE",
        name:
          "Trade Department",
      });

      expect(
        body.departments[0].id
      ).toBeUndefined();
    });

    it("returns an empty list for an authorized non-Super Admin without a department", async () => {
      getRequestAuthorization
        .mockResolvedValue(
          noDepartmentAuthorization
        );

      isSuperAdmin
        .mockReturnValue(
          false
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await GET(
          createRequest()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(200);

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        noDepartmentAuthorization,
        "DEPARTMENT_VIEW"
      );

      expect(
        listDepartments
      ).not.toHaveBeenCalled();

      expect(
        listDepartmentsById
      ).not.toHaveBeenCalled();

      expect(body).toEqual({
        departments: [],
      });
    });

    it("returns 401 when the request is unauthenticated", async () => {
      getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await GET(
          createRequest()
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
        requirePermission
      ).not.toHaveBeenCalled();

      expect(
        listDepartments
      ).not.toHaveBeenCalled();

      expect(
        listDepartmentsById
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when the staff member lacks DEPARTMENT_VIEW", async () => {
      getRequestAuthorization
        .mockResolvedValue(
          scopedAuthorization
        );

      requirePermission
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const {
        GET,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await GET(
          createRequest()
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
        listDepartments
      ).not.toHaveBeenCalled();

      expect(
        listDepartmentsById
      ).not.toHaveBeenCalled();
    });
  }
);