import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import {
  StaffRoleAlreadyAssignedError,
  StaffRoleInactiveError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

const mocks = vi.hoisted(() => ({
  findStaffUserByPublicId:
    vi.fn(),
  findStaffRoleByPublicId:
    vi.fn(),
  hasStaffUserRole:
    vi.fn(),
  assignStaffUserRole:
    vi.fn(),
  revokeAllStaffSessions:
    vi.fn(),
  withTransaction:
    vi.fn(),
  writeAuditLog:
    vi.fn(),
}));

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    findStaffUserByPublicId:
      mocks.findStaffUserByPublicId,
  })
);

vi.mock(
  "@/lib/staff/staff-role-repository",
  () => ({
    findStaffRoleByPublicId:
      mocks.findStaffRoleByPublicId,
  })
);

vi.mock(
  "@/lib/staff/staff-user-role-repository",
  () => ({
    hasStaffUserRole:
      mocks.hasStaffUserRole,
    assignStaffUserRole:
      mocks.assignStaffUserRole,
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
  "@/lib/db/transaction",
  () => ({
    withTransaction:
      mocks.withTransaction,
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog:
      mocks.writeAuditLog,
  })
);

import {
  assignRoleToStaffUser,
} from "@/lib/staff/staff-role-service";

const actor = {
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

const superAdminActor = {
  ...actor,
  departmentId: null,
  departmentCode: null,
  roles: [
    "SUPER_ADMIN",
  ],
};

const targetUser = {
  id: 10,
  publicId:
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  departmentId: 2,
  departmentPublicId:
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  departmentCode: "TRADE",
  departmentName:
    "Trade Department",
  firstName: "Amina",
  lastName: "Musa",
  email:
    "amina@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt:
    new Date(
      "2026-10-01T09:00:00.000Z"
    ),
  updatedAt:
    new Date(
      "2026-10-01T09:00:00.000Z"
    ),
  roles: [],
};

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

describe(
  "staff role assignment service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.findStaffUserByPublicId
        .mockResolvedValue(
          targetUser
        );

      mocks.findStaffRoleByPublicId
        .mockResolvedValue(
          role
        );

      mocks.hasStaffUserRole
        .mockResolvedValue(
          false
        );

      mocks.assignStaffUserRole
        .mockResolvedValue(
          1
        );

      mocks.revokeAllStaffSessions
        .mockResolvedValue(
          1
        );

      mocks.writeAuditLog
        .mockResolvedValue(
          undefined
        );

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              connection: object
            ) => Promise<unknown>
          ) => {
            return operation({
              execute: vi.fn(),
            });
          }
        );
    });

    it("rejects an actor without ROLE_ASSIGN permission", async () => {
      await expect(
        assignRoleToStaffUser(
          {
            ...actor,
            permissions: [],
          },
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        mocks.findStaffUserByPublicId
      ).not.toHaveBeenCalled();
    });

    it("throws when the target user does not exist", async () => {
      mocks.findStaffUserByPublicId
        .mockResolvedValue(
          null
        );

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        StaffUserNotFoundError
      );

      expect(
        mocks.findStaffRoleByPublicId
      ).not.toHaveBeenCalled();
    });

    it("prevents non-super-admin staff from managing another department", async () => {
      mocks.findStaffUserByPublicId
        .mockResolvedValue({
          ...targetUser,
          departmentId: 3,
          departmentCode:
            "COOP",
        });

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        mocks.findStaffRoleByPublicId
      ).not.toHaveBeenCalled();
    });

    it("prevents non-super-admin staff from managing an unassigned user", async () => {
      mocks.findStaffUserByPublicId
        .mockResolvedValue({
          ...targetUser,
          departmentId: null,
          departmentPublicId:
            null,
          departmentCode: null,
          departmentName: null,
        });

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it("allows a super admin to manage users across departments", async () => {
      mocks.findStaffUserByPublicId
        .mockResolvedValue({
          ...targetUser,
          departmentId: 3,
          departmentCode:
            "COOP",
        });

      await expect(
        assignRoleToStaffUser(
          superAdminActor,
          targetUser.publicId,
          role.publicId
        )
      ).resolves.toEqual(
        role
      );
    });

    it("throws when the requested role does not exist", async () => {
      mocks.findStaffRoleByPublicId
        .mockResolvedValue(
          null
        );

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        StaffRoleNotFoundError
      );
    });

    it("rejects assignment of an inactive role", async () => {
      mocks.findStaffRoleByPublicId
        .mockResolvedValue({
          ...role,
          isActive: false,
        });

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        StaffRoleInactiveError
      );

      expect(
        mocks.withTransaction
      ).not.toHaveBeenCalled();
    });

    it("rejects assignment of the SUPER_ADMIN role through HTTP administration", async () => {
      mocks.findStaffRoleByPublicId
        .mockResolvedValue({
          ...role,
          code:
            "SUPER_ADMIN",
          name:
            "Super Admin",
        });

      await expect(
        assignRoleToStaffUser(
          superAdminActor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        mocks.withTransaction
      ).not.toHaveBeenCalled();
    });

    it("protects an existing super-admin account from role changes", async () => {
      mocks.findStaffUserByPublicId
        .mockResolvedValue({
          ...targetUser,
          roles: [
            "SUPER_ADMIN",
          ],
        });

      await expect(
        assignRoleToStaffUser(
          superAdminActor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        mocks.withTransaction
      ).not.toHaveBeenCalled();
    });

    it("rejects a duplicate role assignment", async () => {
      mocks.hasStaffUserRole
        .mockResolvedValue(
          true
        );

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        StaffRoleAlreadyAssignedError
      );

      expect(
        mocks.assignStaffUserRole
      ).not.toHaveBeenCalled();

      expect(
        mocks.revokeAllStaffSessions
      ).not.toHaveBeenCalled();

      expect(
        mocks.writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("assigns the role inside the transaction using the acting user", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      const result =
        await assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        );

      expect(result).toEqual(
        role
      );

      expect(
        mocks.hasStaffUserRole
      ).toHaveBeenCalledWith(
        targetUser.id,
        role.id,
        connection
      );

      expect(
        mocks.assignStaffUserRole
      ).toHaveBeenCalledWith(
        targetUser.id,
        role.id,
        actor.userId,
        connection
      );
    });

    it("revokes all target user sessions using the same transaction", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await assignRoleToStaffUser(
        actor,
        targetUser.publicId,
        role.publicId
      );

      expect(
        mocks.revokeAllStaffSessions
      ).toHaveBeenCalledWith(
        targetUser.id,
        connection
      );
    });

    it("writes the role assignment audit log using the same transaction", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await assignRoleToStaffUser(
        actor,
        targetUser.publicId,
        role.publicId
      );

      expect(
        mocks.writeAuditLog
      ).toHaveBeenCalledWith(
        {
          actorUserId:
            actor.userId,
          departmentId:
            targetUser.departmentId,
          action:
            "STAFF_ROLE_ASSIGNED",
          entityType:
            "STAFF_USER_ROLE",
          entityId:
            `${targetUser.publicId}:${role.publicId}`,
          previousValues: null,
          newValues: {
            userPublicId:
              targetUser.publicId,
            rolePublicId:
              role.publicId,
            roleCode:
              role.code,
          },
        },
        connection
      );
    });

    it("maps a concurrent duplicate assignment to the domain conflict error", async () => {
      const duplicateError = {
        code:
          "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry '10-4' for key 'user_roles.PRIMARY'",
      };

      mocks.hasStaffUserRole
        .mockResolvedValue(
          false
        );

      mocks.assignStaffUserRole
        .mockRejectedValue(
          duplicateError
        );

      await expect(
        assignRoleToStaffUser(
          actor,
          targetUser.publicId,
          role.publicId
        )
      ).rejects.toBeInstanceOf(
        StaffRoleAlreadyAssignedError
      );

      expect(
        mocks.revokeAllStaffSessions
      ).not.toHaveBeenCalled();

      expect(
        mocks.writeAuditLog
      ).not.toHaveBeenCalled();
    });
  }
);