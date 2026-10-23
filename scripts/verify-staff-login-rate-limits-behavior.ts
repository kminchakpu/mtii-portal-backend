import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const TEST_KEY =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function main() {
  const { db } = await import(
    "../lib/db/pool"
  );

  const {
    clearStaffLoginRateLimit,
    findStaffLoginRateLimit,
    recordStaffLoginFailure,
  } = await import(
    "../lib/auth/staff-login-rate-limit-repository"
  );

  try {
    await clearStaffLoginRateLimit(
      TEST_KEY
    );

    for (
      let attempt = 1;
      attempt <= 4;
      attempt += 1
    ) {
      await recordStaffLoginFailure(
        TEST_KEY,
        15,
        5,
        15
      );

      const rateLimit =
        await findStaffLoginRateLimit(
          TEST_KEY
        );

      if (!rateLimit) {
        throw new Error(
          `Rate-limit record missing after failed attempt ${attempt}.`
        );
      }

      if (
        rateLimit.failedAttempts !==
        attempt
      ) {
        throw new Error(
          `Expected ${attempt} failed attempts, received ${rateLimit.failedAttempts}.`
        );
      }

      if (
        rateLimit.blockedUntil !==
        null
      ) {
        throw new Error(
          `Login was blocked too early after failed attempt ${attempt}.`
        );
      }
    }

    await recordStaffLoginFailure(
      TEST_KEY,
      15,
      5,
      15
    );

    const blockedRateLimit =
      await findStaffLoginRateLimit(
        TEST_KEY
      );

    if (!blockedRateLimit) {
      throw new Error(
        "Rate-limit record missing after fifth failed attempt."
      );
    }

    if (
      blockedRateLimit.failedAttempts !==
      5
    ) {
      throw new Error(
        `Expected 5 failed attempts after threshold, received ${blockedRateLimit.failedAttempts}.`
      );
    }

    if (
      !blockedRateLimit.blockedUntil
    ) {
      throw new Error(
        "Fifth failed attempt did not set blocked_until."
      );
    }

    if (
      blockedRateLimit.blockedUntil <=
      new Date()
    ) {
      throw new Error(
        "blocked_until is not in the future."
      );
    }

    const originalBlockedUntil =
      blockedRateLimit.blockedUntil.getTime();

    await recordStaffLoginFailure(
      TEST_KEY,
      15,
      5,
      15
    );

    const stillBlocked =
      await findStaffLoginRateLimit(
        TEST_KEY
      );

    if (!stillBlocked) {
      throw new Error(
        "Rate-limit record disappeared while blocked."
      );
    }

    if (
      stillBlocked.failedAttempts !==
      5
    ) {
      throw new Error(
        "Failed-attempt counter changed while the login was already blocked."
      );
    }

    if (
      !stillBlocked.blockedUntil ||
      stillBlocked.blockedUntil.getTime() !==
        originalBlockedUntil
    ) {
      throw new Error(
        "Existing block duration changed after another failed attempt."
      );
    }

    await clearStaffLoginRateLimit(
      TEST_KEY
    );

    await db.execute(
      `
        INSERT INTO staff_login_rate_limits (
          rate_limit_key,
          failed_attempts,
          window_started_at,
          blocked_until
        )
        VALUES (
          ?,
          4,
          DATE_SUB(
            NOW(),
            INTERVAL 16 MINUTE
          ),
          NULL
        )
      `,
      [TEST_KEY]
    );

    await recordStaffLoginFailure(
      TEST_KEY,
      15,
      5,
      15
    );

    const resetRateLimit =
      await findStaffLoginRateLimit(
        TEST_KEY
      );

    if (!resetRateLimit) {
      throw new Error(
        "Rate-limit record missing after expired-window reset."
      );
    }

    if (
      resetRateLimit.failedAttempts !==
      1
    ) {
      throw new Error(
        `Expired window did not reset to 1 failed attempt. Received ${resetRateLimit.failedAttempts}.`
      );
    }

    if (
      resetRateLimit.blockedUntil !==
      null
    ) {
      throw new Error(
        "Expired attempt window incorrectly created a block."
      );
    }

    console.log(
      "Staff login rate-limit behavior verification successful."
    );
    console.log(
      "Attempts 1-4: allowed"
    );
    console.log(
      "Attempt 5: block created"
    );
    console.log(
      "Active block preservation: verified"
    );
    console.log(
      "Expired window reset: verified"
    );
  } finally {
    await db.execute(
      `
        DELETE FROM staff_login_rate_limits
        WHERE rate_limit_key = ?
      `,
      [TEST_KEY]
    );

    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Staff login rate-limit behavior verification failed."
  );

  if (error instanceof Error) {
    console.error(
      error.message
    );
  }

  process.exitCode = 1;
});