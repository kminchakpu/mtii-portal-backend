import { NextResponse } from "next/server";
import type {
  RowDataPacket,
} from "mysql2";
import { db } from "@/lib/db/pool";
import {
  getSessionConfig,
} from "@/lib/auth/session-config";
import {
  findStaffSessionByToken,
} from "@/lib/auth/session-repository";
import {
  readRequestCookie,
} from "@/lib/auth/request-cookie";

interface CurrentStaffRow
  extends RowDataPacket {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_code: string | null;
}

export async function GET(
  request: Request
) {
  try {
    const { cookieName } =
      getSessionConfig();

    const token = readRequestCookie(
      request,
      cookieName
    );

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await findStaffSessionByToken(
        token
      );

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const [rows] =
      await db.execute<
        CurrentStaffRow[]
      >(
        `
          SELECT
            u.public_id,
            u.first_name,
            u.last_name,
            u.email,
            d.code AS department_code
          FROM users u
          LEFT JOIN departments d
            ON d.id = u.department_id
          WHERE u.id = ?
            AND u.is_active = TRUE
          LIMIT 1
        `,
        [session.userId]
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
        publicId: user.public_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        departmentCode:
          user.department_code,
      },
    });
  } catch (error) {
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