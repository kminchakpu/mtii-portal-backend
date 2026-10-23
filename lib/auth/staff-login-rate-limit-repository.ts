import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  db,
} from "@/lib/db/pool";

interface StaffLoginRateLimitRow
  extends RowDataPacket {
  rate_limit_key: string;
  failed_attempts: number;
  window_started_at: Date;
  blocked_until: Date | null;
}

export type StaffLoginRateLimit = {
  key: string;
  failedAttempts: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
};

export async function findStaffLoginRateLimit(
  key: string
): Promise<StaffLoginRateLimit | null> {
  const [rows] =
    await db.execute<
      StaffLoginRateLimitRow[]
    >(
      `
        SELECT
          rate_limit_key,
          failed_attempts,
          window_started_at,
          blocked_until
        FROM staff_login_rate_limits
        WHERE rate_limit_key = ?
        LIMIT 1
      `,
      [key]
    );

  const rateLimit =
    rows[0];

  if (!rateLimit) {
    return null;
  }

  return {
    key:
      rateLimit.rate_limit_key,
    failedAttempts:
      rateLimit.failed_attempts,
    windowStartedAt:
      rateLimit.window_started_at,
    blockedUntil:
      rateLimit.blocked_until,
  };
}

export async function recordStaffLoginFailure(
  key: string,
  windowMinutes: number,
  maxFailedAttempts: number,
  blockDurationMinutes: number
): Promise<void> {
  await db.execute<ResultSetHeader>(
    `
      INSERT INTO staff_login_rate_limits (
        rate_limit_key,
        failed_attempts,
        window_started_at,
        blocked_until
      )
      VALUES (
        ?,
        1,
        NOW(),
        NULL
      )
      ON DUPLICATE KEY UPDATE
        failed_attempts =
          CASE
            WHEN blocked_until > NOW()
              THEN failed_attempts
            WHEN TIMESTAMPDIFF(
              MINUTE,
              window_started_at,
              NOW()
            ) >= ?
              THEN 1
            ELSE failed_attempts + 1
          END,
        blocked_until =
          CASE
            WHEN blocked_until > NOW()
              THEN blocked_until
            WHEN failed_attempts >= ?
              THEN DATE_ADD(
                NOW(),
                INTERVAL ? MINUTE
              )
            ELSE NULL
          END,
        window_started_at =
          CASE
            WHEN blocked_until > NOW()
              THEN window_started_at
            WHEN TIMESTAMPDIFF(
              MINUTE,
              window_started_at,
              NOW()
            ) >= ?
              THEN NOW()
            ELSE window_started_at
          END,
        updated_at =
          CURRENT_TIMESTAMP
    `,
    [
      key,
      windowMinutes,
      maxFailedAttempts,
      blockDurationMinutes,
      windowMinutes,
    ]
  );
}

export async function clearStaffLoginRateLimit(
  key: string
): Promise<void> {
  await db.execute<ResultSetHeader>(
    `
      DELETE FROM staff_login_rate_limits
      WHERE rate_limit_key = ?
    `,
    [key]
  );
}