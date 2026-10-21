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
} from "@/lib/rbac/errors";
import type {
  StaffUser,
} from "@/lib/staff/staff-user-repository";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireDepartmentAccess: vi.fn(),
  isSuperAdmin: vi.fn(),
  findDepartmentByPublicId: vi.fn(),
  findStaffUserByPublicId: vi.fn(),
  updateStaffUser: vi.fn(),
  revokeAllStaffSessions: vi.fn(),
  writeAuditLog: vi.fn(),
  withTransaction: vi.fn(),
  hashPassword: vi.fn(),
  randomUUID: vi.fn(),
  createStaffUser: vi.fn(),
}));

vi.mock(
  "node:crypto",
  async () => {
    const actual =
      await vi.importActual<
        typeof import("node:crypto")
      >("node:crypto");

    return {
      ...actual,
      randomUUID:
        mocks.randomUUID,
    };
  }
);

vi.mock(
  "@/lib/auth/password",
  () => ({
    hashPassword:
      mocks.hashPassword,
  })
);

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    revokeAllStaffSessions:
      mocks.revokeAllStaffSessions,
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog:
      mocks.writeAuditLog,
  })
);

vi.mock(
  "@/lib/db/transaction",
  () => ({
    withTransaction:
      mocks.withTransaction,
  })
);

vi.mock(
  "@/lib/departments/department-repository",
  () => ({
    findDepartmentByPublicId:
      mocks.findDepartmentByPublicId,
  })
);

vi.mock(
  "@/lib/rbac/department-guard",
  () => ({
    requireDepartmentAccess:
      mocks.requireDepartmentAccess,
  })
);

vi.mock(
  "@/lib/rbac/department-scope",
  () => ({
    isSuperAdmin:
      mocks.isSuperAdmin,
  })
);

vi.mock(
  "@/lib/rbac/permission-guard",
  () => ({
    requirePermission:
      mocks.requirePermission,
  })
);

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    createStaffUser:
      mocks.createStaffUser,
    findStaffUserByPublicId:
      mocks.findStaffUserByPublicId,
    updateStaffUser:
      mocks.updateStaffUser,
  })
);

import {
  updateStaffAccount,
} from "@/lib/staff/staff-user-service";

const connection = {
  execute: vi.fn(),
};

const departmentAuthorization:
  AuthorizationContext = {
    userId: 10,
    publicId:
      "11111111-1111-4111-8111-111111111111",
    departmentId: 2,
    departmentCode: "TRADE",
    roles: [
      "DEPARTMENT_ADMIN",
    ],
    permissions: [
      "USER_MANAGE",
    ],
  };

const superAdminAuthorization:
  AuthorizationContext = {
    userId: 1,
    publicId:
      "22222222-2222-4222-8222-222222222222",
    departmentId: 1,
    departmentCode: "ADMIN",
    roles: [
      "SUPER_ADMIN",
    ],
    permissions: [
      "USER_MANAGE",
    ],
  };

const existingUser:
  StaffUser = {
    id: 25,
    publicId:
      "33333333-3333-4333-8333-333333333333",
    departmentId: 2,
    departmentPublicId:
      "44444444-4444-4444-8444-444444444444",
    departmentCode: "TRADE",
    departmentName:
      "Trade Department",
    firstName: "Amina",
    lastName: "Musa",
    email:
      "amina.musa@example.com",
    isActive: true,
    lastLoginAt: null,
    passwordChangedAt: null,
    createdAt:
      new Date(
        "2026-10-01T10:00:00.000Z"
      ),
    updatedAt:
      new Date(
        "2026-10-01T10:00:00.000Z"
      ),
    roles: [
      "REVIEW_OFFICER",
    ],
  };

const updatedNameUser:
  StaffUser = {
    ...existingUser,
    firstName: "Maryam",
    updatedAt:
      new Date(
        "2026-10-21T10:00:00.000Z"
      ),
  };

