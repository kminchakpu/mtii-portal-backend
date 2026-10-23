import type {
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";

interface CurrentStaffRow
  extends RowDataPacket {
  first_name: string;
  last_name: string;
  email: string;
}

export type CurrentStaff = {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentCode: string | null;
  roles: string[];
  permissions: string[];
};

export async function getCurrentStaff(
  request: Request
): Promise<CurrentStaff | null> {
  const context =
    await getRequestAuthorization(
      request
    );

  const [rows] =
    await db.execute<
      CurrentStaffRow[]
    >(
      `
        SELECT
          first_name,
          last_name,
          email
        FROM users
        WHERE id = ?
          AND is_active = TRUE
        LIMIT 1
      `,
      [context.userId]
    );

  const user = rows[0];

  if (!user) {
    return null;
  }

  return {
    publicId:
      context.publicId,
    firstName:
      user.first_name,
    lastName:
      user.last_name,
    email:
      user.email,
    departmentCode:
      context.departmentCode,
    roles:
      context.roles,
    permissions:
      context.permissions,
  };
}