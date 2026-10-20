import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function getFoundationMigration() {
  const migrationPath = path.join(
    process.cwd(),
    "database",
    "migrations",
    "001_phase_1_foundation.sql"
  );

  return readFile(migrationPath, "utf8");
}

describe("Phase 1 database migration", () => {
  it("contains all required foundation tables", async () => {
    const sql = await getFoundationMigration();
expect(sql).toContain(
  "CREATE TABLE IF NOT EXISTS schema_migrations"
);

    const requiredTables = [
      "departments",
      "users",
      "roles",
      "permissions",
      "role_permissions",
      "user_roles",
      "sessions",
      "audit_logs",
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }
  });

  it("provides the fields required for Super Admin bootstrap", async () => {
    const sql = await getFoundationMigration();
    expect(sql).toContain("first_name");
    expect(sql).toContain("last_name");
    expect(sql).toContain("email");
    expect(sql).toContain("password_hash");
    expect(sql).toContain("password_changed_at");
    expect(sql).toContain("department_id");
    expect(sql).toContain("assigned_by_user_id");
    expect(sql).toContain("actor_user_id");
    expect(sql).toContain("entity_type");
    expect(sql).toContain("entity_id");
    expect(sql).toContain("new_values");
    expect(sql).toContain("metadata");
  });

  it("stores hashed session tokens and revocation information", async () => {
    const sql = await getFoundationMigration();

    expect(sql).toContain("token_hash CHAR(64) NOT NULL");
    expect(sql).toContain("expires_at DATETIME NOT NULL");
    expect(sql).toContain("revoked_at DATETIME NULL");
    expect(sql).toContain(
      "UNIQUE KEY uq_sessions_token_hash (token_hash)"
    );
  });

  it("defines staff department and role relationships", async () => {
    const sql = await getFoundationMigration();

    expect(sql).toContain("FOREIGN KEY (department_id)");
    expect(sql).toContain("FOREIGN KEY (user_id)");
    expect(sql).toContain("FOREIGN KEY (role_id)");
    expect(sql).toContain("FOREIGN KEY (permission_id)");
  });

  it("provides immutable audit data fields", async () => {
    const sql = await getFoundationMigration();

    expect(sql).toContain("previous_values JSON NULL");
    expect(sql).toContain("new_values JSON NULL");
    expect(sql).toContain("metadata JSON NULL");
    expect(sql).toContain(
      "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
  });
});