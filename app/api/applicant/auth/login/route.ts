import {
  NextResponse,
} from "next/server";

import {
  ZodError,
} from "zod";

import {
  applicantLoginSchema,
} from "@/lib/applicant-auth/applicant-validation";

import {
  ApplicantAccountInactiveError,
  ApplicantEmailNotVerifiedError,
  authenticateApplicant,
  InvalidApplicantCredentialsError,
} from "@/lib/applicant-auth/login-service";

import {
  createApplicantAuthEmailRateLimitKey,
  createApplicantAuthIpRateLimitKey,
} from "@/lib/applicant-auth/rate-limit-key";

import {
  getApplicantAuthRateLimitPolicy,
} from "@/lib/applicant-auth/rate-limit-policy";

import {
  checkApplicantAuthRateLimit,
} from "@/lib/applicant-auth/rate-limit-service";

import {
  getApplicantSessionConfig,
} from "@/lib/applicant-auth/applicant-session-config";

import {
  getSessionCookieOptions,
  type AppEnvironment,
} from "@/lib/auth/session-cookie";

import {
  ApplicantCrossSiteRequestError,
  enforceApplicantRequestOrigin,
} from "@/lib/http/applicant-request-security";

import {
  logServerError,
} from "@/lib/security/server-error-logger";

const RATE_LIMIT_ERROR =
  "Too many login attempts. Please try again later.";

const INVALID_CREDENTIALS_ERROR =
  "Invalid email or password.";

const INVALID_LOGIN_ERROR =
  "Invalid login request.";

const INVALID_BODY_ERROR =
  "Invalid request body.";

const LOGIN_SERVER_ERROR =
  "Unable to sign in at this time.";

function getAppEnvironment(): AppEnvironment {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    return "development";
  }

  if (
    process.env.NODE_ENV ===
    "test"
  ) {
    return "test";
  }

  return "production";
}

function rateLimitedResponse(
  retryAfterSeconds: number
) {
  return NextResponse.json(
    {
      error:
        RATE_LIMIT_ERROR,
    },
    {
      status: 429,
      headers: {
        "Retry-After":
          String(
            retryAfterSeconds
          ),
      },
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

    const body: unknown =
      await request.json();

    const validatedInput =
      applicantLoginSchema.parse(
        body
      );

    const policy =
      getApplicantAuthRateLimitPolicy(
        "login"
      );

    const ipRateLimitKey =
      createApplicantAuthIpRateLimitKey(
        request
      );

    const ipRateLimit =
      await checkApplicantAuthRateLimit(
        "login",
        ipRateLimitKey,
        policy
      );

    if (
      !ipRateLimit.allowed
    ) {
      return rateLimitedResponse(
        ipRateLimit.retryAfterSeconds
      );
    }

    const emailRateLimitKey =
      createApplicantAuthEmailRateLimitKey(
        validatedInput.email
      );

    const emailRateLimit =
      await checkApplicantAuthRateLimit(
        "login",
        emailRateLimitKey,
        policy
      );

    if (
      !emailRateLimit.allowed
    ) {
      return rateLimitedResponse(
        emailRateLimit.retryAfterSeconds
      );
    }

    const result =
      await authenticateApplicant(
        validatedInput
      );

    const response =
      NextResponse.json(
        {
          applicant: {
            publicId:
              result.applicant.publicId,
            firstName:
              result.applicant.firstName,
            lastName:
              result.applicant.lastName,
            email:
              result.applicant.email,
          },
        },
        {
          status: 200,
        }
      );

    const {
      cookieName,
    } =
      getApplicantSessionConfig();

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

    if (
      error instanceof
      InvalidApplicantCredentialsError
    ) {
      return NextResponse.json(
        {
          error:
            INVALID_CREDENTIALS_ERROR,
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof
      ApplicantEmailNotVerifiedError
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
      ApplicantAccountInactiveError
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
      ZodError
    ) {
      return NextResponse.json(
        {
          error:
            INVALID_LOGIN_ERROR,
        },
        {
          status: 400,
        }
      );
    }

    if (
      error instanceof
      SyntaxError
    ) {
      return NextResponse.json(
        {
          error:
            INVALID_BODY_ERROR,
        },
        {
          status: 400,
        }
      );
    }

    logServerError(
      "Applicant login failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          LOGIN_SERVER_ERROR,
      },
      {
        status: 500,
      }
    );
  }
}