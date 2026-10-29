import {
  NextResponse,
} from "next/server";
import {
  ZodError,
} from "zod";

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
  resendApplicantVerification,
} from "@/lib/applicant-auth/resend-verification-service";
import {
  resendApplicantVerificationSchema,
} from "@/lib/applicant-auth/applicant-validation";
import {
  ApplicantCrossSiteRequestError,
  enforceApplicantRequestOrigin,
} from "@/lib/http/applicant-request-security";
import {
  logServerError,
} from "@/lib/security/server-error-logger";

const GENERIC_RESEND_MESSAGE =
  "If an eligible account exists, check your email for a verification link.";

const RATE_LIMIT_ERROR =
  "Too many verification email requests. Please try again later.";

const INVALID_RESEND_ERROR =
  "Invalid verification resend request.";

const INVALID_BODY_ERROR =
  "Invalid request body.";

const RESEND_SERVER_ERROR =
  "Unable to resend verification email at this time.";

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
      resendApplicantVerificationSchema.parse(
        body
      );

    const policy =
      getApplicantAuthRateLimitPolicy(
        "resend_verification"
      );

    const ipRateLimitKey =
      createApplicantAuthIpRateLimitKey(
        request
      );

    const ipRateLimit =
      await checkApplicantAuthRateLimit(
        "resend_verification",
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
        "resend_verification",
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

    await resendApplicantVerification(
      validatedInput.email
    );

    return NextResponse.json(
      {
        message:
          GENERIC_RESEND_MESSAGE,
      },
      {
        status: 202,
      }
    );
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
      error instanceof ZodError
    ) {
      return NextResponse.json(
        {
          error:
            INVALID_RESEND_ERROR,
        },
        {
          status: 400,
        }
      );
    }

    if (
      error instanceof SyntaxError
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
      "Applicant verification resend failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          RESEND_SERVER_ERROR,
      },
      {
        status: 500,
      }
    );
  }
}