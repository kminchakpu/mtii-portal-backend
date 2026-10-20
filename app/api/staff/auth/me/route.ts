import {
  NextResponse,
} from "next/server";
import type {
  RowDataPacket,
} from "mysql2";
import { db } from "@/lib/db/pool";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";

interface CurrentStaffRow
  extends RowDataPacket {
  first_name: string;
  last_name: string;
  email: string;
}

export async function GET(
  request: Request
) {
  try {
    const context =
      await getRequestAuthorization(
        request
      );

    const [rows] =
      await db.execute<
        CurrentStaffRow[]
      >(
        `
          SELECT
            first_name,
            last_name,
            email
          FROM users
          WHERE id = ?
            AND is_active = TRUE
          LIMIT 1
        `,
        [context.userId]
      );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthenticated.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      user: {
        publicId:
          context.publicId,
        firstName:
          user.first_name,
        lastName:
          user.last_name,
        email:
          user.email,
        departmentCode:
          context.departmentCode,
        roles:
          context.roles,
        permissions:
          context.permissions,
      },
    });
  } catch (error) {
    const authorizationResponse =
      handleAuthorizationError(
        error
      );

    if (authorizationResponse) {
      return authorizationResponse;
    }

    console.error(
      "Current staff lookup failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify session.",
      },
      {
        status: 500,
      }
    );
  }
}