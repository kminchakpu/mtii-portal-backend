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
  createStaffLoginRateLimitKey,
} from "@/lib/auth/staff-login-rate-limit-key";
import {
  clearStaffLoginFailures,
  isStaffLoginBlocked,
  recordFailedStaffLogin,
} from "@/lib/auth/staff-login-rate-limit-service";
import {
  writeAuditLog,
} from "@/lib/audit/logger";
import {
  enforceStaffRequestOrigin,
  StaffCrossSiteRequestError,
} from "@/lib/http/staff-request-security";
import {
  logServerError,
} from "@/lib/security/server-error-logger";

function getAppEnvironment(): AppEnvironment {
  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  return "production";
}

function getLoginEmail(
  body: unknown
): string | null {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return null;
  }

  if (
    !("email" in body) ||
    typeof body.email !== "string"
  ) {
    return null;
  }

  return body.email;
}

export async function POST(
  request: Request
) {
  let rateLimitKey:
    | string
    | null = null;

  try {
    enforceStaffRequestOrigin(
      request
    );

    const body: unknown =
      await request.json();

    const email =
      getLoginEmail(body);

    if (email !== null) {
      rateLimitKey =
        createStaffLoginRateLimitKey(
          request,
          email
        );

      const blockStatus =
        await isStaffLoginBlocked(
          rateLimitKey
        );

      if (blockStatus.blocked) {
        return NextResponse.json(
          {
            error:
              "Too many login attempts. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "Retry-After":
                String(
                  blockStatus.retryAfterSeconds
                ),
            },
          }
        );
      }
    }

    const result =
      await authenticateStaff(
        body
      );

    if (rateLimitKey) {
      await clearStaffLoginFailures(
        rateLimitKey
      );
    }

    await writeAuditLog({
      actorUserId:
        result.user.id,
      departmentId:
        result.user.departmentId,
      action: "STAFF_LOGIN",
      entityType: "USER",
      entityId:
        result.user.publicId,
      metadata: {
        source: "staff-auth",
      },
    });

    const response =
      NextResponse.json(
        {
          user: {
            publicId:
              result.user.publicId,
            firstName:
              result.user.firstName,
            lastName:
              result.user.lastName,
            email:
              result.user.email,
            departmentCode:
              result.user.departmentCode,
          },
        },
        {
          status: 200,
        }
      );

    const {
      cookieName,
    } = getSessionConfig();

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
      StaffCrossSiteRequestError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 403,
        }
      );
    }

    if (
      error instanceof
      InvalidStaffCredentialsError
    ) {
      if (rateLimitKey) {
        try {
          await recordFailedStaffLogin(
            rateLimitKey
          );
        } catch (
          rateLimitError
        ) {
          logServerError(
            "Unable to record failed staff login attempt.",
            rateLimitError
          );
        }
      }

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

    logServerError(
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