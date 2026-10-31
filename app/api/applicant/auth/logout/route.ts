import {
  NextResponse,
} from "next/server";

import {
  getApplicantSessionConfig,
} from "@/lib/applicant-auth/applicant-session-config";

import {
  revokeApplicantSession,
} from "@/lib/applicant-auth/applicant-session-repository";

import {
  ApplicantCrossSiteRequestError,
  enforceApplicantRequestOrigin,
} from "@/lib/http/applicant-request-security";

import {
  logServerError,
} from "@/lib/security/server-error-logger";

const LOGOUT_SUCCESS_MESSAGE =
  "Signed out successfully.";

const LOGOUT_SERVER_ERROR =
  "Unable to sign out at this time.";

function getCookieValue(
  request: Request,
  cookieName: string
): string | null {
  const cookieHeader =
    request.headers.get(
      "cookie"
    );

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (
    const cookie of cookies
  ) {
    const trimmedCookie =
      cookie.trim();

    const separatorIndex =
      trimmedCookie.indexOf(
        "="
      );

    if (
      separatorIndex === -1
    ) {
      continue;
    }

    const name =
      trimmedCookie
        .slice(
          0,
          separatorIndex
        )
        .trim();

    if (
      name !== cookieName
    ) {
      continue;
    }

    const value =
      trimmedCookie
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (!value) {
      return null;
    }

    return value;
  }

  return null;
}

function clearApplicantSessionCookie(
  response: NextResponse,
  cookieName: string
): void {
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
      expires:
        new Date(0),
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    enforceApplicantRequestOrigin(
      request
    );

    const {
      cookieName,
    } =
      getApplicantSessionConfig();

    const token =
      getCookieValue(
        request,
        cookieName
      );

    if (token) {
      await revokeApplicantSession(
        token
      );
    }

    const response =
      NextResponse.json(
        {
          message:
            LOGOUT_SUCCESS_MESSAGE,
        },
        {
          status: 200,
        }
      );

    clearApplicantSessionCookie(
      response,
      cookieName
    );

    return response;
  } catch (error) {
    if (
      error instanceof
      ApplicantCrossSiteRequestError
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

    logServerError(
      "Applicant logout failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          LOGOUT_SERVER_ERROR,
      },
      {
        status: 500,
      }
    );
  }
}