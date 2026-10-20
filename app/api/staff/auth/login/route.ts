import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  authenticateStaff,
  InvalidStaffCredentialsError,
} from "@/lib/auth/staff-auth-service";
import {
  getSessionConfig,
} from "@/lib/auth/session-config";
import {
  getSessionCookieOptions,
  type AppEnvironment,
} from "@/lib/auth/session-cookie";
import {
  writeAuditLog,
} from "@/lib/audit/logger";

function getAppEnvironment(): AppEnvironment {
  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  return "production";
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const result = await authenticateStaff(
      body
    );

    await writeAuditLog({
      actorUserId: result.user.id,
      departmentId:
        result.user.departmentId,
      action: "STAFF_LOGIN",
      entityType: "USER",
      entityId: result.user.publicId,
      metadata: {
        source: "staff-auth",
      },
    });

    const response = NextResponse.json(
      {
        user: {
          publicId: result.user.publicId,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          departmentCode:
            result.user.departmentCode,
        },
      },
      {
        status: 200,
      }
    );

    const { cookieName } =
      getSessionConfig();

    response.cookies.set(
      cookieName,
      result.session.token,
      getSessionCookieOptions(
        result.session.expiresAt,
        getAppEnvironment()
      )
    );

    return response;
  } catch (error) {
    if (
      error instanceof
      InvalidStaffCredentialsError
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            "Invalid login request.",
        },
        {
          status: 400,
        }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "Staff login failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign in at this time.",
      },
      {
        status: 500,
      }
    );
  }
}