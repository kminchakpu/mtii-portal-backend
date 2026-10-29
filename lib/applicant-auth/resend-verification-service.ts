import {
  findApplicantByEmail,
} from "@/lib/applicant-auth/applicant-repository";
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

function normalizeApplicantEmail(
  email: string
): string {
  return email
    .trim()
    .toLowerCase();
}

export async function resendApplicantVerification(
  email: string
): Promise<void> {
  const normalizedEmail =
    normalizeApplicantEmail(
      email
    );

  const applicant =
    await findApplicantByEmail(
      normalizedEmail
    );

  if (!applicant) {
    return;
  }

  if (
    applicant.emailVerifiedAt !==
    null
  ) {
    return;
  }

  if (!applicant.isActive) {
    return;
  }

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
    to:
      applicant.email,
    subject:
      verificationEmail.subject,
    text:
      verificationEmail.text,
    html:
      verificationEmail.html,
  });
}