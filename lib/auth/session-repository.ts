import { randomUUID } from "node:crypto";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";
import {
  generateSessionToken,
  hashSessionToken,
} from "./session-token";
import {
  getSessionConfig,
  getSessionExpiresAt,
} from "./session-config";

interface SessionRow extends RowDataPacket {
  id: number;
  public_id: string;
  user_id: number;
  expires_at: Date;
  revoked_at: Date | null;
}

type SessionExecutor = Pick<
  PoolConnection,
  "execute"
>;

export type CreatedSession = {
  token: string;
  expiresAt: Date;
};

export type StaffSession = {
  id: number;
  publicId: string;
  userId: number;
  expiresAt: Date;
  revokedAt: Date | null;
};

export async function createStaffSession(
  userId: number
): Promise<CreatedSession> {
  const token =
    generateSessionToken();

  const tokenHash =
    hashSessionToken(token);

  const {
    ttlHours,
  } = getSessionConfig();

  const expiresAt =
    getSessionExpiresAt(
      new Date(),
      ttlHours
    );

  await db.execute<ResultSetHeader>(
    `
      INSERT INTO sessions (
        public_id,
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      randomUUID(),
      userId,
      tokenHash,
      expiresAt,
    ]
  );

  return {
    token,
    expiresAt,
  };
}

export async function findStaffSessionByToken(
  token: string
): Promise<StaffSession | null> {
  const tokenHash =
    hashSessionToken(token);

  const [rows] =
    await db.execute<
      SessionRow[]
    >(
      `
        SELECT
          s.id,
          s.public_id,
          s.user_id,
          s.expires_at,
          s.revoked_at
        FROM sessions s
        INNER JOIN users u
          ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
          AND u.is_active = TRUE
        LIMIT 1
      `,
      [tokenHash]
    );

  const session =
    rows[0];

  if (!session) {
    return null;
  }

  return {
    id:
      session.id,
    publicId:
      session.public_id,
    userId:
      session.user_id,
    expiresAt:
      session.expires_at,
    revokedAt:
      session.revoked_at,
  };
}

export async function revokeStaffSession(
  token: string
): Promise<boolean> {
  const tokenHash =
    hashSessionToken(token);

  const [result] =
    await db.execute<
      ResultSetHeader
    >(
      `
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE token_hash = ?
          AND revoked_at IS NULL
      `,
      [tokenHash]
    );

  return (
    result.affectedRows >
    0
  );
}

export async function revokeAllStaffSessions(
  userId: number,
  executor:
    SessionExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE user_id = ?
          AND revoked_at IS NULL
      `,
      [userId]
    );

  return result.affectedRows;
}

export async function revokeSessionsForDepartment(
  departmentId: number,
  executor:
    SessionExecutor = db
): Promise<number> {
  const [result] =
    await executor.execute<
      ResultSetHeader
    >(
      `
        UPDATE sessions s
        INNER JOIN users u
          ON u.id = s.user_id
        SET s.revoked_at = NOW()
        WHERE u.department_id = ?
          AND s.revoked_at IS NULL
      `,
      [departmentId]
    );

  return result.affectedRows;
}