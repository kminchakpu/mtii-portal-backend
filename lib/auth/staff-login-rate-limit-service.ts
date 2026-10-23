import {
  clearStaffLoginRateLimit,
  findStaffLoginRateLimit,
  recordStaffLoginFailure,
} from "./staff-login-rate-limit-repository";

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;
const BLOCK_DURATION_MINUTES = 15;

export type StaffLoginBlockStatus = {
  blocked: boolean;
  retryAfterSeconds: number;
};

function getRetryAfterSeconds(
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

export async function isStaffLoginBlocked(
  key: string
): Promise<StaffLoginBlockStatus> {
  const rateLimit =
    await findStaffLoginRateLimit(
      key
    );

  if (!rateLimit) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
    };
  }

  const now = new Date();

  if (
    rateLimit.blockedUntil &&
    rateLimit.blockedUntil > now
  ) {
    return {
      blocked: true,
      retryAfterSeconds:
        getRetryAfterSeconds(
          rateLimit.blockedUntil,
          now
        ),
    };
  }

  return {
    blocked: false,
    retryAfterSeconds: 0,
  };
}

export async function recordFailedStaffLogin(
  key: string
): Promise<void> {
  await recordStaffLoginFailure(
    key,
    ATTEMPT_WINDOW_MINUTES,
    MAX_FAILED_ATTEMPTS,
    BLOCK_DURATION_MINUTES
  );
}

export async function clearStaffLoginFailures(
  key: string
): Promise<void> {
  await clearStaffLoginRateLimit(
    key
  );
}