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
  listStaffUsers,
  listStaffUsersByDepartment,
  createStaffAccount,
} = vi.hoisted(() => ({
  getRequestAuthorization: vi.fn(),
  requirePermission: vi.fn(),
  listStaffUsers: vi.fn(),
  listStaffUsersByDepartment: vi.fn(),
  createStaffAccount: vi.fn(),
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
  "@/lib/staff/staff-user-repository",
  () => ({
    listStaffUsers,
    listStaffUsersByDepartment,
  })
);

vi.mock(
  "@/lib/staff/staff-user-service",
  () => ({
    createStaffAccount,
  })
);

import { GET } from "@/app/api/staff/users/route";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

function createRequest() {
  return new Request(
    "http://localhost/api/staff/users",
    {
      method: "GET",
    }
  );
}

const superAdminContext = {
  userId: 1,
  publicId: "super-admin-public-id",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: ["SUPER_ADMIN"],
  permissions: ["USER_VIEW"],
};

const departmentContext = {
  userId: 2,
  publicId: "trade-admin-public-id",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: ["DEPARTMENT_ADMIN"],
  permissions: ["USER_VIEW"],
};

const unassignedContext = {
  userId: 3,
  publicId: "unassigned-public-id",
  departmentId: null,
  departmentCode: null,
  roles: ["AUDITOR"],
  permissions: ["USER_VIEW"],
};

const tradeUser = {
  id: 2,
  publicId: "trade-user-public-id",
  departmentId: 2,
  departmentPublicId:
    "trade-department-public-id",
  departmentCode: "TRADE",
  departmentName: "Trade Department",
  firstName: "Amina",
  lastName: "Ibrahim",
  email: "amina@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(
    "2026-09-01T08:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-19T10:00:00.000Z"
  ),
  roles: ["DEPARTMENT_ADMIN"],
};

const coopUser = {
  id: 3,
  publicId: "coop-user-public-id",
  departmentId: 3,
  departmentPublicId:
    "coop-department-public-id",
  departmentCode: "COOP",
  departmentName:
    "Cooperative Department",
  firstName: "Musa",
  lastName: "Adamu",
  email: "musa@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(
    "2026-09-05T08:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-09-05T08:00:00.000Z"
  ),
  roles: ["REVIEW_OFFICER"],
};

describe("staff users route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns all staff users for a Super Admin", async () => {
    getRequestAuthorization.mockResolvedValueOnce(
      superAdminContext
    );

    listStaffUsers.mockResolvedValueOnce([
      tradeUser,
      coopUser,
    ]);

    const request = createRequest();
    const response = await GET(request);

    expect(
      getRequestAuthorization
    ).toHaveBeenCalledWith(request);

    expect(
      requirePermission
    ).toHaveBeenCalledWith(
      superAdminContext,
      "USER_VIEW"
    );

    expect(
      listStaffUsers
    ).toHaveBeenCalledOnce();

    expect(
      listStaffUsersByDepartment
    ).not.toHaveBeenCalled();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.users).toHaveLength(2);

    expect(body.users[0]).toEqual({
      publicId: "trade-user-public-id",
      department: {
        publicId:
          "trade-department-public-id",
        code: "TRADE",
        name: "Trade Department",
      },
      firstName: "Amina",
      lastName: "Ibrahim",
      email: "amina@example.com",
      isActive: true,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt:
        "2026-09-01T08:00:00.000Z",
      updatedAt:
        "2026-10-19T10:00:00.000Z",
      roles: ["DEPARTMENT_ADMIN"],
    });

    expect(
      body.users[0]
    ).not.toHaveProperty("id");

    expect(
      body.users[0]
    ).not.toHaveProperty(
      "departmentId"
    );
  });

  it("returns only the staff member's department for a scoped user", async () => {
    getRequestAuthorization.mockResolvedValueOnce(
      departmentContext
    );

    listStaffUsersByDepartment.mockResolvedValueOnce(
      [tradeUser]
    );

    const request = createRequest();
    const response = await GET(request);

    expect(
      getRequestAuthorization
    ).toHaveBeenCalledWith(request);

    expect(
      requirePermission
    ).toHaveBeenCalledWith(
      departmentContext,
      "USER_VIEW"
    );

    expect(
      listStaffUsersByDepartment
    ).toHaveBeenCalledWith(2);

    expect(
      listStaffUsers
    ).not.toHaveBeenCalled();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.users).toHaveLength(1);

    expect(
      body.users[0].department.code
    ).toBe("TRADE");
  });

  it("returns an empty list for a non-Super-Admin user without a department", async () => {
    getRequestAuthorization.mockResolvedValueOnce(
      unassignedContext
    );

    const request = createRequest();
    const response = await GET(request);

    expect(
      getRequestAuthorization
    ).toHaveBeenCalledWith(request);

    expect(
      requirePermission
    ).toHaveBeenCalledWith(
      unassignedContext,
      "USER_VIEW"
    );

    expect(
      listStaffUsers
    ).not.toHaveBeenCalled();

    expect(
      listStaffUsersByDepartment
    ).not.toHaveBeenCalled();

    expect(response.status).toBe(200);

    await expect(
      response.json()
    ).resolves.toEqual({
      users: [],
    });
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getRequestAuthorization.mockRejectedValueOnce(
      new UnauthenticatedError()
    );

    const request = createRequest();
    const response = await GET(request);

    expect(
      getRequestAuthorization
    ).toHaveBeenCalledWith(request);

    expect(response.status).toBe(401);

    expect(
      requirePermission
    ).not.toHaveBeenCalled();

    expect(
      listStaffUsers
    ).not.toHaveBeenCalled();
  });

  it("returns 403 when the staff member lacks USER_VIEW", async () => {
    getRequestAuthorization.mockResolvedValueOnce(
      departmentContext
    );

    requirePermission.mockImplementationOnce(
      () => {
        throw new ForbiddenError();
      }
    );

    const request = createRequest();
    const response = await GET(request);

    expect(
      getRequestAuthorization
    ).toHaveBeenCalledWith(request);

    expect(response.status).toBe(403);

    expect(
      listStaffUsers
    ).not.toHaveBeenCalled();

    expect(
      listStaffUsersByDepartment
    ).not.toHaveBeenCalled();
  });

  it("rethrows unexpected errors", async () => {
    const error = new Error(
      "Unexpected database failure"
    );

    getRequestAuthorization.mockResolvedValueOnce(
      superAdminContext
    );

    listStaffUsers.mockRejectedValueOnce(
      error
    );

    await expect(
      GET(createRequest())
    ).rejects.toBe(error);
  });
});