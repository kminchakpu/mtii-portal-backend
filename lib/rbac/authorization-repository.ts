import type {
  RowDataPacket,
} from "mysql2";
import { db } from "@/lib/db/pool";
import type {
  AuthorizationContext,
} from "./authorization";

interface AuthorizationRow
  extends RowDataPacket {
  user_id: number;
  public_id: string;
  department_id: number | null;
  department_code: string | null;
  role_code: string | null;
  permission_code: string | null;
}

export async function getAuthorizationContext(
  userId: number
): Promise<AuthorizationContext | null> {
  const [rows] =
    await db.execute<
      AuthorizationRow[]
    >(
      `
        SELECT
          u.id AS user_id,
          u.public_id,
          u.department_id,
          d.code AS department_code,
          r.code AS role_code,
          p.code AS permission_code
        FROM users u
        LEFT JOIN departments d
          ON d.id = u.department_id
        LEFT JOIN user_roles ur
          ON ur.user_id = u.id
        LEFT JOIN roles r
          ON r.id = ur.role_id
          AND r.is_active = TRUE
        LEFT JOIN role_permissions rp
          ON rp.role_id = r.id
        LEFT JOIN permissions p
          ON p.id = rp.permission_id
        WHERE u.id = ?
          AND u.is_active = TRUE
        ORDER BY
          r.code,
          p.code
      `,
      [userId]
    );

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];

  const roles = new Set<string>();
  const permissions = new Set<string>();

  for (const row of rows) {
    if (row.role_code) {
      roles.add(row.role_code);
    }

    if (row.permission_code) {
      permissions.add(
        row.permission_code
      );
    }
  }

  return {
    userId: firstRow.user_id,
    publicId: firstRow.public_id,
    departmentId:
      firstRow.department_id,
    departmentCode:
      firstRow.department_code,
    roles: Array.from(roles),
    permissions:
      Array.from(permissions),
  };
}