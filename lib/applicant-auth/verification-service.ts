import {
  markApplicantEmailVerified,
} from "@/lib/applicant-auth/applicant-repository";
import {
  getApplicantVerificationConfig,
  getApplicantVerificationExpiresAt,
} from "@/lib/applicant-auth/verification-config";
import {
  consumeApplicantVerification,
  createApplicantVerification,
  findValidApplicantVerificationByTokenHashForUpdate,
  invalidateApplicantVerifications,
} from "@/lib/applicant-auth/verification-repository";
import {
  generateApplicantVerificationToken,
  hashApplicantVerificationToken,
} from "@/lib/applicant-auth/verification-token";
import {
  ApplicantVerificationError,
} from "@/lib/applicant-auth/errors";
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

export async function verifyApplicantEmail(
  token: string
): Promise<void> {
  const tokenHash =
    hashApplicantVerificationToken(
      token
    );

  await withTransaction(
    async (connection) => {
      const verification =
        await findValidApplicantVerificationByTokenHashForUpdate(
          tokenHash,
          connection
        );

      if (!verification) {
        throw new ApplicantVerificationError();
      }

      const applicantVerified =
        await markApplicantEmailVerified(
          verification.applicantId,
          connection
        );

      if (!applicantVerified) {
        throw new ApplicantVerificationError();
      }

      const verificationConsumed =
        await consumeApplicantVerification(
          verification.id,
          connection
        );

      if (!verificationConsumed) {
        throw new ApplicantVerificationError();
      }
    }
  );
}