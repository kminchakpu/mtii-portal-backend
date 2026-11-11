import {
  getCurrentApplicant,
} from "@/lib/applicant-auth/current-applicant";

import type {
  CurrentApplicant,
} from "@/lib/applicant-auth/current-applicant";

export class ApplicantUnauthenticatedError
  extends Error {
  constructor() {
    super(
      "Applicant authentication required."
    );

    this.name =
      "ApplicantUnauthenticatedError";
  }
}

export async function requireCurrentApplicant(
  request: Request
): Promise<CurrentApplicant> {
  const applicant =
    await getCurrentApplicant(
      request
    );

  if (!applicant) {
    throw new ApplicantUnauthenticatedError();
  }

  return applicant;
}