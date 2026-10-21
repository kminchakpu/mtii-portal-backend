import { randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import {
  revokeAllStaffSessions,
} from "@/lib/auth/session-repository";
import { writeAuditLog } from "@/lib/audit/logger";
import { withTransaction } from "@/lib/db/transaction";
import {
  findDepartmentByPublicId,
} from "@/lib/departments/department-repository";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  requireDepartmentAccess,
} from "@/lib/rbac/department-guard";
import {
  isSuperAdmin,
} from "@/lib/rbac/department-scope";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";
import {
  createStaffUser,
  findStaffUserByPublicId,
  updateStaffUser,
  type StaffUser,
  type UpdateStaffUserRecord,
} from "@/lib/staff/staff-user-repository";
import type {
  CreateStaffUserInput,
  UpdateStaffUserInput,
} from "@/lib/staff/staff-user-validation";

export async function createStaffAccount(
  authorization: AuthorizationContext,
  input: CreateStaffUserInput
): Promise<StaffUser> {
  requirePermission(
    authorization,
    "USER_MANAGE"
  );

  let departmentId:
    number | null = null;

  let departmentPublicId:
    string | null = null;

  if (
    input.departmentPublicId ===
    null
  ) {
    if (
      !isSuperAdmin(
        authorization
      )
    ) {
      throw new ForbiddenError(
        "Only a Super Admin can create an unassigned staff account."
      );
    }
  } else {
    const department =
      await findDepartmentByPublicId(
        input.departmentPublicId
      );

    if (!department) {
      throw new StaffDepartmentNotFoundError();
    }

    if (!department.isActive) {
      throw new StaffDepartmentInactiveError();
    }

    requireDepartmentAccess(
      authorization,
      department.id
    );

    departmentId =
      department.id;

    departmentPublicId =
      department.publicId;
  }

  const passwordHash =
    await hashPassword(
      input.password
    );

  const publicId =
    randomUUID();

  return withTransaction(
    async (connection) => {
      const user =
        await createStaffUser(
          {
            publicId,
            departmentId,
            firstName:
              input.firstName,
            lastName:
              input.lastName,
            email:
              input.email,
            passwordHash,
          },
          connection
        );

      await writeAuditLog(
        {
          actorUserId:
            authorization.userId,
          departmentId,
          action:
            "STAFF_USER_CREATED",
          entityType:
            "STAFF_USER",
          entityId:
            user.publicId,
          newValues: {
            publicId:
              user.publicId,
            departmentPublicId,
            firstName:
              user.firstName,
            lastName:
              user.lastName,
            email:
              user.email,
            isActive:
              user.isActive,
          },
        },
        connection
      );

      return user;
    }
  );
}

export async function updateStaffAccount(
  authorization: AuthorizationContext,
  publicId: string,
  input: UpdateStaffUserInput
): Promise<StaffUser> {
  requirePermission(
    authorization,
    "USER_MANAGE"
  );

  const existingUser =
    await findStaffUserByPublicId(
      publicId
    );

  if (!existingUser) {
    throw new StaffUserNotFoundError();
  }

  const actorIsSuperAdmin =
    isSuperAdmin(
      authorization
    );

  if (
    existingUser.roles.includes(
      "SUPER_ADMIN"
    ) &&
    !actorIsSuperAdmin
  ) {
    throw new ForbiddenError(
      "Only a Super Admin can manage a Super Admin account."
    );
  }

  if (
    existingUser.departmentId ===
    null
  ) {
    if (!actorIsSuperAdmin) {
      throw new ForbiddenError(
        "Only a Super Admin can manage an unassigned staff account."
      );
    }
  } else {
    requireDepartmentAccess(
      authorization,
      existingUser.departmentId
    );
  }

  const updateRecord:
    UpdateStaffUserRecord = {};

  if (
    input.firstName !== undefined
  ) {
    updateRecord.firstName =
      input.firstName;
  }

  if (
    input.lastName !== undefined
  ) {
    updateRecord.lastName =
      input.lastName;
  }

  if (
    input.email !== undefined
  ) {
    updateRecord.email =
      input.email;
  }

  let nextDepartmentId =
    existingUser.departmentId;

  if (
    input.departmentPublicId !==
    undefined
  ) {
    if (
      input.departmentPublicId ===
      null
    ) {
      if (!actorIsSuperAdmin) {
        throw new ForbiddenError(
          "Only a Super Admin can make a staff account unassigned."
        );
      }

      nextDepartmentId =
        null;

      updateRecord.departmentId =
        null;
    } else {
      const department =
        await findDepartmentByPublicId(
          input.departmentPublicId
        );

      if (!department) {
        throw new StaffDepartmentNotFoundError();
      }

      if (!department.isActive) {
        throw new StaffDepartmentInactiveError();
      }

      requireDepartmentAccess(
        authorization,
        department.id
      );

      nextDepartmentId =
        department.id;

      updateRecord.departmentId =
        department.id;
    }
  }

  if (
    input.isActive !== undefined
  ) {
    updateRecord.isActive =
      input.isActive;
  }

  const departmentChanged =
    input.departmentPublicId !==
      undefined &&
    nextDepartmentId !==
      existingUser.departmentId;

  const activeStatusChanged =
    input.isActive !== undefined &&
    input.isActive !==
      existingUser.isActive;

  const shouldRevokeSessions =
    departmentChanged ||
    activeStatusChanged;

  return withTransaction(
    async (connection) => {
      const updatedUser =
        await updateStaffUser(
          existingUser.id,
          updateRecord,
          connection
        );

      if (
        shouldRevokeSessions
      ) {
        await revokeAllStaffSessions(
          existingUser.id,
          connection
        );
      }

      await writeAuditLog(
        {
          actorUserId:
            authorization.userId,
          departmentId:
            updatedUser.departmentId,
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
              updatedUser.departmentPublicId,
            firstName:
              updatedUser.firstName,
            lastName:
              updatedUser.lastName,
            email:
              updatedUser.email,
            isActive:
              updatedUser.isActive,
          },
        },
        connection
      );

      return updatedUser;
    }
  );
}