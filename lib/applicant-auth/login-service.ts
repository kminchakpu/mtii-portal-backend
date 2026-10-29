import {
  findApplicantByEmail,
} from "@/lib/applicant-auth/applicant-repository";

import {
  createApplicantSession,
} from "@/lib/applicant-auth/applicant-session-repository";

import {
  applicantLoginSchema,
} from "@/lib/applicant-auth/applicant-validation";

import {
  verifyPassword,
} from "@/lib/auth/password";

export class InvalidApplicantCredentialsError extends Error {
  constructor() {
    super(
      "Invalid email or password."
    );

    this.name =
      "InvalidApplicantCredentialsError";
  }
}

export class ApplicantAccountInactiveError extends Error {
  constructor() {
    super(
      "This applicant account is inactive."
    );

    this.name =
      "ApplicantAccountInactiveError";
  }
}

export class ApplicantEmailNotVerifiedError extends Error {
  constructor() {
    super(
      "Please verify your email address before signing in."
    );

    this.name =
      "ApplicantEmailNotVerifiedError";
  }
}

export type AuthenticatedApplicant = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type ApplicantAuthenticationResult = {
  applicant: AuthenticatedApplicant;
  session: {
    token: string;
    expiresAt: Date;
  };
};

export async function authenticateApplicant(
  input: unknown
): Promise<ApplicantAuthenticationResult> {
  const credentials =
    applicantLoginSchema.parse(
      input
    );

  const applicant =
    await findApplicantByEmail(
      credentials.email
    );

  if (!applicant) {
    throw new InvalidApplicantCredentialsError();
  }

  const passwordIsValid =
    await verifyPassword(
      credentials.password,
      applicant.passwordHash
    );

  if (!passwordIsValid) {
    throw new InvalidApplicantCredentialsError();
  }

  if (!applicant.isActive) {
    throw new ApplicantAccountInactiveError();
  }

  if (
    applicant.emailVerifiedAt ===
    null
  ) {
    throw new ApplicantEmailNotVerifiedError();
  }

  const session =
    await createApplicantSession(
      applicant.id
    );

  return {
    applicant: {
      id:
        applicant.id,
      publicId:
        applicant.publicId,
      firstName:
        applicant.firstName,
      lastName:
        applicant.lastName,
      email:
        applicant.email,
    },
    session,
  };
}