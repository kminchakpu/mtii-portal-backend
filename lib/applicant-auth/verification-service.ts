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
  withTransaction,
} from "@/lib/db/transaction";

export type IssuedApplicantVerification = {
  token: string;
  expiresAt: Date;
};

const INVALID_VERIFICATION_MESSAGE =
  "Invalid or expired applicant verification token.";

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
        throw new Error(
          INVALID_VERIFICATION_MESSAGE
        );
      }

      const applicantVerified =
        await markApplicantEmailVerified(
          verification.applicantId,
          connection
        );

      if (!applicantVerified) {
        throw new Error(
          INVALID_VERIFICATION_MESSAGE
        );
      }

      const verificationConsumed =
        await consumeApplicantVerification(
          verification.id,
          connection
        );

      if (!verificationConsumed) {
        throw new Error(
          INVALID_VERIFICATION_MESSAGE
        );
      }
    }
  );
}