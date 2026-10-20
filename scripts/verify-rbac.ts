import { loadEnvConfig } from "@next/env";
import type { RowDataPacket } from "mysql2";

loadEnvConfig(process.cwd());

interface CountRow extends RowDataPacket {
  count: number;
}

interface PermissionRow extends RowDataPacket {
  role_code: string;
  permission_code: string;
}

async function main() {
  const { db } = await import("../lib/db/pool");

  try {
    const [departmentRows] = await db.query<CountRow[]>(
      "SELECT COUNT(*) AS count FROM departments"
    );

    const [roleRows] = await db.query<CountRow[]>(
      "SELECT COUNT(*) AS count FROM roles"
    );

    const [permissionRows] = await db.query<CountRow[]>(
      "SELECT COUNT(*) AS count FROM permissions"
    );

    console.log("MTII RBAC counts:");
    console.table({
      departments: departmentRows[0]?.count ?? 0,
      roles: roleRows[0]?.count ?? 0,
      permissions: permissionRows[0]?.count ?? 0,
    });

    const [decisionPermissions] =
      await db.query<PermissionRow[]>(`
        SELECT
          r.code AS role_code,
          p.code AS permission_code
        FROM role_permissions rp
        INNER JOIN roles r
          ON r.id = rp.role_id
        INNER JOIN permissions p
          ON p.id = rp.permission_id
        WHERE r.code IN ('DIRECTOR', 'REVIEW_OFFICER')
          AND p.code IN (
            'APPLICATION_REVIEW',
            'APPLICATION_RECOMMEND',
            'APPLICATION_APPROVE',
            'APPLICATION_REJECT'
          )
        ORDER BY r.code, p.code
      `);

    console.log("Application decision permissions:");
    console.table(decisionPermissions);

    const reviewOfficerFinalDecision =
      decisionPermissions.some(
        (row) =>
          row.role_code === "REVIEW_OFFICER" &&
          (
            row.permission_code === "APPLICATION_APPROVE" ||
            row.permission_code === "APPLICATION_REJECT"
          )
      );

    if (reviewOfficerFinalDecision) {
      throw new Error(
        "REVIEW_OFFICER must not have final approval or rejection permission."
      );
    }

    const directorPermissions = new Set(
      decisionPermissions
        .filter((row) => row.role_code === "DIRECTOR")
        .map((row) => row.permission_code)
    );

    if (
      !directorPermissions.has("APPLICATION_APPROVE") ||
      !directorPermissions.has("APPLICATION_REJECT")
    ) {
      throw new Error(
        "DIRECTOR must have application approval and rejection permissions."
      );
    }

    console.log("MTII RBAC verification successful.");
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("MTII RBAC verification failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});