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

import {
  consumeApplicantVerification,
  createApplicantVerification,
  findValidApplicantVerificationByTokenHash,
  findValidApplicantVerificationByTokenHashForUpdate,
  invalidateApplicantVerifications,
} from "@/lib/applicant-auth/verification-repository";

const expiresAt = new Date(
  "2026-10-24T12:00:00.000Z"
);

const verificationRow = {
  id: 41,
  applicant_id: 31,
  token_hash:
    "a".repeat(64),
  expires_at: expiresAt,
  consumed_at: null,
  created_at: new Date(
    "2026-10-23T12:00:00.000Z"
  ),
};

describe(
  "applicant email verification repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("stores only the supplied token hash and expiration", async () => {
      execute.mockResolvedValueOnce([
        {
          insertId: 41,
        },
      ]);

      await createApplicantVerification({
        applicantId: 31,
        tokenHash:
          "a".repeat(64),
        expiresAt,
      });

      expect(
        execute
      ).toHaveBeenCalledOnce();

      const insertCall =
        execute.mock.calls[0];

      expect(
        insertCall[0]
      ).toContain(
        "INSERT INTO applicant_email_verifications"
      );

      expect(
        insertCall[1]
      ).toEqual([
        31,
        "a".repeat(64),
        expiresAt,
      ]);
    });

    it("never stores a raw verification token", async () => {
      execute.mockResolvedValueOnce([
        {
          insertId: 41,
        },
      ]);

      const rawToken =
        "raw-secret-verification-token";

      await createApplicantVerification({
        applicantId: 31,
        tokenHash:
          "a".repeat(64),
        expiresAt,
      });

      expect(
        JSON.stringify(
          execute.mock.calls[0]
        )
      ).not.toContain(
        rawToken
      );
    });

    it("returns the created verification id", async () => {
      execute.mockResolvedValueOnce([
        {
          insertId: 41,
        },
      ]);

      const id =
        await createApplicantVerification({
          applicantId: 31,
          tokenHash:
            "a".repeat(64),
          expiresAt,
        });

      expect(id).toBe(41);
    });

    it("finds only an unconsumed and unexpired verification by token hash", async () => {
      execute.mockResolvedValueOnce([
        [verificationRow],
      ]);

      const verification =
        await findValidApplicantVerificationByTokenHash(
          "a".repeat(64)
        );

      const selectCall =
        execute.mock.calls[0];

      expect(
        selectCall[0]
      ).toContain(
        "token_hash = ?"
      );

      expect(
        selectCall[0]
      ).toContain(
        "consumed_at IS NULL"
      );

      expect(
        selectCall[0]
      ).toContain(
        "expires_at > NOW()"
      );

      expect(
        selectCall[1]
      ).toEqual([
        "a".repeat(64),
      ]);

      expect(
        verification
      ).toEqual({
        id: 41,
        applicantId: 31,
        tokenHash:
          "a".repeat(64),
        expiresAt,
        consumedAt: null,
        createdAt:
          verificationRow.created_at,
      });
    });

    it("returns null when no valid verification exists", async () => {
      execute.mockResolvedValueOnce([
        [],
      ]);

      await expect(
        findValidApplicantVerificationByTokenHash(
          "b".repeat(64)
        )
      ).resolves.toBeNull();
    });

    it("locks a valid verification row for update using the supplied transaction executor", async () => {
      const transactionExecute =
        vi.fn()
          .mockResolvedValueOnce([
            [verificationRow],
          ]);

      const executor = {
        execute:
          transactionExecute,
      };

      const verification =
        await findValidApplicantVerificationByTokenHashForUpdate(
          "a".repeat(64),
          executor
        );

      expect(
        transactionExecute
      ).toHaveBeenCalledOnce();

      expect(
        execute
      ).not.toHaveBeenCalled();

      const selectCall =
        transactionExecute.mock.calls[0];

      const sql =
        selectCall[0] as string;

      expect(sql).toContain(
        "token_hash = ?"
      );

      expect(sql).toContain(
        "consumed_at IS NULL"
      );

      expect(sql).toContain(
        "expires_at > NOW()"
      );

      expect(sql).toContain(
        "FOR UPDATE"
      );

      expect(
        selectCall[1]
      ).toEqual([
        "a".repeat(64),
      ]);

      expect(
        verification
      ).toEqual({
        id: 41,
        applicantId: 31,
        tokenHash:
          "a".repeat(64),
        expiresAt,
        consumedAt: null,
        createdAt:
          verificationRow.created_at,
      });
    });

    it("returns null when no valid verification can be locked", async () => {
      const transactionExecute =
        vi.fn()
          .mockResolvedValueOnce([
            [],
          ]);

      const executor = {
        execute:
          transactionExecute,
      };

      await expect(
        findValidApplicantVerificationByTokenHashForUpdate(
          "b".repeat(64),
          executor
        )
      ).resolves.toBeNull();
    });

    it("consumes an unconsumed verification exactly once", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ]);

      const consumed =
        await consumeApplicantVerification(
          41
        );

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE applicant_email_verifications"
        ),
        [41]
      );

      const sql =
        execute.mock.calls[0][0] as string;

      expect(sql).toContain(
        "consumed_at = NOW()"
      );

      expect(sql).toContain(
        "consumed_at IS NULL"
      );

      expect(consumed).toBe(true);
    });

    it("returns false when a verification was already consumed", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 0,
        },
      ]);

      await expect(
        consumeApplicantVerification(
          41
        )
      ).resolves.toBe(false);
    });

    it("invalidates all outstanding verifications for an applicant", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
      ]);

      const invalidated =
        await invalidateApplicantVerifications(
          31
        );

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE applicant_email_verifications"
        ),
        [31]
      );

      const sql =
        execute.mock.calls[0][0] as string;

      expect(sql).toContain(
        "applicant_id = ?"
      );

      expect(sql).toContain(
        "consumed_at IS NULL"
      );

      expect(sql).toContain(
        "consumed_at = NOW()"
      );

      expect(invalidated).toBe(2);
    });

    it("supports a supplied transaction executor", async () => {
      const transactionExecute =
        vi.fn()
          .mockResolvedValueOnce([
            {
              affectedRows: 3,
            },
          ]);

      const executor = {
        execute:
          transactionExecute,
      };

      const invalidated =
        await invalidateApplicantVerifications(
          31,
          executor
        );

      expect(
        transactionExecute
      ).toHaveBeenCalledOnce();

      expect(
        execute
      ).not.toHaveBeenCalled();

      expect(
        invalidated
      ).toBe(3);
    });

    it("propagates database errors", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "Verification database failure"
        )
      );

      await expect(
        invalidateApplicantVerifications(
          31
        )
      ).rejects.toThrow(
        "Verification database failure"
      );
    });
  }
);