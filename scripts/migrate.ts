import { loadEnvConfig } from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

loadEnvConfig(process.cwd());

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function main() {
  const { db } = await import("../lib/db/pool");

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        migration_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_schema_migrations_name (migration_name)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
    `);

    const migrationsDirectory = path.join(
      process.cwd(),
      "database",
      "migrations"
    );

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const migrationFile of migrationFiles) {
      const [existing] = await db.execute(
        `
          SELECT id
          FROM schema_migrations
          WHERE migration_name = ?
          LIMIT 1
        `,
        [migrationFile]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        console.log(
          `Skipping ${migrationFile} - already applied.`
        );
        continue;
      }

      const migrationPath = path.join(
        migrationsDirectory,
        migrationFile
      );

      const sql = await readFile(migrationPath, "utf8");
      const statements = splitSqlStatements(sql);

      console.log(`Applying ${migrationFile}...`);

      const connection = await db.getConnection();

      try {
        for (const statement of statements) {
          await connection.query(statement);
        }

        await connection.execute(
          `
            INSERT INTO schema_migrations (migration_name)
            VALUES (?)
          `,
          [migrationFile]
        );

        console.log(`Applied ${migrationFile}.`);
      } finally {
        connection.release();
      }
    }

    console.log("Database migrations complete.");
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Database migration failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});