const cooperativeDepartment = {
  id: 3,
  publicId:
    "55555555-5555-4555-8555-555555555555",
  code: "COOP",
  name:
    "Cooperative Department",
  description: null,
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

const updatedDepartmentUser:
  StaffUser = {
    ...existingUser,
    departmentId: 3,
    departmentPublicId:
      cooperativeDepartment.publicId,
    departmentCode: "COOP",
    departmentName:
      "Cooperative Department",
    updatedAt:
      new Date(
        "2026-10-21T10:00:00.000Z"
      ),
};

const inactiveUser:
  StaffUser = {
    ...existingUser,
    isActive: false,
    updatedAt:
      new Date(
        "2026-10-21T10:00:00.000Z"
      ),
};

const unassignedUser:
  StaffUser = {
    ...existingUser,
    departmentId: null,
    departmentPublicId: null,
    departmentCode: null,
    departmentName: null,
  };

const superAdminUser:
  StaffUser = {
    ...existingUser,
    id: 1,
    publicId:
      "66666666-6666-4666-8666-666666666666",
    departmentId: 1,
    departmentPublicId:
      "77777777-7777-4777-8777-777777777777",
    departmentCode: "ADMIN",
    departmentName:
      "Administration",
    firstName: "System",
    lastName: "Administrator",
    email:
      "admin@example.com",
    roles: [
      "SUPER_ADMIN",
    ],
  };

describe(
  "updateStaffAccount",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.isSuperAdmin
        .mockReturnValue(false);

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                typeof connection
            ) => Promise<unknown>
          ) =>
            operation(
              connection
            )
        );

      mocks.writeAuditLog
        .mockResolvedValue(
          undefined
        );

      mocks.revokeAllStaffSessions
        .mockResolvedValue(1);
    });

    it(
      "requires USER_MANAGE permission",
      async () => {
        mocks.requirePermission
          .mockImplementationOnce(
            () => {
              throw new ForbiddenError(
                "Forbidden."
              );
            }
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              firstName:
                "Maryam",
            }
          )
        ).rejects.toBeInstanceOf(
          ForbiddenError
        );

        expect(
          mocks.requirePermission
        ).toHaveBeenCalledWith(
          departmentAuthorization,
          "USER_MANAGE"
        );

        expect(
          mocks.findStaffUserByPublicId
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "throws when the staff user does not exist",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            null
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              firstName:
                "Maryam",
            }
          )
        ).rejects.toThrow(
          "Staff user not found."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "requires access to the target user's current department",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.requireDepartmentAccess
          .mockImplementationOnce(
            () => {
              throw new ForbiddenError(
                "Forbidden."
              );
            }
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              firstName:
                "Maryam",
            }
          )
        ).rejects.toBeInstanceOf(
          ForbiddenError
        );

        expect(
          mocks.requireDepartmentAccess
        ).toHaveBeenCalledWith(
          departmentAuthorization,
          existingUser.departmentId
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "prevents a non-Super Admin from managing an unassigned staff account",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            unassignedUser
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            unassignedUser.publicId,
            {
              firstName:
                "Maryam",
            }
          )
        ).rejects.toThrow(
          "Only a Super Admin can manage an unassigned staff account."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "prevents a non-Super Admin from managing a Super Admin account",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            superAdminUser
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            superAdminUser.publicId,
            {
              firstName:
                "Changed",
            }
          )
        ).rejects.toThrow(
          "Only a Super Admin can manage a Super Admin account."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "allows a Super Admin to manage a Super Admin account",
      async () => {
        const updatedSuperAdmin = {
          ...superAdminUser,
          firstName: "Primary",
        };

        mocks.isSuperAdmin
          .mockReturnValueOnce(
            true
          );

        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            superAdminUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedSuperAdmin
          );

        const result =
          await updateStaffAccount(
            superAdminAuthorization,
            superAdminUser.publicId,
            {
              firstName:
                "Primary",
            }
          );

        expect(result).toEqual(
          updatedSuperAdmin
        );

        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          superAdminUser.id,
          {
            firstName:
              "Primary",
          },
          connection
        );
      }
    );

    it(
      "updates profile fields without revoking sessions",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedNameUser
          );

        const result =
          await updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              firstName:
                "Maryam",
            }
          );

        expect(result).toEqual(
          updatedNameUser
        );

        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          existingUser.id,
          {
            firstName:
              "Maryam",
          },
          connection
        );

        expect(
          mocks.revokeAllStaffSessions
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "resolves and checks access to a new department",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.findDepartmentByPublicId
          .mockResolvedValueOnce(
            cooperativeDepartment
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedDepartmentUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            departmentPublicId:
              cooperativeDepartment.publicId,
          }
        );

        expect(
          mocks.findDepartmentByPublicId
        ).toHaveBeenCalledWith(
          cooperativeDepartment.publicId
        );

        expect(
          mocks.requireDepartmentAccess
        ).toHaveBeenCalledWith(
          departmentAuthorization,
          existingUser.departmentId
        );

        expect(
          mocks.requireDepartmentAccess
        ).toHaveBeenCalledWith(
          departmentAuthorization,
          cooperativeDepartment.id
        );
      }
    );

    it(
      "rejects a nonexistent destination department",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.findDepartmentByPublicId
          .mockResolvedValueOnce(
            null
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              departmentPublicId:
                cooperativeDepartment.publicId,
            }
          )
        ).rejects.toThrow(
          "Department not found."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an inactive destination department",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.findDepartmentByPublicId
          .mockResolvedValueOnce({
            ...cooperativeDepartment,
            isActive: false,
          });

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              departmentPublicId:
                cooperativeDepartment.publicId,
            }
          )
        ).rejects.toThrow(
          "Department is inactive."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "allows only a Super Admin to make a staff account unassigned",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        await expect(
          updateStaffAccount(
            departmentAuthorization,
            existingUser.publicId,
            {
              departmentPublicId:
                null,
            }
          )
        ).rejects.toThrow(
          "Only a Super Admin can make a staff account unassigned."
        );

        expect(
          mocks.updateStaffUser
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "allows a Super Admin to make a staff account unassigned and revokes sessions",
      async () => {
        const updatedUser = {
          ...unassignedUser,
          updatedAt:
            new Date(
              "2026-10-21T10:00:00.000Z"
            ),
        };

        mocks.isSuperAdmin
          .mockReturnValueOnce(
            true
          );

        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedUser
          );

        const result =
          await updateStaffAccount(
            superAdminAuthorization,
            existingUser.publicId,
            {
              departmentPublicId:
                null,
            }
          );

        expect(result).toEqual(
          updatedUser
        );

        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          existingUser.id,
          {
            departmentId:
              null,
          },
          connection
        );

        expect(
          mocks.revokeAllStaffSessions
        ).toHaveBeenCalledWith(
          existingUser.id,
          connection
        );
      }
    );

    it(
      "revokes sessions when the department actually changes",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.findDepartmentByPublicId
          .mockResolvedValueOnce(
            cooperativeDepartment
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedDepartmentUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            departmentPublicId:
              cooperativeDepartment.publicId,
          }
        );

        expect(
          mocks.revokeAllStaffSessions
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.revokeAllStaffSessions
        ).toHaveBeenCalledWith(
          existingUser.id,
          connection
        );
      }
    );

    it(
      "does not revoke sessions when the department remains unchanged",
      async () => {
        const sameDepartment = {
          id:
            existingUser.departmentId,
          publicId:
            existingUser.departmentPublicId,
          code:
            existingUser.departmentCode,
          name:
            existingUser.departmentName,
          description: null,
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

        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.findDepartmentByPublicId
          .mockResolvedValueOnce(
            sameDepartment
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            existingUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            departmentPublicId:
              existingUser.departmentPublicId,
          }
        );

        expect(
          mocks.revokeAllStaffSessions
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "revokes sessions when active status actually changes",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            inactiveUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            isActive: false,
          }
        );

        expect(
          mocks.revokeAllStaffSessions
        ).toHaveBeenCalledWith(
          existingUser.id,
          connection
        );
      }
    );

    it(
      "does not revoke sessions when active status remains unchanged",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            existingUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            isActive: true,
          }
        );

        expect(
          mocks.revokeAllStaffSessions
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "updates, revokes sessions, and writes the audit log using the same transaction connection",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            inactiveUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            isActive: false,
          }
        );

        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          existingUser.id,
          {
            isActive: false,
          },
          connection
        );

        expect(
          mocks.revokeAllStaffSessions
        ).toHaveBeenCalledWith(
          existingUser.id,
          connection
        );

        expect(
          mocks.writeAuditLog
        ).toHaveBeenCalledWith(
          expect.any(Object),
          connection
        );
      }
    );

    it(
      "audits previous and new non-secret staff values",
      async () => {
        mocks.findStaffUserByPublicId
          .mockResolvedValueOnce(
            existingUser
          );

        mocks.updateStaffUser
          .mockResolvedValueOnce(
            updatedNameUser
          );

        await updateStaffAccount(
          departmentAuthorization,
          existingUser.publicId,
          {
            firstName:
              "Maryam",
          }
        );

        expect(
          mocks.writeAuditLog
        ).toHaveBeenCalledWith(
          {
            actorUserId:
              departmentAuthorization.userId,
            departmentId:
              existingUser.departmentId,
            action:
              "STAFF_USER_UPDATED",
            entityType:
              "STAFF_USER",
            entityId:
              existingUser.publicId,
            previousValues: {
              departmentPublicId:
                existingUser.departmentPublicId,
              firstName:
                existingUser.firstName,
              lastName:
                existingUser.lastName,
              email:
                existingUser.email,
              isActive:
                existingUser.isActive,
            },
            newValues: {
              departmentPublicId:
                updatedNameUser.departmentPublicId,
              firstName:
                updatedNameUser.firstName,
              lastName:
                updatedNameUser.lastName,
              email:
                updatedNameUser.email,
              isActive:
                updatedNameUser.isActive,
            },
          },
          connection
        );

        const auditInput =
          mocks.writeAuditLog
            .mock.calls[0][0];

        expect(
          auditInput
        ).not.toHaveProperty(
          "password"
        );

        expect(
          auditInput
        ).not.toHaveProperty(
          "passwordHash"
        );

        expect(
          auditInput.previousValues
        ).not.toHaveProperty(
          "password"
        );

        expect(
          auditInput.previousValues
        ).not.toHaveProperty(
          "passwordHash"
        );

        expect(
          auditInput.newValues
        ).not.toHaveProperty(
          "password"
        );

        expect(
          auditInput.newValues
        ).not.toHaveProperty(
          "passwordHash"
        );
      }
    );
  }
);