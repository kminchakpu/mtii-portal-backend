import {
  NextResponse,
} from "next/server";

import {
  ApplicantVerificationError,
} from "@/lib/applicant-auth/errors";
import {
  verifyApplicantEmail,
} from "@/lib/applicant-auth/verification-service";
import {
  logServerError,
} from "@/lib/security/server-error-logger";

const INVALID_VERIFICATION_ERROR =
  "Invalid or expired verification link.";

const VERIFICATION_SUCCESS_MESSAGE =
  "Email verified successfully. You can now sign in.";

const VERIFICATION_SERVER_ERROR =
  "Unable to verify email at this time.";

function invalidVerificationResponse() {
  return NextResponse.json(
    {
      error:
        INVALID_VERIFICATION_ERROR,
    },
    {
      status: 400,
    }
  );
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const token =
      url.searchParams.get(
        "token"
      );

    if (
      !token ||
      !token.trim()
    ) {
      return invalidVerificationResponse();
    }

    await verifyApplicantEmail(
      token
    );

    return NextResponse.json(
      {
        message:
          VERIFICATION_SUCCESS_MESSAGE,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (
      error instanceof
      ApplicantVerificationError
    ) {
      return invalidVerificationResponse();
    }

    logServerError(
      "Applicant email verification failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          VERIFICATION_SERVER_ERROR,
      },
      {
        status: 500,
      }
    );
  }
}