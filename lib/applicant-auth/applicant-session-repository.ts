import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import {
  db,
} from "@/lib/db/pool";

import {
  generateApplicantSessionToken,
  hashApplicantSessionToken,
} from "@/lib/applicant-auth/applicant-session-token";

import {
  getApplicantSessionConfig,
  getApplicantSessionExpiresAt,
} from "@/lib/applicant-auth/applicant-session-config";

interface ApplicantSessionRow
  extends RowDataPacket {
  id: number;
  applicant_id: number;
  expires_at: Date;
  revoked_at: Date | null;
}

type ApplicantSessionExecutor = Pick<
  PoolConnection,
  "execute"
>;

export type CreatedApplicantSession = {
  token: string;
  expiresAt: Date;
};

export type ApplicantSession = {
  id: number;
  applicantId: number;
  expiresAt: Date;
  revokedAt: Date | null;
};

export async function createApplicantSession(
  applicantId: number,
  executor:
    ApplicantSessionExecutor = db
): Promise<CreatedApplicantSession> {
  const token =
    generateApplicantSessionToken();

  const tokenHash =
    hashApplicantSessionToken(
      token
    );

  const {
    ttlDays,
  } = getApplicantSessionConfig();

  const expiresAt =
    getApplicantSessionExpiresAt(
      new Date(),
      ttlDays
    );

  await executor.execute<
    ResultSetHeader
  >(
    `
      INSERT INTO applicant_sessions (
        applicant_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?)
    `,
    [
      applicantId,
      tokenHash,
      expiresAt,
    ]
  );

  return {
    token,
    expiresAt,
  };
}

export async function findApplicantSessionByToken(
  token: string,
  executor:
    ApplicantSessionExecutor = db
): Promise<ApplicantSession | null> {
  const tokenHash =
    hashApplicantSessionToken(
      token
    );

  const [
    rows,
  ] = await executor.execute<
    ApplicantSessionRow[]
  >(
    `
      SELECT
        s.id,
        s.applicant_id,
        s.expires_at,
        s.revoked_at
      FROM applicant_sessions s
      INNER JOIN applicants a
        ON a.id = s.applicant_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND a.is_active = TRUE
        AND a.email_verified_at IS NOT NULL
      LIMIT 1
    `,
    [
      tokenHash,
    ]
  );

  const session =
    rows[0];

  if (!session) {
    return null;
  }

  return {
    id:
      session.id,
    applicantId:
      session.applicant_id,
    expiresAt:
      session.expires_at,
    revokedAt:
      session.revoked_at,
  };
}

export async function revokeApplicantSession(
  token: string,
  executor:
    ApplicantSessionExecutor = db
): Promise<boolean> {
  const tokenHash =
    hashApplicantSessionToken(
      token
    );

  const [
    result,
  ] = await executor.execute<
    ResultSetHeader
  >(
    `
      UPDATE applicant_sessions
      SET revoked_at = NOW()
      WHERE token_hash = ?
        AND revoked_at IS NULL
    `,
    [
      tokenHash,
    ]
  );

  return (
    result.affectedRows > 0
  );
}

export async function revokeAllApplicantSessions(
  applicantId: number,
  executor:
    ApplicantSessionExecutor = db
): Promise<number> {
  const [
    result,
  ] = await executor.execute<
    ResultSetHeader
  >(
    `
      UPDATE applicant_sessions
      SET revoked_at = NOW()
      WHERE applicant_id = ?
        AND revoked_at IS NULL
    `,
    [
      applicantId,
    ]
  );

  return result.affectedRows;
}