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
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
} from "@/lib/staff/errors";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  listStaffUsers:
    vi.fn(),
  listStaffUsersByDepartment:
    vi.fn(),
  createStaffAccount:
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
    listStaffUsers:
      mocks.listStaffUsers,
    listStaffUsersByDepartment:
      mocks.listStaffUsersByDepartment,
  })
);

vi.mock(
  "@/lib/staff/staff-user-service",
  () => ({
    createStaffAccount:
      mocks.createStaffAccount,
  })
);

import {
  POST,
} from "@/app/api/staff/users/route";

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

const departmentPublicId =
  "22222222-2222-4222-8222-222222222222";

function createRequest() {
  return new Request(
    "http://localhost/api/staff/users",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        password:
          "SecurePassword123!",
        departmentPublicId,
      }),
    }
  );
}

describe(
  "POST /api/staff/users domain errors",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );
    });

    it("returns 404 when the requested department does not exist", async () => {
      mocks.createStaffAccount
        .mockRejectedValue(
          new StaffDepartmentNotFoundError()
        );

      const response =
        await POST(
          createRequest()
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
      mocks.createStaffAccount
        .mockRejectedValue(
          new StaffDepartmentInactiveError()
        );

      const response =
        await POST(
          createRequest()
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
  }
);