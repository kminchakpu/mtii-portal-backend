import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  db,
} from "@/lib/db/pool";

interface ApplicantVerificationRow
  extends RowDataPacket {
  id: number;
  applicant_id: number;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
}

type VerificationExecutor = Pick<
  PoolConnection,
  "execute"
>;

export type ApplicantVerification = {
  id: number;
  applicantId: number;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export type CreateApplicantVerificationRecord = {
  applicantId: number;
  tokenHash: string;
  expiresAt: Date;
};

function mapApplicantVerification(
  row: ApplicantVerificationRow
): ApplicantVerification {
  return {
    id: row.id,
    applicantId:
      row.applicant_id,
    tokenHash:
      row.token_hash,
    expiresAt:
      row.expires_at,
    consumedAt:
      row.consumed_at,
    createdAt:
      row.created_at,
  };
}

export async function createApplicantVerification(
  input: CreateApplicantVerificationRecord,
  executor:
    VerificationExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        INSERT INTO applicant_email_verifications (
          applicant_id,
          token_hash,
          expires_at
        )
        VALUES (?, ?, ?)
      `,
      [
        input.applicantId,
        input.tokenHash,
        input.expiresAt,
      ]
    );

  return result.insertId;
}

export async function findValidApplicantVerificationByTokenHash(
  tokenHash: string,
  executor:
    VerificationExecutor = db
): Promise<ApplicantVerification | null> {
  const [rows] =
    await executor.execute<
      ApplicantVerificationRow[]
    >(
      `
        SELECT
          id,
          applicant_id,
          token_hash,
          expires_at,
          consumed_at,
          created_at
        FROM applicant_email_verifications
        WHERE token_hash = ?
          AND consumed_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      [tokenHash]
    );

  const verification =
    rows[0];

  if (!verification) {
    return null;
  }

  return mapApplicantVerification(
    verification
  );
}

export async function consumeApplicantVerification(
  verificationId: number,
  executor:
    VerificationExecutor = db
): Promise<boolean> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE applicant_email_verifications
        SET consumed_at = NOW()
        WHERE id = ?
          AND consumed_at IS NULL
      `,
      [verificationId]
    );

  return (
    result.affectedRows > 0
  );
}

export async function invalidateApplicantVerifications(
  applicantId: number,
  executor:
    VerificationExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE applicant_email_verifications
        SET consumed_at = NOW()
        WHERE applicant_id = ?
          AND consumed_at IS NULL
      `,
      [applicantId]
    );

  return result.affectedRows;
}