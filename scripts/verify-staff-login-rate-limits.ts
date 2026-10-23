import { loadEnvConfig } from "@next/env";
import type {
  RowDataPacket,
} from "mysql2";

loadEnvConfig(process.cwd());

interface TableRow extends RowDataPacket {
  TABLE_NAME: string;
}

interface ColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_DEFAULT:
    | string
    | number
    | null;
}

interface IndexRow extends RowDataPacket {
  INDEX_NAME: string;
  COLUMN_NAME: string;
  NON_UNIQUE: number;
}

function findColumn(
  columns: ColumnRow[],
  name: string
): ColumnRow {
  const column =
    columns.find(
      (item) =>
        item.COLUMN_NAME === name
    );

  if (!column) {
    throw new Error(
      `Missing required column: ${name}`
    );
  }

  return column;
}

async function main() {
  const { db } = await import(
    "../lib/db/pool"
  );

  try {
    const [tables] =
      await db.execute<TableRow[]>(
        `
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
          LIMIT 1
        `,
        [
          "staff_login_rate_limits",
        ]
      );

    if (!tables[0]) {
      throw new Error(
        "staff_login_rate_limits table does not exist."
      );
    }

    const [columns] =
      await db.execute<ColumnRow[]>(
        `
          SELECT
            COLUMN_NAME,
            COLUMN_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `,
        [
          "staff_login_rate_limits",
        ]
      );

    const requiredColumns = [
      "id",
      "rate_limit_key",
      "failed_attempts",
      "window_started_at",
      "blocked_until",
      "created_at",
      "updated_at",
    ];

    for (
      const columnName
      of requiredColumns
    ) {
      findColumn(
        columns,
        columnName
      );
    }

    const rateLimitKey =
      findColumn(
        columns,
        "rate_limit_key"
      );

    if (
      rateLimitKey.COLUMN_TYPE
        .toLowerCase() !==
      "char(64)"
    ) {
      throw new Error(
        "rate_limit_key must be CHAR(64)."
      );
    }

    if (
      rateLimitKey.IS_NULLABLE !==
      "NO"
    ) {
      throw new Error(
        "rate_limit_key must be NOT NULL."
      );
    }

    const failedAttempts =
      findColumn(
        columns,
        "failed_attempts"
      );

    if (
      failedAttempts.COLUMN_TYPE
        .toLowerCase() !==
      "int unsigned"
    ) {
      throw new Error(
        "failed_attempts must be INT UNSIGNED."
      );
    }

    if (
      failedAttempts.IS_NULLABLE !==
      "NO"
    ) {
      throw new Error(
        "failed_attempts must be NOT NULL."
      );
    }

    if (
      String(
        failedAttempts.COLUMN_DEFAULT
      ) !== "1"
    ) {
      throw new Error(
        "failed_attempts must default to 1."
      );
    }

    const windowStartedAt =
      findColumn(
        columns,
        "window_started_at"
      );

    if (
      windowStartedAt.IS_NULLABLE !==
      "NO"
    ) {
      throw new Error(
        "window_started_at must be NOT NULL."
      );
    }

    const blockedUntil =
      findColumn(
        columns,
        "blocked_until"
      );

    if (
      blockedUntil.IS_NULLABLE !==
      "YES"
    ) {
      throw new Error(
        "blocked_until must allow NULL."
      );
    }

    const [indexes] =
      await db.execute<IndexRow[]>(
        `
          SELECT
            INDEX_NAME,
            COLUMN_NAME,
            NON_UNIQUE
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
        `,
        [
          "staff_login_rate_limits",
        ]
      );

    const uniqueKey =
      indexes.find(
        (index) =>
          index.INDEX_NAME ===
            "uq_staff_login_rate_limits_key" &&
          index.COLUMN_NAME ===
            "rate_limit_key" &&
          Number(
            index.NON_UNIQUE
          ) === 0
      );

    if (!uniqueKey) {
      throw new Error(
        "Unique rate_limit_key index is missing."
      );
    }

    const blockedUntilIndex =
      indexes.find(
        (index) =>
          index.INDEX_NAME ===
            "idx_staff_login_rate_limits_blocked_until" &&
          index.COLUMN_NAME ===
            "blocked_until"
      );

    if (!blockedUntilIndex) {
      throw new Error(
        "blocked_until index is missing."
      );
    }

    const updatedAtIndex =
      indexes.find(
        (index) =>
          index.INDEX_NAME ===
            "idx_staff_login_rate_limits_updated_at" &&
          index.COLUMN_NAME ===
            "updated_at"
      );

    if (!updatedAtIndex) {
      throw new Error(
        "updated_at index is missing."
      );
    }

    console.log(
      "Staff login rate-limit schema verification successful."
    );
    console.log(
      "Table: staff_login_rate_limits"
    );
    console.log(
      "SHA-256 key storage: CHAR(64)"
    );
    console.log(
      "Unique rate-limit key: verified"
    );
    console.log(
      "Failure counter: verified"
    );
    console.log(
      "Attempt window: verified"
    );
    console.log(
      "Block expiration: verified"
    );
    console.log(
      "Required indexes: verified"
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Staff login rate-limit schema verification failed."
  );

  if (error instanceof Error) {
    console.error(
      error.message
    );
  }

  process.exitCode = 1;
});