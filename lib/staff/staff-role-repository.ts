import type {
  Pool,
  PoolConnection,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";

type RoleExecutor =
  | Pool
  | PoolConnection;

type StaffRoleRow =
  RowDataPacket & {
    id: number;
    public_id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: number | boolean;
    created_at: Date;
    updated_at: Date;
  };

export type StaffRole = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapStaffRole(
  row: StaffRoleRow
): StaffRole {
  return {
    id: row.id,
    publicId: row.public_id,
    code: row.code,
    name: row.name,
    description: row.description,
    isActive:
      Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStaffRoles(
  executor: RoleExecutor = db
): Promise<StaffRole[]> {
  const [rows] =
    await executor.execute<
      StaffRoleRow[]
    >(
      `
        SELECT
          id,
          public_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
        FROM roles
        ORDER BY name ASC
      `,
      []
    );

  return rows.map(
    mapStaffRole
  );
}

export async function findStaffRoleByPublicId(
  publicId: string,
  executor: RoleExecutor = db
): Promise<StaffRole | null> {
  const [rows] =
    await executor.execute<
      StaffRoleRow[]
    >(
      `
        SELECT
          id,
          public_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
        FROM roles
        WHERE public_id = ?
        LIMIT 1
      `,
      [publicId]
    );

  const role = rows[0];

  return role
    ? mapStaffRole(role)
    : null;
}

export async function findStaffRoleById(
  id: number,
  executor: RoleExecutor = db
): Promise<StaffRole | null> {
  const [rows] =
    await executor.execute<
      StaffRoleRow[]
    >(
      `
        SELECT
          id,
          public_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
        FROM roles
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

  const role = rows[0];

  return role
    ? mapStaffRole(role)
    : null;
}