import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import {
  db,
} from "@/lib/db/pool";

export type ApplicantAuthRateLimitAction =
  | "registration"
  | "resend_verification";

interface ApplicantAuthRateLimitRow
  extends RowDataPacket {
  rate_limit_key: string;
  action:
    ApplicantAuthRateLimitAction;
  request_count: number;
  window_started_at: Date;
  blocked_until: Date | null;
}

export type ApplicantAuthRateLimit = {
  key: string;
  action:
    ApplicantAuthRateLimitAction;
  requestCount: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
};

export async function findApplicantAuthRateLimit(
  action:
    ApplicantAuthRateLimitAction,
  key: string
): Promise<ApplicantAuthRateLimit | null> {
  const [rows] =
    await db.execute<
      ApplicantAuthRateLimitRow[]
    >(
      `
        SELECT
          rate_limit_key,
          action,
          request_count,
          window_started_at,
          blocked_until
        FROM applicant_auth_rate_limits
        WHERE action = ?
          AND rate_limit_key = ?
        LIMIT 1
      `,
      [
        action,
        key,
      ]
    );

  const rateLimit =
    rows[0];

  if (!rateLimit) {
    return null;
  }

  return {
    key:
      rateLimit.rate_limit_key,
    action:
      rateLimit.action,
    requestCount:
      rateLimit.request_count,
    windowStartedAt:
      rateLimit.window_started_at,
    blockedUntil:
      rateLimit.blocked_until,
  };
}

export async function recordApplicantAuthRequest(
  action:
    ApplicantAuthRateLimitAction,
  key: string,
  windowMinutes: number,
  maxRequests: number,
  blockDurationMinutes: number
): Promise<void> {
  await db.execute<ResultSetHeader>(
    `
      INSERT INTO applicant_auth_rate_limits (
        rate_limit_key,
        action,
        request_count,
        window_started_at,
        blocked_until
      )
      VALUES (
        ?,
        ?,
        1,
        NOW(),
        NULL
      )
      ON DUPLICATE KEY UPDATE
        request_count =
          CASE
            WHEN blocked_until > NOW()
              THEN request_count
            WHEN TIMESTAMPDIFF(
              MINUTE,
              window_started_at,
              NOW()
            ) >= ?
              THEN 1
            ELSE request_count + 1
          END,
        blocked_until =
          CASE
            WHEN blocked_until > NOW()
              THEN blocked_until
            WHEN request_count > ?
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
      action,
      windowMinutes,
      maxRequests,
      blockDurationMinutes,
      windowMinutes,
    ]
  );
}

export async function clearApplicantAuthRateLimit(
  action:
    ApplicantAuthRateLimitAction,
  key: string
): Promise<void> {
  await db.execute<ResultSetHeader>(
    `
      DELETE FROM applicant_auth_rate_limits
      WHERE action = ?
        AND rate_limit_key = ?
    `,
    [
      action,
      key,
    ]
  );
}