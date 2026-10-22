import { NextResponse } from "next/server";
import {
  getSessionConfig,
} from "@/lib/auth/session-config";
import {
  findStaffSessionByToken,
  revokeStaffSession,
} from "@/lib/auth/session-repository";
import {
  readRequestCookie,
} from "@/lib/auth/request-cookie";
import {
  writeAuditLog,
} from "@/lib/audit/logger";
import {
  enforceStaffRequestOrigin,
  StaffCrossSiteRequestError,
} from "@/lib/http/staff-request-security";

export async function POST(
  request: Request
) {
  try {
    enforceStaffRequestOrigin(
      request
    );

    const { cookieName } =
      getSessionConfig();

    const token = readRequestCookie(
      request,
      cookieName
    );

    if (token) {
      const session =
        await findStaffSessionByToken(
          token
        );

      if (session) {
        const revoked =
          await revokeStaffSession(token);

        if (revoked) {
          await writeAuditLog({
            actorUserId: session.userId,
            action: "STAFF_LOGOUT",
            entityType: "SESSION",
            entityId: session.publicId,
            metadata: {
              source: "staff-auth",
            },
          });
        }
      }
    }

    const response = NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );

    response.cookies.set(
      cookieName,
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV !==
          "development",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
      }
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

    console.error(
      "Staff logout failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign out at this time.",
      },
      {
        status: 500,
      }
    );
  }
}