import {
  describe,
  expect,
  it,
} from "vitest";
import {
  readFile,
} from "node:fs/promises";
import path from "node:path";

async function getMigration(
  filename: string
) {
  const migrationPath =
    path.join(
      process.cwd(),
      "database",
      "migrations",
      filename
    );

  return readFile(
    migrationPath,
    "utf8"
  );
}

async function getFoundationMigration() {
  return getMigration(
    "001_phase_1_foundation.sql"
  );
}

async function getApplicantIdentityMigration() {
  return getMigration(
    "003_applicant_identity.sql"
  );
}

async function getApplicantAuthRateLimitMigration() {
  return getMigration(
    "004_applicant_auth_rate_limits.sql"
  );
}

describe(
  "Phase 1 database migration",
  () => {
    it("contains all required foundation tables", async () => {
      const sql =
        await getFoundationMigration();

      expect(
        sql
      ).toContain(
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

      for (
        const table
        of requiredTables
      ) {
        expect(
          sql
        ).toContain(
          `CREATE TABLE ${table}`
        );
      }
    });

    it("provides the fields required for Super Admin bootstrap", async () => {
      const sql =
        await getFoundationMigration();

      expect(
        sql
      ).toContain(
        "first_name"
      );
      expect(
        sql
      ).toContain(
        "last_name"
      );
      expect(
        sql
      ).toContain(
        "email"
      );
      expect(
        sql
      ).toContain(
        "password_hash"
      );
      expect(
        sql
      ).toContain(
        "password_changed_at"
      );
      expect(
        sql
      ).toContain(
        "department_id"
      );
      expect(
        sql
      ).toContain(
        "assigned_by_user_id"
      );
      expect(
        sql
      ).toContain(
        "actor_user_id"
      );
      expect(
        sql
      ).toContain(
        "entity_type"
      );
      expect(
        sql
      ).toContain(
        "entity_id"
      );
      expect(
        sql
      ).toContain(
        "new_values"
      );
      expect(
        sql
      ).toContain(
        "metadata"
      );
    });

    it("stores hashed session tokens and revocation information", async () => {
      const sql =
        await getFoundationMigration();

      expect(
        sql
      ).toContain(
        "token_hash CHAR(64) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "expires_at DATETIME NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "revoked_at DATETIME NULL"
      );
      expect(
        sql
      ).toContain(
        "UNIQUE KEY uq_sessions_token_hash (token_hash)"
      );
    });

    it("defines staff department and role relationships", async () => {
      const sql =
        await getFoundationMigration();

      expect(
        sql
      ).toContain(
        "FOREIGN KEY (department_id)"
      );
      expect(
        sql
      ).toContain(
        "FOREIGN KEY (user_id)"
      );
      expect(
        sql
      ).toContain(
        "FOREIGN KEY (role_id)"
      );
      expect(
        sql
      ).toContain(
        "FOREIGN KEY (permission_id)"
      );
    });

    it("provides immutable audit data fields", async () => {
      const sql =
        await getFoundationMigration();

      expect(
        sql
      ).toContain(
        "previous_values JSON NULL"
      );
      expect(
        sql
      ).toContain(
        "new_values JSON NULL"
      );
      expect(
        sql
      ).toContain(
        "metadata JSON NULL"
      );
      expect(
        sql
      ).toContain(
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
      );
    });
  }
);

describe(
  "Task 14 applicant identity migration",
  () => {
    it("creates applicant identity tables separate from staff users", async () => {
      const sql =
        await getApplicantIdentityMigration();

      expect(
        sql
      ).toContain(
        "CREATE TABLE applicants"
      );
      expect(
        sql
      ).toContain(
        "CREATE TABLE applicant_email_verifications"
      );
      expect(
        sql
      ).toContain(
        "public_id CHAR(36) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "first_name VARCHAR(100) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "last_name VARCHAR(100) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "email VARCHAR(255) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "password_hash VARCHAR(255) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "email_verified_at DATETIME NULL"
      );
      expect(
        sql
      ).toContain(
        "UNIQUE KEY uq_applicants_public_id (public_id)"
      );
      expect(
        sql
      ).toContain(
        "UNIQUE KEY uq_applicants_email (email)"
      );
    });

    it("stores only hashed email verification tokens", async () => {
      const sql =
        await getApplicantIdentityMigration();

      expect(
        sql
      ).toContain(
        "token_hash CHAR(64) NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "expires_at DATETIME NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "consumed_at DATETIME NULL"
      );
      expect(
        sql
      ).toContain(
        "UNIQUE KEY uq_applicant_email_verifications_token_hash (token_hash)"
      );
      expect(
        sql
      ).not.toMatch(
        /^\s*(?:raw_)?token\s+(?:VARCHAR|CHAR|TEXT)/im
      );
    });

    it("links email verification records only to applicants", async () => {
      const sql =
        await getApplicantIdentityMigration();

      expect(
        sql
      ).toContain(
        "applicant_id BIGINT UNSIGNED NOT NULL"
      );
      expect(
        sql
      ).toContain(
        "FOREIGN KEY (applicant_id)"
      );
      expect(
        sql
      ).toContain(
        "REFERENCES applicants(id)"
      );
      expect(
        sql
      ).not.toContain(
        "REFERENCES users(id)"
      );
    });

    it("supports applicant account activation and verification state", async () => {
      const sql =
        await getApplicantIdentityMigration();

      expect(
        sql
      ).toContain(
        "is_active BOOLEAN NOT NULL DEFAULT TRUE"
      );
      expect(
        sql
      ).toContain(
        "email_verified_at DATETIME NULL"
      );
      expect(
        sql
      ).toContain(
        "KEY idx_applicants_active (is_active)"
      );
      expect(
        sql
      ).toContain(
        "KEY idx_applicant_email_verifications_applicant_id (applicant_id)"
      );
      expect(
        sql
      ).toContain(
        "KEY idx_applicant_email_verifications_expires_at (expires_at)"
      );
    });
  }
);

describe(
  "Task 14 applicant auth rate-limit migration",
  () => {
    it("creates a dedicated applicant auth rate-limit table", async () => {
      const sql =
        await getApplicantAuthRateLimitMigration();

      expect(
        sql
      ).toContain(
        "CREATE TABLE applicant_auth_rate_limits"
      );

      expect(
        sql
      ).not.toContain(
        "CREATE TABLE staff_login_rate_limits"
      );
    });

    it("stores only hashed rate-limit keys and supported actions", async () => {
      const sql =
        await getApplicantAuthRateLimitMigration();

      expect(
        sql
      ).toContain(
        "rate_limit_key CHAR(64) NOT NULL"
      );

      expect(
        sql
      ).toContain(
        "action VARCHAR(50) NOT NULL"
      );

      expect(
        sql
      ).not.toMatch(
        /^\s*(?:email|ip_address|client_ip)\s+(?:VARCHAR|CHAR|TEXT)/im
      );
    });

    it("tracks request counts, windows, and temporary blocks", async () => {
      const sql =
        await getApplicantAuthRateLimitMigration();

      expect(
        sql
      ).toContain(
        "request_count INT UNSIGNED NOT NULL DEFAULT 1"
      );

      expect(
        sql
      ).toContain(
        "window_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
      );

      expect(
        sql
      ).toContain(
        "blocked_until DATETIME NULL"
      );

      expect(
        sql
      ).toContain(
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
      );

      expect(
        sql
      ).toContain(
        "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
      );
    });

    it("separates rate limits by action and hashed key", async () => {
      const sql =
        await getApplicantAuthRateLimitMigration();

      expect(
        sql
      ).toContain(
        "UNIQUE KEY uq_applicant_auth_rate_limits_action_key (action, rate_limit_key)"
      );

      expect(
        sql
      ).toContain(
        "KEY idx_applicant_auth_rate_limits_blocked_until (blocked_until)"
      );

      expect(
        sql
      ).toContain(
        "KEY idx_applicant_auth_rate_limits_updated_at (updated_at)"
      );
    });
  }
);