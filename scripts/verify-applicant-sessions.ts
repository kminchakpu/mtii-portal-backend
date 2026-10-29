import {
  loadEnvConfig,
} from "@next/env";
import type {
  RowDataPacket,
} from "mysql2";

loadEnvConfig(
  process.cwd()
);

interface ColumnRow
  extends RowDataPacket {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
}

interface IndexRow
  extends RowDataPacket {
  INDEX_NAME: string;
  COLUMN_NAME: string;
  NON_UNIQUE: number;
}

interface ForeignKeyRow
  extends RowDataPacket {
  COLUMN_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
}

async function main() {
  const {
    db,
  } = await import(
    "../lib/db/pool"
  );

  try {
    const [
      columns,
    ] = await db.query<
      ColumnRow[]
    >(
      `
        SELECT
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'applicant_sessions'
        ORDER BY ORDINAL_POSITION
      `
    );

    if (
      columns.length === 0
    ) {
      throw new Error(
        "applicant_sessions table does not exist."
      );
    }

    const columnMap =
      new Map(
        columns.map(
          (column) => [
            column.COLUMN_NAME,
            column,
          ]
        )
      );

    const requiredColumns = [
      "id",
      "applicant_id",
      "token_hash",
      "expires_at",
      "revoked_at",
      "created_at",
      "updated_at",
    ];

    for (
      const column
      of requiredColumns
    ) {
      if (
        !columnMap.has(
          column
        )
      ) {
        throw new Error(
          `Missing applicant_sessions column: ${column}`
        );
      }
    }

    const tokenHash =
      columnMap.get(
        "token_hash"
      );

    if (
      !tokenHash ||
      tokenHash.COLUMN_TYPE
        .toLowerCase() !==
        "char(64)"
    ) {
      throw new Error(
        "applicant_sessions.token_hash must be CHAR(64)."
      );
    }

    const expiresAt =
      columnMap.get(
        "expires_at"
      );

    if (
      !expiresAt ||
      expiresAt.IS_NULLABLE !==
        "NO"
    ) {
      throw new Error(
        "applicant_sessions.expires_at must be required."
      );
    }

    const revokedAt =
      columnMap.get(
        "revoked_at"
      );

    if (
      !revokedAt ||
      revokedAt.IS_NULLABLE !==
        "YES"
    ) {
      throw new Error(
        "applicant_sessions.revoked_at must be nullable."
      );
    }

    const [
      indexes,
    ] = await db.query<
      IndexRow[]
    >(
      `
        SELECT
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'applicant_sessions'
      `
    );

    const hasUniqueTokenHash =
      indexes.some(
        (index) =>
          index.INDEX_NAME ===
            "uq_applicant_sessions_token_hash" &&
          index.COLUMN_NAME ===
            "token_hash" &&
          Number(
            index.NON_UNIQUE
          ) === 0
      );

    if (
      !hasUniqueTokenHash
    ) {
      throw new Error(
        "Missing unique applicant session token hash index."
      );
    }

    const requiredIndexes = [
      "idx_applicant_sessions_applicant_id",
      "idx_applicant_sessions_expires_at",
      "idx_applicant_sessions_revoked_at",
    ];

    for (
      const indexName
      of requiredIndexes
    ) {
      if (
        !indexes.some(
          (index) =>
            index.INDEX_NAME ===
            indexName
        )
      ) {
        throw new Error(
          `Missing applicant session index: ${indexName}`
        );
      }
    }

    const [
      foreignKeys,
    ] = await db.query<
      ForeignKeyRow[]
    >(
      `
        SELECT
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'applicant_sessions'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `
    );

    const applicantForeignKey =
      foreignKeys.find(
        (foreignKey) =>
          foreignKey.COLUMN_NAME ===
          "applicant_id"
      );

    if (
      !applicantForeignKey ||
      applicantForeignKey
        .REFERENCED_TABLE_NAME !==
        "applicants" ||
      applicantForeignKey
        .REFERENCED_COLUMN_NAME !==
        "id"
    ) {
      throw new Error(
        "applicant_sessions.applicant_id must reference applicants(id)."
      );
    }

    if (
      foreignKeys.some(
        (foreignKey) =>
          foreignKey
            .REFERENCED_TABLE_NAME ===
          "users"
      )
    ) {
      throw new Error(
        "Applicant sessions must not reference staff users."
      );
    }

    console.log(
      "Applicant session schema verification successful."
    );
    console.log(
      "Table: applicant_sessions"
    );
    console.log(
      "SHA-256 token storage: CHAR(64)"
    );
    console.log(
      "Unique token hash: verified"
    );
    console.log(
      "Applicant foreign key: verified"
    );
    console.log(
      "Staff user isolation: verified"
    );
    console.log(
      "Expiration tracking: verified"
    );
    console.log(
      "Revocation tracking: verified"
    );
    console.log(
      "Required indexes: verified"
    );
  } finally {
    await db.end();
  }
}

main().catch(
  (error) => {
    console.error(
      "Applicant session schema verification failed."
    );

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      );
    }

    process.exitCode = 1;
  }
);