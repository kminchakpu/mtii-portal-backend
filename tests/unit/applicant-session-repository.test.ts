import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  execute,
} = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute,
    },
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-token",
  () => ({
    generateApplicantSessionToken:
      vi.fn(
        () =>
          "raw-applicant-session-token"
      ),
    hashApplicantSessionToken:
      vi.fn(
        (token: string) =>
          `hashed:${token}`
      ),
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-config",
  () => ({
    getApplicantSessionConfig:
      vi.fn(() => ({
        cookieName:
          "mtii_applicant_session",
        ttlDays: 7,
      })),
    getApplicantSessionExpiresAt:
      vi.fn(
        (
          now: Date,
          ttlDays: number
        ) =>
          new Date(
            now.getTime() +
              ttlDays *
                24 *
                60 *
                60 *
                1000
          )
      ),
  })
);

import {
  createApplicantSession,
  findApplicantSessionByToken,
  revokeAllApplicantSessions,
  revokeApplicantSession,
} from "@/lib/applicant-auth/applicant-session-repository";

describe(
  "applicant session repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it(
      "creates an applicant session using only the hashed token in the database",
      async () => {
        execute.mockResolvedValueOnce([
          {
            affectedRows: 1,
            insertId: 10,
          },
        ]);

        const created =
          await createApplicantSession(
            42
          );

        expect(
          created.token
        ).toBe(
          "raw-applicant-session-token"
        );

        expect(
          created.expiresAt
        ).toBeInstanceOf(Date);

        expect(
          execute
        ).toHaveBeenCalledOnce();

        const [
          sql,
          parameters,
        ] =
          execute.mock.calls[0];

        expect(
          sql
        ).toContain(
          "INSERT INTO applicant_sessions"
        );

        expect(
          sql
        ).toContain(
          "applicant_id"
        );

        expect(
          sql
        ).toContain(
          "token_hash"
        );

        expect(
          sql
        ).toContain(
          "expires_at"
        );

        expect(
          parameters
        ).toEqual([
          42,
          "hashed:raw-applicant-session-token",
          expect.any(Date),
        ]);

        expect(
          parameters
        ).not.toContain(
          "raw-applicant-session-token"
        );
      }
    );

    it(
      "finds a valid applicant session using the hashed token",
      async () => {
        const expiresAt =
          new Date(
            "2026-11-05T12:00:00.000Z"
          );

        execute.mockResolvedValueOnce([
          [
            {
              id: 15,
              applicant_id: 42,
              expires_at:
                expiresAt,
              revoked_at: null,
            },
          ],
        ]);

        const session =
          await findApplicantSessionByToken(
            "raw-token"
          );

        expect(
          execute
        ).toHaveBeenCalledOnce();

        const [
          sql,
          parameters,
        ] =
          execute.mock.calls[0];

        expect(
          sql
        ).toContain(
          "FROM applicant_sessions"
        );

        expect(
          sql
        ).toContain(
          "INNER JOIN applicants"
        );

        expect(
          sql
        ).toContain(
          "a.id = s.applicant_id"
        );

        expect(
          sql
        ).toContain(
          "s.token_hash = ?"
        );

        expect(
          sql
        ).toContain(
          "s.revoked_at IS NULL"
        );

        expect(
          sql
        ).toContain(
          "s.expires_at > NOW()"
        );

        expect(
          sql
        ).toContain(
          "a.is_active = TRUE"
        );

        expect(
          sql
        ).toContain(
          "a.email_verified_at IS NOT NULL"
        );

        expect(
          parameters
        ).toEqual([
          "hashed:raw-token",
        ]);

        expect(
          session
        ).toEqual({
          id: 15,
          applicantId: 42,
          expiresAt,
          revokedAt: null,
        });
      }
    );

    it(
      "returns null when no valid applicant session exists",
      async () => {
        execute.mockResolvedValueOnce([
          [],
        ]);

        const session =
          await findApplicantSessionByToken(
            "missing-token"
          );

        expect(
          session
        ).toBeNull();
      }
    );

    it(
      "never authenticates through the staff sessions or users tables",
      async () => {
        execute.mockResolvedValueOnce([
          [],
        ]);

        await findApplicantSessionByToken(
          "applicant-token"
        );

        const sql =
          execute.mock.calls[0][0] as string;

        expect(
          sql
        ).toContain(
          "applicant_sessions"
        );

        expect(
          sql
        ).toContain(
          "applicants"
        );

        expect(
          sql
        ).not.toMatch(
          /\bFROM\s+sessions\b/i
        );

        expect(
          sql
        ).not.toMatch(
          /\bJOIN\s+users\b/i
        );
      }
    );

    it(
      "revokes one applicant session using its hashed token",
      async () => {
        execute.mockResolvedValueOnce([
          {
            affectedRows: 1,
          },
        ]);

        const revoked =
          await revokeApplicantSession(
            "raw-token"
          );

        expect(
          revoked
        ).toBe(true);

        expect(
          execute
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE applicant_sessions"
          ),
          [
            "hashed:raw-token",
          ]
        );

        const sql =
          execute.mock.calls[0][0] as string;

        expect(
          sql
        ).toContain(
          "SET revoked_at = NOW()"
        );

        expect(
          sql
        ).toContain(
          "token_hash = ?"
        );

        expect(
          sql
        ).toContain(
          "revoked_at IS NULL"
        );
      }
    );

    it(
      "returns false when an applicant session was not revoked",
      async () => {
        execute.mockResolvedValueOnce([
          {
            affectedRows: 0,
          },
        ]);

        const revoked =
          await revokeApplicantSession(
            "missing-token"
          );

        expect(
          revoked
        ).toBe(false);
      }
    );

    it(
      "revokes all active sessions belonging to an applicant",
      async () => {
        execute.mockResolvedValueOnce([
          {
            affectedRows: 3,
          },
        ]);

        const revokedCount =
          await revokeAllApplicantSessions(
            42
          );

        expect(
          revokedCount
        ).toBe(3);

        expect(
          execute
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE applicant_sessions"
          ),
          [42]
        );

        const sql =
          execute.mock.calls[0][0] as string;

        expect(
          sql
        ).toContain(
          "applicant_id = ?"
        );

        expect(
          sql
        ).toContain(
          "revoked_at IS NULL"
        );
      }
    );

    it(
      "supports a supplied transaction executor when revoking all applicant sessions",
      async () => {
        const transactionExecute =
          vi.fn()
            .mockResolvedValueOnce([
              {
                affectedRows: 2,
              },
            ]);

        const transactionConnection = {
          execute:
            transactionExecute,
        };

        const revokedCount =
          await revokeAllApplicantSessions(
            42,
            transactionConnection
          );

        expect(
          transactionExecute
        ).toHaveBeenCalledOnce();

        expect(
          transactionExecute
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE applicant_sessions"
          ),
          [42]
        );

        expect(
          execute
        ).not.toHaveBeenCalled();

        expect(
          revokedCount
        ).toBe(2);
      }
    );

    it(
      "propagates database errors",
      async () => {
        execute.mockRejectedValueOnce(
          new Error(
            "Applicant session database failed"
          )
        );

        await expect(
          revokeAllApplicantSessions(
            42
          )
        ).rejects.toThrow(
          "Applicant session database failed"
        );
      }
    );
  }
);