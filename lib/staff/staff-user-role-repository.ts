import type {
  ExecuteValues,
  QueryResult,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";

export type StaffUserRoleExecutor = {
  execute<T extends QueryResult>(
    sql: string,
    values?: ExecuteValues
  ): Promise<
    [
      T,
      unknown
    ]
  >;
};

type StaffUserRoleRow =
  RowDataPacket & {
    user_id: number;
  };

export async function hasStaffUserRole(
  userId: number,
  roleId: number,
  executor:
    StaffUserRoleExecutor = db
): Promise<boolean> {
  const [rows] =
    await executor.execute<
      StaffUserRoleRow[]
    >(
      `
        SELECT
          user_id
        FROM user_roles
        WHERE user_id = ?
          AND role_id = ?
        LIMIT 1
      `,
      [
        userId,
        roleId,
      ]
    );

  return rows.length > 0;
}

export async function assignStaffUserRole(
  userId: number,
  roleId: number,
  assignedByUserId:
    number | null,
  executor:
    StaffUserRoleExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        INSERT INTO user_roles (
          user_id,
          role_id,
          assigned_by_user_id
        )
        VALUES (?, ?, ?)
      `,
      [
        userId,
        roleId,
        assignedByUserId,
      ]
    );

  return result.affectedRows;
}

export async function removeStaffUserRole(
  userId: number,
  roleId: number,
  executor:
    StaffUserRoleExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        DELETE FROM user_roles
        WHERE user_id = ?
          AND role_id = ?
      `,
      [
        userId,
        roleId,
      ]
    );

  return result.affectedRows;
}