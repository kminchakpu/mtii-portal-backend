import {
  NextResponse,
} from "next/server";

import {
  getCurrentApplicant,
} from "@/lib/applicant-auth/current-applicant";

import {
  logServerError,
} from "@/lib/security/server-error-logger";

const AUTHENTICATION_REQUIRED_ERROR =
  "Authentication required.";

const CURRENT_APPLICANT_SERVER_ERROR =
  "Unable to retrieve the applicant account at this time.";

export async function GET(
  request: Request
) {
  try {
    const applicant =
      await getCurrentApplicant(
        request
      );

    if (!applicant) {
      return NextResponse.json(
        {
          error:
            AUTHENTICATION_REQUIRED_ERROR,
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        applicant: {
          publicId:
            applicant.publicId,
          firstName:
            applicant.firstName,
          lastName:
            applicant.lastName,
          email:
            applicant.email,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    logServerError(
      "Applicant current-user lookup failed.",
      error
    );

    return NextResponse.json(
      {
        error:
          CURRENT_APPLICANT_SERVER_ERROR,
      },
      {
        status: 500,
      }
    );
  }
}