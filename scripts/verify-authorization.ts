import { loadEnvConfig } from "@next/env";
import type {
  RowDataPacket,
} from "mysql2";

loadEnvConfig(process.cwd());

interface UserIdRow
  extends RowDataPacket {
  id: number;
}

async function main() {
  const { db } = await import(
    "@/lib/db/pool"
  );

  const {
    getAuthorizationContext,
  } = await import(
    "@/lib/rbac/authorization-repository"
  );

  try {
    const [rows] =
      await db.execute<UserIdRow[]>(
        `
          SELECT u.id
          FROM users u
          INNER JOIN user_roles ur
            ON ur.user_id = u.id
          INNER JOIN roles r
            ON r.id = ur.role_id
          WHERE r.code = 'SUPER_ADMIN'
            AND u.is_active = TRUE
          LIMIT 1
        `
      );

    const user = rows[0];

    if (!user) {
      throw new Error(
        "No active Super Admin was found."
      );
    }

    const context =
      await getAuthorizationContext(
        user.id
      );

    if (!context) {
      throw new Error(
        "Authorization context was not created."
      );
    }

    if (
      !context.roles.includes(
        "SUPER_ADMIN"
      )
    ) {
      throw new Error(
        "SUPER_ADMIN role is missing."
      );
    }

    if (
      context.departmentCode !==
      "ADMIN"
    ) {
      throw new Error(
        `Expected ADMIN department but received ${context.departmentCode ?? "none"}.`
      );
    }

    const requiredPermissions = [
      "USER_MANAGE",
      "ROLE_ASSIGN",
      "APPLICATION_APPROVE",
      "APPLICATION_REJECT",
      "AUDIT_VIEW",
    ];

    for (
      const permission
      of requiredPermissions
    ) {
      if (
        !context.permissions.includes(
          permission
        )
      ) {
        throw new Error(
          `Missing expected permission: ${permission}`
        );
      }
    }

    console.log(
      "Authorization context verification successful."
    );

    console.log(
      `Department: ${context.departmentCode}`
    );

    console.log(
      `Roles: ${context.roles.join(", ")}`
    );

    console.log(
      `Permissions loaded: ${context.permissions.length}`
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Authorization verification failed."
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});