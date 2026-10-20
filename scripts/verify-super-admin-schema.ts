import { loadEnvConfig } from "@next/env";
import type { RowDataPacket } from "mysql2";

loadEnvConfig(process.cwd());

interface ColumnRow extends RowDataPacket {
  TABLE_NAME: string;
  COLUMN_NAME: string;
}

const requiredColumns = {
  users: [
    "public_id",
    "department_id",
    "first_name",
    "last_name",
    "email",
    "password_hash",
    "password_changed_at",
  ],
  user_roles: [
    "user_id",
    "role_id",
    "assigned_by_user_id",
  ],
  audit_logs: [
    "public_id",
    "actor_user_id",
    "department_id",
    "action",
    "entity_type",
    "entity_id",
    "new_values",
    "metadata",
  ],
};

async function main() {
  const { db } = await import("../lib/db/pool");

  try {
    const [rows] = await db.query<ColumnRow[]>(
      `
        SELECT
          TABLE_NAME,
          COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (
            'users',
            'user_roles',
            'audit_logs'
          )
      `
    );

    for (const [table, columns] of Object.entries(
      requiredColumns
    )) {
      const actualColumns = new Set(
        rows
          .filter((row) => row.TABLE_NAME === table)
          .map((row) => row.COLUMN_NAME)
      );

      for (const column of columns) {
        if (!actualColumns.has(column)) {
          throw new Error(
            `Missing required column: ${table}.${column}`
          );
        }
      }
    }

    console.log(
      "Super Admin bootstrap schema verification successful."
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Super Admin bootstrap schema verification failed."
  );

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});