import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";
import {
  handleStaffUserDatabaseError,
} from "@/lib/staff/database-error";

interface StaffUserRow
  extends RowDataPacket {
  id: number;
  public_id: string;
  department_id: number | null;
  department_public_id:
    string | null;
  department_code:
    string | null;
  department_name:
    string | null;
  first_name: string;
  last_name: string;
  email: string;
  is_active: number | boolean;
  last_login_at: Date | null;
  password_changed_at:
    Date | null;
  created_at: Date;
  updated_at: Date;
  role_codes: string | null;
}

export type StaffUser = {
  id: number;
  publicId: string;
  departmentId: number | null;
  departmentPublicId:
    string | null;
  departmentCode: string | null;
  departmentName: string | null;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
};

export type CreateStaffUserRecord = {
  publicId: string;
  departmentId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

export type UpdateStaffUserRecord = {
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: number | null;
  isActive?: boolean;
};

type StaffUserExecutor = Pick<
  PoolConnection,
  "execute"
>;

function mapStaffUser(
  row: StaffUserRow
): StaffUser {
  return {
    id: row.id,
    publicId: row.public_id,
    departmentId:
      row.department_id,
    departmentPublicId:
      row.department_public_id,
    departmentCode:
      row.department_code,
    departmentName:
      row.department_name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    isActive:
      Boolean(row.is_active),
    lastLoginAt:
      row.last_login_at,
    passwordChangedAt:
      row.password_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles: row.role_codes
      ? row.role_codes
          .split(",")
          .filter(Boolean)
      : [],
  };
}

const staffUserSelect = `
  SELECT
    u.id,
    u.public_id,
    u.department_id,
    d.public_id
      AS department_public_id,
    d.code
      AS department_code,
    d.name
      AS department_name,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active,
    u.last_login_at,
    u.password_changed_at,
    u.created_at,
    u.updated_at,
    GROUP_CONCAT(
      DISTINCT r.code
      ORDER BY r.code
      SEPARATOR ','
    ) AS role_codes
  FROM users u
  LEFT JOIN departments d
    ON d.id = u.department_id
  LEFT JOIN user_roles ur
    ON ur.user_id = u.id
  LEFT JOIN roles r
    ON r.id = ur.role_id
`;

const staffUserGroupBy = `
  GROUP BY
    u.id,
    u.public_id,
    u.department_id,
    d.public_id,
    d.code,
    d.name,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active,
    u.last_login_at,
    u.password_changed_at,
    u.created_at,
    u.updated_at
`;

async function findStaffUserById(
  id: number,
  executor:
    StaffUserExecutor = db
): Promise<StaffUser | null> {
  const [rows] =
    await executor.execute<
      StaffUserRow[]
    >(
      `
        ${staffUserSelect}
        WHERE u.id = ?
        ${staffUserGroupBy}
        LIMIT 1
      `,
      [id]
    );

  const user = rows[0];

  if (!user) {
    return null;
  }

  return mapStaffUser(user);
}

export async function listStaffUsers():
Promise<StaffUser[]> {
  const [rows] =
    await db.execute<
      StaffUserRow[]
    >(
      `
        ${staffUserSelect}
        ${staffUserGroupBy}
        ORDER BY
          u.last_name ASC,
          u.first_name ASC,
          u.id ASC
      `
    );

  return rows.map(
    mapStaffUser
  );
}

export async function listStaffUsersByDepartment(
  departmentId: number
): Promise<StaffUser[]> {
  const [rows] =
    await db.execute<
      StaffUserRow[]
    >(
      `
        ${staffUserSelect}
        WHERE u.department_id = ?
        ${staffUserGroupBy}
        ORDER BY
          u.last_name ASC,
          u.first_name ASC,
          u.id ASC
      `,
      [departmentId]
    );

  return rows.map(
    mapStaffUser
  );
}

export async function findStaffUserByPublicId(
  publicId: string
): Promise<StaffUser | null> {
  const [rows] =
    await db.execute<
      StaffUserRow[]
    >(
      `
        ${staffUserSelect}
        WHERE u.public_id = ?
        ${staffUserGroupBy}
        LIMIT 1
      `,
      [publicId]
    );

  const user = rows[0];

  if (!user) {
    return null;
  }

  return mapStaffUser(user);
}

export async function createStaffUser(
  input: CreateStaffUserRecord,
  executor:
    StaffUserExecutor = db
): Promise<StaffUser> {
  try {
    const [result] =
      await executor.execute<
        ResultSetHeader
      >(
        `
          INSERT INTO users (
            public_id,
            department_id,
            first_name,
            last_name,
            email,
            password_hash
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          input.publicId,
          input.departmentId,
          input.firstName,
          input.lastName,
          input.email,
          input.passwordHash,
        ]
      );

    const user =
      await findStaffUserById(
        result.insertId,
        executor
      );

    if (!user) {
      throw new Error(
        "Created staff user could not be loaded."
      );
    }

    return user;
  } catch (error) {
    return handleStaffUserDatabaseError(
      error
    );
  }
}

export async function updateStaffUser(
  userId: number,
  input: UpdateStaffUserRecord,
  executor:
    StaffUserExecutor = db
): Promise<StaffUser> {
  const assignments: string[] = [];
  const values: Array<
    string | number | boolean | null
  > = [];

  if (
    input.firstName !== undefined
  ) {
    assignments.push(
      "first_name = ?"
    );
    values.push(
      input.firstName
    );
  }

  if (
    input.lastName !== undefined
  ) {
    assignments.push(
      "last_name = ?"
    );
    values.push(
      input.lastName
    );
  }

  if (
    input.email !== undefined
  ) {
    assignments.push(
      "email = ?"
    );
    values.push(
      input.email
    );
  }

  if (
    input.departmentId !==
    undefined
  ) {
    assignments.push(
      "department_id = ?"
    );
    values.push(
      input.departmentId
    );
  }

  if (
    input.isActive !== undefined
  ) {
    assignments.push(
      "is_active = ?"
    );
    values.push(
      input.isActive
    );
  }

  if (
    assignments.length === 0
  ) {
    throw new Error(
      "At least one staff user field must be provided."
    );
  }

  values.push(userId);

  try {
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE users
        SET ${assignments.join(
          ", "
        )}
        WHERE id = ?
      `,
      values
    );

    const user =
      await findStaffUserById(
        userId,
        executor
      );

    if (!user) {
      throw new Error(
        "Updated staff user could not be loaded."
      );
    }

    return user;
  } catch (error) {
    return handleStaffUserDatabaseError(
      error
    );
  }
}