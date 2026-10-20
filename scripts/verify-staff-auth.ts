import { loadEnvConfig } from "@next/env";
import type {
  ResultSetHeader,
} from "mysql2";

loadEnvConfig(process.cwd());

async function main() {
  const {
    authenticateStaff,
    InvalidStaffCredentialsError,
  } = await import(
    "../lib/auth/staff-auth-service"
  );

  const { hashSessionToken } =
    await import(
      "../lib/auth/session-token"
    );

  const { db } = await import(
    "../lib/db/pool"
  );

  const {
    getSuperAdminConfig,
  } = await import(
    "../lib/auth/super-admin-config"
  );

  const config = getSuperAdminConfig();

  let sessionToken: string | null = null;

  try {
    const result = await authenticateStaff({
      email: config.email.toUpperCase(),
      password: config.password,
    });

    sessionToken = result.session.token;

    if (
      result.user.email !==
      config.email.toLowerCase()
    ) {
      throw new Error(
        "Authenticated staff email was not normalized correctly."
      );
    }

    if (!result.session.token) {
      throw new Error(
        "Authentication did not create a session token."
      );
    }

    let invalidPasswordRejected = false;

    try {
      await authenticateStaff({
        email: config.email,
        password:
          "Definitely-Wrong-Password-For-Verification",
      });
    } catch (error) {
      invalidPasswordRejected =
        error instanceof
        InvalidStaffCredentialsError;
    }

    if (!invalidPasswordRejected) {
      throw new Error(
        "Invalid staff password was not rejected correctly."
      );
    }

    let unknownUserRejected = false;

    try {
      await authenticateStaff({
        email:
          "nonexistent-staff@mtii.invalid",
        password:
          "Definitely-Wrong-Password-For-Verification",
      });
    } catch (error) {
      unknownUserRejected =
        error instanceof
        InvalidStaffCredentialsError;
    }

    if (!unknownUserRejected) {
      throw new Error(
        "Unknown staff account was not rejected correctly."
      );
    }

    console.log(
      "Staff authentication verification successful."
    );
    console.log(
      "Valid credentials: verified"
    );
    console.log(
      "Email normalization: verified"
    );
    console.log(
      "Invalid password rejection: verified"
    );
    console.log(
      "Unknown account rejection: verified"
    );
    console.log(
      "Session creation: verified"
    );
  } finally {
    if (sessionToken) {
      await db.execute<ResultSetHeader>(
        `
          DELETE FROM sessions
          WHERE token_hash = ?
        `,
        [hashSessionToken(sessionToken)]
      );
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Staff authentication verification failed."
  );

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});