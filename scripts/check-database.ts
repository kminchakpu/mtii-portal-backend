import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { checkDatabaseConnection } = await import(
    "../lib/db/health"
  );
  const { db } = await import("../lib/db/pool");

  try {
    const connected = await checkDatabaseConnection();

    if (!connected) {
      throw new Error("Database health check failed.");
    }

    console.log("MTII database connection successful.");
  } catch (error) {
    console.error("MTII database connection failed.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();