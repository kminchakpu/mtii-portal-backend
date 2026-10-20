import { randomUUID } from "node:crypto";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/lib/departments/department-validation";
import {
  handleDepartmentDatabaseError,
} from "@/lib/departments/database-error";

export type Department = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DepartmentRow =
  RowDataPacket & {
    id: number;
    public_id: string;
    code: string;
    name: string;
    description:
      string | null;
    is_active:
      number | boolean;
    created_at: Date;
    updated_at: Date;
  };

type DepartmentExecutor =
  Pick<
    PoolConnection,
    "execute"
  >;

const departmentSelect = `
  SELECT
    id,
    public_id,
    code,
    name,
    description,
    is_active,
    created_at,
    updated_at
  FROM departments
`;

function mapDepartment(
  row: DepartmentRow
): Department {
  return {
    id: row.id,
    publicId:
      row.public_id,
    code: row.code,
    name: row.name,
    description:
      row.description,
    isActive:
      Boolean(
        row.is_active
      ),
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

async function findDepartmentById(
  id: number,
  executor:
    DepartmentExecutor = db
): Promise<
  Department | null
> {
  const [rows] =
    await executor.execute<
      DepartmentRow[]
    >(
      `${departmentSelect}
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapDepartment(
    row
  );
}

export async function listDepartments(): Promise<
  Department[]
> {
  const [rows] =
    await db.execute<
      DepartmentRow[]
    >(
      `${departmentSelect}
       ORDER BY name ASC`
    );

  return rows.map(
    mapDepartment
  );
}

export async function listDepartmentsById(
  departmentId: number
): Promise<
  Department[]
> {
  const [rows] =
    await db.execute<
      DepartmentRow[]
    >(
      `${departmentSelect}
       WHERE id = ?
       ORDER BY name ASC`,
      [departmentId]
    );

  return rows.map(
    mapDepartment
  );
}

export async function findDepartmentByPublicId(
  publicId: string,
  executor:
    DepartmentExecutor = db
): Promise<
  Department | null
> {
  const [rows] =
    await executor.execute<
      DepartmentRow[]
    >(
      `${departmentSelect}
       WHERE public_id = ?
       LIMIT 1`,
      [publicId]
    );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapDepartment(
    row
  );
}

export async function createDepartment(
  input:
    CreateDepartmentInput,
  executor:
    DepartmentExecutor = db
): Promise<Department> {
  const publicId =
    randomUUID();

  try {
    const [result] =
      await executor.execute<
        ResultSetHeader
      >(
        `
          INSERT INTO departments (
            public_id,
            code,
            name,
            description
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          publicId,
          input.code,
          input.name,
          input.description ??
            null,
        ]
      );

    const department =
      await findDepartmentById(
        result.insertId,
        executor
      );

    if (!department) {
      throw new Error(
        "Created department could not be loaded."
      );
    }

    return department;
  } catch (error) {
    return handleDepartmentDatabaseError(
      error
    );
  }
}

export async function updateDepartment(
  id: number,
  input:
    UpdateDepartmentInput,
  executor:
    DepartmentExecutor = db
): Promise<
  Department | null
> {
  const fields:
    string[] = [];

  const values: Array<
    string |
    number |
    boolean |
    null
  > = [];

  if (
    input.name !==
    undefined
  ) {
    fields.push(
      "name = ?"
    );

    values.push(
      input.name
    );
  }

  if (
    input.description !==
    undefined
  ) {
    fields.push(
      "description = ?"
    );

    values.push(
      input.description
    );
  }

  if (
    input.isActive !==
    undefined
  ) {
    fields.push(
      "is_active = ?"
    );

    values.push(
      input.isActive
    );
  }

  if (
    fields.length === 0
  ) {
    return findDepartmentById(
      id,
      executor
    );
  }

  values.push(id);

  try {
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE departments
        SET ${fields.join(
          ", "
        )}
        WHERE id = ?
      `,
      values
    );

    return await findDepartmentById(
      id,
      executor
    );
  } catch (error) {
    return handleDepartmentDatabaseError(
      error
    );
  }
}