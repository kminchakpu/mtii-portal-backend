import { loadEnvConfig } from "@next/env";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

loadEnvConfig(process.cwd());

interface UserRow extends RowDataPacket {
  id: number;
}

interface StoredSessionRow extends RowDataPacket {
  token_hash: string;
}

async function main() {
  const { db } = await import("../lib/db/pool");
  const {
    createStaffSession,
    findStaffSessionByToken,
    revokeStaffSession,
    revokeAllStaffSessions,
  } = await import("../lib/auth/session-repository");
  const { hashSessionToken } = await import(
    "../lib/auth/session-token"
  );
  const { getSuperAdminConfig } = await import(
    "../lib/auth/super-admin-config"
  );

  const config = getSuperAdminConfig();
  const createdTokens: string[] = [];

  try {
    const [users] = await db.execute<UserRow[]>(
      `
        SELECT id
        FROM users
        WHERE email = ?
          AND is_active = TRUE
        LIMIT 1
      `,
      [config.email]
    );

    const user = users[0];

    if (!user) {
      throw new Error(
        "Active Super Admin account not found."
      );
    }

    /*
     * Verify single-session creation and storage.
     */
    const created = await createStaffSession(
      user.id
    );

    createdTokens.push(created.token);

    const expectedHash = hashSessionToken(
      created.token
    );

    const [storedRows] =
      await db.execute<StoredSessionRow[]>(
        `
          SELECT token_hash
          FROM sessions
          WHERE token_hash = ?
          LIMIT 1
        `,
        [expectedHash]
      );

    const storedSession = storedRows[0];

    if (!storedSession) {
      throw new Error(
        "Created session was not found in MySQL."
      );
    }

    if (
      storedSession.token_hash !== expectedHash
    ) {
      throw new Error(
        "Stored session hash does not match the expected SHA-256 hash."
      );
    }

    if (
      storedSession.token_hash === created.token
    ) {
      throw new Error(
        "Raw session token was stored in MySQL."
      );
    }

    /*
     * Verify valid session authentication.
     */
    const activeSession =
      await findStaffSessionByToken(
        created.token
      );

    if (!activeSession) {
      throw new Error(
        "Valid staff session could not be authenticated."
      );
    }

    if (activeSession.userId !== user.id) {
      throw new Error(
        "Authenticated session belongs to the wrong user."
      );
    }

    /*
     * Verify individual session revocation.
     */
    const revoked = await revokeStaffSession(
      created.token
    );

    if (!revoked) {
      throw new Error(
        "Session could not be revoked."
      );
    }

    const revokedSession =
      await findStaffSessionByToken(
        created.token
      );

    if (revokedSession !== null) {
      throw new Error(
        "Revoked session is still authenticating."
      );
    }

    console.log(
      "Staff session verification successful."
    );
    console.log(
      "Raw token authentication: verified"
    );
    console.log(
      "SHA-256 database storage: verified"
    );
    console.log(
      "Session revocation: verified"
    );

    /*
     * Verify bulk session revocation.
     */
    const firstSession =
      await createStaffSession(user.id);

    const secondSession =
      await createStaffSession(user.id);

    createdTokens.push(
      firstSession.token,
      secondSession.token
    );

    const firstActive =
      await findStaffSessionByToken(
        firstSession.token
      );

    const secondActive =
      await findStaffSessionByToken(
        secondSession.token
      );

    if (!firstActive || !secondActive) {
      throw new Error(
        "Temporary sessions could not be authenticated before bulk revocation."
      );
    }

    const revokedCount =
      await revokeAllStaffSessions(user.id);

    if (revokedCount < 2) {
      throw new Error(
        "Expected at least two staff sessions to be revoked."
      );
    }

    const firstRevokedSession =
      await findStaffSessionByToken(
        firstSession.token
      );

    const secondRevokedSession =
      await findStaffSessionByToken(
        secondSession.token
      );

    if (
      firstRevokedSession !== null ||
      secondRevokedSession !== null
    ) {
      throw new Error(
        "Bulk-revoked sessions are still authenticating."
      );
    }

    console.log(
      "Bulk session revocation: verified"
    );
  } finally {
    /*
     * Remove all temporary verification sessions.
     */
    for (const token of createdTokens) {
      await db.execute<ResultSetHeader>(
        `
          DELETE FROM sessions
          WHERE token_hash = ?
        `,
        [hashSessionToken(token)]
      );
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Staff session verification failed."
  );

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
});