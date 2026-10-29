import {
  NextResponse,
} from "next/server";
import {
  ZodError,
} from "zod";

import {
  ApplicantEmailConflictError,
} from "@/lib/applicant-auth/errors";
import {
  registerApplicant,
} from "@/lib/applicant-auth/registration-service";
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
  registerApplicantSchema,
} from "@/lib/applicant-auth/applicant-validation";
import {
  ApplicantCrossSiteRequestError,
  enforceApplicantRequestOrigin,
} from "@/lib/http/applicant-request-security";
import {
  logServerError,
} from "@/lib/security/server-error-logger";

const GENERIC_REGISTRATION_MESSAGE =
  "If the registration can be processed, check your email for a verification link.";

const RATE_LIMIT_ERROR =
  "Too many registration attempts. Please try again later.";

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
      registerApplicantSchema.parse(
        body
      );

    const policy =
      getApplicantAuthRateLimitPolicy(
        "registration"
      );

    const ipRateLimitKey =
      createApplicantAuthIpRateLimitKey(
        request
      );

    const ipRateLimit =
      await checkApplicantAuthRateLimit(
        "registration",
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
        "registration",
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

    await registerApplicant(
      body as {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
      }
    );

    return NextResponse.json(
      {
        message:
          GENERIC_REGISTRATION_MESSAGE,
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
      error instanceof
      ApplicantEmailConflictError
    ) {
      return NextResponse.json(
        {
          message:
            GENERIC_REGISTRATION_MESSAGE,
        },
        {
          status: 202,
        }
      );
    }

    if (
      error instanceof ZodError
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid registration request.",
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
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    logServerError(
      "Applicant registration failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to register at this time.",
      },
      {
        status: 500,
      }
    );
  }
}