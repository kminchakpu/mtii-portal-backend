import { db } from "./pool";

export async function checkDatabaseConnection(): Promise<boolean> {
  const [rows] = await db.query("SELECT 1 AS connected");

  return Array.isArray(rows);
}