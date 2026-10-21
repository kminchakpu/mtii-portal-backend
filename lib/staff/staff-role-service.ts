import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  hasRole,
} from "@/lib/rbac/authorization";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import {
  findStaffUserByPublicId,
} from "@/lib/staff/staff-user-repository";
import {
  findStaffRoleByPublicId,
  type StaffRole,
} from "@/lib/staff/staff-role-repository";
import {
  assignStaffUserRole,
  hasStaffUserRole,
  removeStaffUserRole,
} from "@/lib/staff/staff-user-role-repository";
import {
  revokeAllStaffSessions,
} from "@/lib/auth/session-repository";
import {
  withTransaction,
} from "@/lib/db/transaction";
import {
  writeAuditLog,
} from "@/lib/audit/logger";
import {
  StaffRoleAlreadyAssignedError,
  StaffRoleInactiveError,
  StaffRoleNotAssignedError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

type MySqlDatabaseError = {
  code?: unknown;
  errno?: unknown;
};

function actorIsSuperAdmin(
  authorization:
    AuthorizationContext
): boolean {
  return hasRole(
    authorization,
    "SUPER_ADMIN"
  );
}

function ensureActorCanManageUser(
  authorization:
    AuthorizationContext,
  user: {
    departmentId:
      number | null;
    roles: string[];
  }
): void {
  const isSuperAdmin =
    actorIsSuperAdmin(
      authorization
    );

  if (
    !isSuperAdmin &&
    (
      user.departmentId === null ||
      authorization.departmentId ===
        null ||
      user.departmentId !==
        authorization.departmentId
    )
  ) {
    throw new ForbiddenError();
  }

  if (
    user.roles.includes(
      "SUPER_ADMIN"
    )
  ) {
    throw new ForbiddenError();
  }
}

function ensureRoleIsMutable(
  role: StaffRole
): void {
  if (
    role.code ===
    "SUPER_ADMIN"
  ) {
    throw new ForbiddenError();
  }
}

function isMySqlDuplicateEntryError(
  error: unknown
): error is MySqlDatabaseError {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const databaseError =
    error as MySqlDatabaseError;

  return (
    databaseError.code ===
      "ER_DUP_ENTRY" &&
    databaseError.errno === 1062
  );
}

export async function assignRoleToStaffUser(
  authorization:
    AuthorizationContext,
  userPublicId: string,
  rolePublicId: string
): Promise<StaffRole> {
  requirePermission(
    authorization,
    "ROLE_ASSIGN"
  );

  const user =
    await findStaffUserByPublicId(
      userPublicId
    );

  if (!user) {
    throw new StaffUserNotFoundError();
  }

  ensureActorCanManageUser(
    authorization,
    user
  );

  const role =
    await findStaffRoleByPublicId(
      rolePublicId
    );

  if (!role) {
    throw new StaffRoleNotFoundError();
  }

  if (!role.isActive) {
    throw new StaffRoleInactiveError();
  }

  ensureRoleIsMutable(role);

  await withTransaction(
    async (connection) => {
      const alreadyAssigned =
        await hasStaffUserRole(
          user.id,
          role.id,
          connection
        );

      if (alreadyAssigned) {
        throw new StaffRoleAlreadyAssignedError();
      }

      try {
        await assignStaffUserRole(
          user.id,
          role.id,
          authorization.userId,
          connection
        );
      } catch (error) {
        if (
          isMySqlDuplicateEntryError(
            error
          )
        ) {
          throw new StaffRoleAlreadyAssignedError();
        }

        throw error;
      }

      await revokeAllStaffSessions(
        user.id,
        connection
      );

      await writeAuditLog(
        {
          actorUserId:
            authorization.userId,
          departmentId:
            user.departmentId,
          action:
            "STAFF_ROLE_ASSIGNED",
          entityType:
            "STAFF_USER_ROLE",
          entityId:
            `${user.publicId}:${role.publicId}`,
          previousValues: null,
          newValues: {
            userPublicId:
              user.publicId,
            rolePublicId:
              role.publicId,
            roleCode:
              role.code,
          },
        },
        connection
      );
    }
  );

  return role;
}

export async function removeRoleFromStaffUser(
  authorization:
    AuthorizationContext,
  userPublicId: string,
  rolePublicId: string
): Promise<StaffRole> {
  requirePermission(
    authorization,
    "ROLE_ASSIGN"
  );

  const user =
    await findStaffUserByPublicId(
      userPublicId
    );

  if (!user) {
    throw new StaffUserNotFoundError();
  }

  ensureActorCanManageUser(
    authorization,
    user
  );

  const role =
    await findStaffRoleByPublicId(
      rolePublicId
    );

  if (!role) {
    throw new StaffRoleNotFoundError();
  }

  ensureRoleIsMutable(role);

  await withTransaction(
    async (connection) => {
      const assigned =
        await hasStaffUserRole(
          user.id,
          role.id,
          connection
        );

      if (!assigned) {
        throw new StaffRoleNotAssignedError();
      }

      const affectedRows =
        await removeStaffUserRole(
          user.id,
          role.id,
          connection
        );

      if (
        affectedRows === 0
      ) {
        throw new StaffRoleNotAssignedError();
      }

      await revokeAllStaffSessions(
        user.id,
        connection
      );

      await writeAuditLog(
        {
          actorUserId:
            authorization.userId,
          departmentId:
            user.departmentId,
          action:
            "STAFF_ROLE_REMOVED",
          entityType:
            "STAFF_USER_ROLE",
          entityId:
            `${user.publicId}:${role.publicId}`,
          previousValues: {
            userPublicId:
              user.publicId,
            rolePublicId:
              role.publicId,
            roleCode:
              role.code,
          },
          newValues: null,
        },
        connection
      );
    }
  );

  return role;
}