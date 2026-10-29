import {
  randomUUID,
} from "node:crypto";

import {
  hash,
} from "bcryptjs";

import {
  createApplicant,
} from "@/lib/applicant-auth/applicant-repository";
import {
  registerApplicantSchema,
} from "@/lib/applicant-auth/applicant-validation";
import {
  buildApplicantVerificationEmail,
  buildApplicantVerificationUrl,
} from "@/lib/applicant-auth/verification-email";
import {
  issueApplicantVerification,
} from "@/lib/applicant-auth/verification-service";
import {
  getAppUrl,
} from "@/lib/config/app-url";
import {
  sendEmail,
} from "@/lib/email/email-service";

const PASSWORD_HASH_ROUNDS =
  12;

export type RegisterApplicantRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type RegisteredApplicant = {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
};

export async function registerApplicant(
  input: RegisterApplicantRequest
): Promise<RegisteredApplicant> {
  const validatedInput =
    registerApplicantSchema.parse(
      input
    );

  const passwordHash =
    await hash(
      validatedInput.password,
      PASSWORD_HASH_ROUNDS
    );

  const applicant =
    await createApplicant({
      publicId:
        randomUUID(),
      firstName:
        validatedInput.firstName,
      lastName:
        validatedInput.lastName,
      email:
        validatedInput.email,
      passwordHash,
    });

  const verification =
    await issueApplicantVerification(
      applicant.id
    );

  const verificationUrl =
    buildApplicantVerificationUrl(
      verification.token,
      getAppUrl()
    );

  const verificationEmail =
    buildApplicantVerificationEmail({
      firstName:
        applicant.firstName,
      verificationUrl,
    });

  await sendEmail({
    to: applicant.email,
    subject:
      verificationEmail.subject,
    text:
      verificationEmail.text,
    html:
      verificationEmail.html,
  });

  return {
    publicId:
      applicant.publicId,
    firstName:
      applicant.firstName,
    lastName:
      applicant.lastName,
    email:
      applicant.email,
    emailVerified:
      applicant.emailVerifiedAt !==
      null,
  };
}