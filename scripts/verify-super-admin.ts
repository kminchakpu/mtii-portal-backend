import { loadEnvConfig } from "@next/env";
import type { RowDataPacket } from "mysql2";
import { verifyPassword } from "../lib/auth/password";
import { getSuperAdminConfig } from "../lib/auth/super-admin-config";

loadEnvConfig(process.cwd());

interface SuperAdminRow extends RowDataPacket {
  public_id: string;
  email: string;
  password_hash: string;
  is_active: number;
  role_code: string;
  department_code: string | null;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface AuditRow extends RowDataPacket {
  action: string;
  entity_type: string;
  entity_id: string;
}

async function main() {
  const { db } = await import("../lib/db/pool");
  const config = getSuperAdminConfig();

  try {
    const [countRows] = await db.query<CountRow[]>(
      `
        SELECT COUNT(*) AS count
        FROM user_roles ur
        INNER JOIN roles r
          ON r.id = ur.role_id
        WHERE r.code = 'SUPER_ADMIN'
      `
    );

    const superAdminCount = countRows[0]?.count ?? 0;

    if (superAdminCount !== 1) {
      throw new Error(
        `Expected exactly one Super Admin, found ${superAdminCount}.`
      );
    }

    const [users] = await db.execute<SuperAdminRow[]>(
      `
        SELECT
          u.public_id,
          u.email,
          u.password_hash,
          u.is_active,
          r.code AS role_code,
          d.code AS department_code
        FROM users u
        INNER JOIN user_roles ur
          ON ur.user_id = u.id
        INNER JOIN roles r
          ON r.id = ur.role_id
        LEFT JOIN departments d
          ON d.id = u.department_id
        WHERE r.code = 'SUPER_ADMIN'
        LIMIT 1
      `
    );

    const superAdmin = users[0];

    if (!superAdmin) {
      throw new Error(
        "Super Admin account could not be loaded."
      );
    }

    if (superAdmin.email !== config.email) {
      throw new Error(
        "Super Admin email does not match the bootstrap configuration."
      );
    }

    if (!superAdmin.password_hash.startsWith("$2")) {
      throw new Error(
        "Super Admin password is not stored as a bcrypt hash."
      );
    }

    if (superAdmin.password_hash === config.password) {
      throw new Error(
        "Super Admin password was stored as plaintext."
      );
    }

    const passwordMatches = await verifyPassword(
      config.password,
      superAdmin.password_hash
    );

    if (!passwordMatches) {
      throw new Error(
        "Super Admin password verification failed."
      );
    }

    if (superAdmin.role_code !== "SUPER_ADMIN") {
      throw new Error(
        "SUPER_ADMIN role assignment is missing."
      );
    }

    if (superAdmin.department_code !== "ADMIN") {
      throw new Error(
        "Super Admin is not assigned to the ADMIN department."
      );
    }

    if (!superAdmin.is_active) {
      throw new Error(
        "Super Admin account is not active."
      );
    }

    const [auditRows] = await db.execute<AuditRow[]>(
      `
        SELECT
          action,
          entity_type,
          entity_id
        FROM audit_logs
        WHERE action = 'SUPER_ADMIN_BOOTSTRAPPED'
          AND entity_type = 'USER'
          AND entity_id = ?
        LIMIT 1
      `,
      [superAdmin.public_id]
    );

    if (!auditRows[0]) {
      throw new Error(
        "Super Admin bootstrap audit record is missing."
      );
    }

    console.log("Super Admin verification successful.");
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Department: ${superAdmin.department_code}`);
    console.log(`Role: ${superAdmin.role_code}`);
    console.log("Password storage: bcrypt hash verified");
    console.log("Audit record: verified");
    console.log(`Super Admin count: ${superAdminCount}`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Super Admin verification failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});