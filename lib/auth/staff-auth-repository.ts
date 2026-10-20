import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db/pool";

interface StaffUserRow extends RowDataPacket {
  id: number;
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  department_id: number | null;
  department_code: string | null;
}

export type StaffUserWithPassword = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  departmentId: number | null;
  departmentCode: string | null;
};

export async function findActiveStaffByEmail(
  email: string
): Promise<StaffUserWithPassword | null> {
  const [rows] =
    await db.execute<StaffUserRow[]>(
      `
        SELECT
          u.id,
          u.public_id,
          u.first_name,
          u.last_name,
          u.email,
          u.password_hash,
          u.department_id,
          d.code AS department_code
        FROM users u
        LEFT JOIN departments d
          ON d.id = u.department_id
        WHERE u.email = ?
          AND u.is_active = TRUE
        LIMIT 1
      `,
      [email]
    );

  const user = rows[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    publicId: user.public_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    passwordHash: user.password_hash,
    departmentId: user.department_id,
    departmentCode: user.department_code,
  };
}