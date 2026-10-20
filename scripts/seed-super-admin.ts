import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import type { RowDataPacket } from "mysql2";

loadEnvConfig(process.cwd());

interface IdRow extends RowDataPacket {
  id: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

async function main() {
  const { db } = await import("../lib/db/pool");
  const { hashPassword } = await import(
    "../lib/auth/password"
  );
  const { getSuperAdminConfig } = await import(
    "../lib/auth/super-admin-config"
  );

  const config = getSuperAdminConfig();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [superAdminRows] =
      await connection.execute<CountRow[]>(
        `
          SELECT COUNT(*) AS count
          FROM user_roles ur
          INNER JOIN roles r
            ON r.id = ur.role_id
          WHERE r.code = 'SUPER_ADMIN'
        `
      );

    if ((superAdminRows[0]?.count ?? 0) > 0) {
      throw new Error(
        "Super Admin bootstrap refused: a Super Admin already exists."
      );
    }

    const [departmentRows] =
      await connection.execute<IdRow[]>(
        `
          SELECT id
          FROM departments
          WHERE code = 'ADMIN'
            AND is_active = TRUE
          LIMIT 1
        `
      );

    const department = departmentRows[0];

    if (!department) {
      throw new Error(
        "ADMIN department not found. Run the RBAC seed first."
      );
    }

    const [roleRows] =
      await connection.execute<IdRow[]>(
        `
          SELECT id
          FROM roles
          WHERE code = 'SUPER_ADMIN'
            AND is_active = TRUE
          LIMIT 1
        `
      );

    const role = roleRows[0];

    if (!role) {
      throw new Error(
        "SUPER_ADMIN role not found. Run the RBAC seed first."
      );
    }

    const [emailRows] =
      await connection.execute<CountRow[]>(
        `
          SELECT COUNT(*) AS count
          FROM users
          WHERE email = ?
        `,
        [config.email]
      );

    if ((emailRows[0]?.count ?? 0) > 0) {
      throw new Error(
        "Super Admin bootstrap refused: the email address already belongs to a staff account."
      );
    }

    const passwordHash = await hashPassword(
      config.password
    );

    const userPublicId = randomUUID();

    const [result] = await connection.execute(
      `
        INSERT INTO users (
          public_id,
          department_id,
          first_name,
          last_name,
          email,
          password_hash,
          password_changed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        userPublicId,
        department.id,
        config.firstName,
        config.lastName,
        config.email,
        passwordHash,
      ]
    );

    const insertResult = result as {
      insertId: number;
    };

    const userId = insertResult.insertId;

    await connection.execute(
      `
        INSERT INTO user_roles (
          user_id,
          role_id,
          assigned_by_user_id
        )
        VALUES (?, ?, NULL)
      `,
      [userId, role.id]
    );

    await connection.execute(
      `
        INSERT INTO audit_logs (
          public_id,
          actor_user_id,
          department_id,
          action,
          entity_type,
          entity_id,
          new_values,
          metadata
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        randomUUID(),
        userId,
        department.id,
        "SUPER_ADMIN_BOOTSTRAPPED",
        "USER",
        userPublicId,
        JSON.stringify({
          firstName: config.firstName,
          lastName: config.lastName,
          email: config.email,
          role: "SUPER_ADMIN",
        }),
        JSON.stringify({
          source: "seed:super-admin",
        }),
      ]
    );

    await connection.commit();

    console.log(
      `Super Admin created successfully for ${config.email}.`
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error("Super Admin bootstrap failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});