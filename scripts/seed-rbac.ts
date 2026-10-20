import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import type { RowDataPacket } from "mysql2";

loadEnvConfig(process.cwd());

interface IdRow extends RowDataPacket {
  id: number;
}

async function main() {
  const { db } = await import("../lib/db/pool");
  const {
    departments,
    permissions,
    roles,
    rolePermissions,
  } = await import("../database/seeds/rbac-data");

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const department of departments) {
      await connection.execute(
        `
          INSERT INTO departments (
            public_id,
            code,
            name,
            description
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
        `,
        [
          randomUUID(),
          department.code,
          department.name,
          department.description,
        ]
      );
    }

    for (const role of roles) {
      await connection.execute(
        `
          INSERT INTO roles (
            public_id,
            code,
            name,
            description
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
        `,
        [
          randomUUID(),
          role.code,
          role.name,
          role.description,
        ]
      );
    }

    for (const permission of permissions) {
      await connection.execute(
        `
          INSERT INTO permissions (
            public_id,
            code,
            name,
            description
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
        `,
        [
          randomUUID(),
          permission.code,
          permission.name,
          permission.description,
        ]
      );
    }

    for (const [roleCode, permissionCodes] of Object.entries(
      rolePermissions
    )) {
      const [roleRows] = await connection.execute<
        IdRow[]
      >(
        `
          SELECT id
          FROM roles
          WHERE code = ?
          LIMIT 1
        `,
        [roleCode]
      );

      const role = roleRows[0];

      if (!role) {
        throw new Error(`Role not found: ${roleCode}`);
      }

          await connection.execute(
      `
        DELETE FROM role_permissions
        WHERE role_id = ?
      `,
      [role.id]
    );

      for (const permissionCode of permissionCodes) {
        const [permissionRows] = await connection.execute<
          IdRow[]
        >(
          `
            SELECT id
            FROM permissions
            WHERE code = ?
            LIMIT 1
          `,
          [permissionCode]
        );

        const permission = permissionRows[0];

        if (!permission) {
          throw new Error(
            `Permission not found: ${permissionCode}`
          );
        }

        await connection.execute(
          `
            INSERT IGNORE INTO role_permissions (
              role_id,
              permission_id
            )
            VALUES (?, ?)
          `,
          [role.id, permission.id]
        );
      }
    }

    await connection.commit();

    console.log("MTII RBAC seed completed successfully.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error("MTII RBAC seed failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});