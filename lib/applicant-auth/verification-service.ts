import {
  getApplicantVerificationConfig,
  getApplicantVerificationExpiresAt,
} from "@/lib/applicant-auth/verification-config";
import {
  createApplicantVerification,
  invalidateApplicantVerifications,
} from "@/lib/applicant-auth/verification-repository";
import {
  generateApplicantVerificationToken,
  hashApplicantVerificationToken,
} from "@/lib/applicant-auth/verification-token";
import {
  withTransaction,
} from "@/lib/db/transaction";

export type IssuedApplicantVerification = {
  token: string;
  expiresAt: Date;
};

export async function issueApplicantVerification(
  applicantId: number
): Promise<IssuedApplicantVerification> {
  const token =
    generateApplicantVerificationToken();

  const tokenHash =
    hashApplicantVerificationToken(
      token
    );

  const {
    ttlHours,
  } =
    getApplicantVerificationConfig();

  const expiresAt =
    getApplicantVerificationExpiresAt(
      new Date(),
      ttlHours
    );

  await withTransaction(
    async (connection) => {
      await invalidateApplicantVerifications(
        applicantId,
        connection
      );

      await createApplicantVerification(
        {
          applicantId,
          tokenHash,
          expiresAt,
        },
        connection
      );
    }
  );

  return {
    token,
    expiresAt,
  };
}