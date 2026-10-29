import {
  loadEnvConfig,
} from "@next/env";

loadEnvConfig(
  process.cwd()
);

const REGISTRATION_TEST_KEY =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const RESEND_TEST_KEY =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

async function verifyThreshold(
  action:
    | "registration"
    | "resend_verification",
  key: string,
  windowMinutes: number,
  maxRequests: number,
  blockDurationMinutes: number
) {
  const {
    clearApplicantAuthRateLimit,
    findApplicantAuthRateLimit,
    recordApplicantAuthRequest,
  } = await import(
    "../lib/applicant-auth/rate-limit-repository"
  );

  await clearApplicantAuthRateLimit(
    action,
    key
  );

  for (
    let requestNumber = 1;
    requestNumber <=
    maxRequests;
    requestNumber += 1
  ) {
    await recordApplicantAuthRequest(
      action,
      key,
      windowMinutes,
      maxRequests,
      blockDurationMinutes
    );

    const rateLimit =
      await findApplicantAuthRateLimit(
        action,
        key
      );

    if (!rateLimit) {
      throw new Error(
        `${action}: rate-limit record missing after request ${requestNumber}.`
      );
    }

    if (
      rateLimit.requestCount !==
      requestNumber
    ) {
      throw new Error(
        `${action}: expected request count ${requestNumber}, received ${rateLimit.requestCount}.`
      );
    }

    if (
      rateLimit.blockedUntil !==
      null
    ) {
      throw new Error(
        `${action}: request ${requestNumber} was blocked before exceeding the configured maximum of ${maxRequests}.`
      );
    }
  }

  await recordApplicantAuthRequest(
    action,
    key,
    windowMinutes,
    maxRequests,
    blockDurationMinutes
  );

  const blockedRateLimit =
    await findApplicantAuthRateLimit(
      action,
      key
    );

  if (!blockedRateLimit) {
    throw new Error(
      `${action}: rate-limit record missing after request ${maxRequests + 1}.`
    );
  }

  if (
    blockedRateLimit.requestCount !==
    maxRequests + 1
  ) {
    throw new Error(
      `${action}: expected request count ${maxRequests + 1} when the block was created, received ${blockedRateLimit.requestCount}.`
    );
  }

  if (
    !blockedRateLimit.blockedUntil
  ) {
    throw new Error(
      `${action}: request ${maxRequests + 1} did not create a block.`
    );
  }

  if (
    blockedRateLimit.blockedUntil <=
    new Date()
  ) {
    throw new Error(
      `${action}: blocked_until is not in the future.`
    );
  }

  const originalBlockedUntil =
    blockedRateLimit.blockedUntil
      .getTime();

  await recordApplicantAuthRequest(
    action,
    key,
    windowMinutes,
    maxRequests,
    blockDurationMinutes
  );

  const stillBlocked =
    await findApplicantAuthRateLimit(
      action,
      key
    );

  if (!stillBlocked) {
    throw new Error(
      `${action}: rate-limit record disappeared while blocked.`
    );
  }

  if (
    stillBlocked.requestCount !==
    maxRequests + 1
  ) {
    throw new Error(
      `${action}: request counter changed while an active block already existed.`
    );
  }

  if (
    !stillBlocked.blockedUntil ||
    stillBlocked.blockedUntil
      .getTime() !==
      originalBlockedUntil
  ) {
    throw new Error(
      `${action}: existing block duration changed after another request.`
    );
  }
}

async function verifyExpiredWindowReset() {
  const {
    db,
  } = await import(
    "../lib/db/pool"
  );

  const {
    clearApplicantAuthRateLimit,
    findApplicantAuthRateLimit,
    recordApplicantAuthRequest,
  } = await import(
    "../lib/applicant-auth/rate-limit-repository"
  );

  await clearApplicantAuthRateLimit(
    "registration",
    REGISTRATION_TEST_KEY
  );

  await db.execute(
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
        5,
        DATE_SUB(
          NOW(),
          INTERVAL 16 MINUTE
        ),
        NULL
      )
    `,
    [
      REGISTRATION_TEST_KEY,
      "registration",
    ]
  );

  await recordApplicantAuthRequest(
    "registration",
    REGISTRATION_TEST_KEY,
    15,
    5,
    15
  );

  const resetRateLimit =
    await findApplicantAuthRateLimit(
      "registration",
      REGISTRATION_TEST_KEY
    );

  if (!resetRateLimit) {
    throw new Error(
      "registration: rate-limit record missing after expired-window reset."
    );
  }

  if (
    resetRateLimit.requestCount !==
    1
  ) {
    throw new Error(
      `registration: expired window did not reset to request count 1. Received ${resetRateLimit.requestCount}.`
    );
  }

  if (
    resetRateLimit.blockedUntil !==
    null
  ) {
    throw new Error(
      "registration: expired request window incorrectly created a block."
    );
  }
}

async function main() {
  const {
    db,
  } = await import(
    "../lib/db/pool"
  );

  try {
    await verifyThreshold(
      "registration",
      REGISTRATION_TEST_KEY,
      15,
      5,
      15
    );

    await verifyThreshold(
      "resend_verification",
      RESEND_TEST_KEY,
      30,
      3,
      30
    );

    await verifyExpiredWindowReset();

    console.log(
      "Applicant auth rate-limit behavior verification successful."
    );

    console.log(
      "Registration requests 1-5: allowed"
    );

    console.log(
      "Registration request 6: block created"
    );

    console.log(
      "Resend verification requests 1-3: allowed"
    );

    console.log(
      "Resend verification request 4: block created"
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
        DELETE FROM applicant_auth_rate_limits
        WHERE (
          action = ?
          AND rate_limit_key = ?
        )
        OR (
          action = ?
          AND rate_limit_key = ?
        )
      `,
      [
        "registration",
        REGISTRATION_TEST_KEY,
        "resend_verification",
        RESEND_TEST_KEY,
      ]
    );

    await db.end();
  }
}

main().catch(
  (error) => {
    console.error(
      "Applicant auth rate-limit behavior verification failed."
    );

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      );
    }

    process.exitCode = 1;
  }
);