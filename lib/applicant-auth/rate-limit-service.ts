import type {
  ApplicantAuthRateLimitAction,
} from "@/lib/applicant-auth/rate-limit-repository";
import {
  findApplicantAuthRateLimit,
  recordApplicantAuthRequest,
} from "@/lib/applicant-auth/rate-limit-repository";

export type ApplicantAuthRateLimitPolicy = {
  windowMinutes: number;
  maxRequests: number;
  blockDurationMinutes: number;
};

export type ApplicantAuthRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function isActiveBlock(
  blockedUntil: Date | null,
  now: Date
): boolean {
  if (!blockedUntil) {
    return false;
  }

  return (
    blockedUntil.getTime() >
    now.getTime()
  );
}

function calculateRetryAfterSeconds(
  blockedUntil: Date,
  now: Date
): number {
  const remainingMilliseconds =
    blockedUntil.getTime() -
    now.getTime();

  if (
    remainingMilliseconds <= 0
  ) {
    return 0;
  }

  return Math.ceil(
    remainingMilliseconds /
      1000
  );
}

export async function checkApplicantAuthRateLimit(
  action:
    ApplicantAuthRateLimitAction,
  key: string,
  policy:
    ApplicantAuthRateLimitPolicy,
  now: Date = new Date()
): Promise<ApplicantAuthRateLimitResult> {
  const existingRateLimit =
    await findApplicantAuthRateLimit(
      action,
      key
    );

  if (
    existingRateLimit &&
    isActiveBlock(
      existingRateLimit.blockedUntil,
      now
    )
  ) {
    return {
      allowed: false,
      retryAfterSeconds:
        calculateRetryAfterSeconds(
          existingRateLimit.blockedUntil!,
          now
        ),
    };
  }

  await recordApplicantAuthRequest(
    action,
    key,
    policy.windowMinutes,
    policy.maxRequests,
    policy.blockDurationMinutes
  );

  const updatedRateLimit =
    await findApplicantAuthRateLimit(
      action,
      key
    );

  if (
    updatedRateLimit &&
    isActiveBlock(
      updatedRateLimit.blockedUntil,
      now
    )
  ) {
    return {
      allowed: false,
      retryAfterSeconds:
        calculateRetryAfterSeconds(
          updatedRateLimit.blockedUntil!,
          now
        ),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}