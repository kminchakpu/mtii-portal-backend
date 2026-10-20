import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("../lib/db/pool");

  try {
    const [tables] = await db.query("SHOW TABLES");

    console.log("MTII Phase 1 tables:");
    console.table(tables);

    const [migrations] = await db.query(`
      SELECT id, migration_name, executed_at
      FROM schema_migrations
      ORDER BY id
    `);

    console.log("Applied migrations:");
    console.table(migrations);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Schema verification failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});