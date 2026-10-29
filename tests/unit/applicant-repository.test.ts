import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ApplicantEmailConflictError,
} from "@/lib/applicant-auth/errors";

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
  createApplicant,
  findApplicantByEmail,
  markApplicantEmailVerified,
} from "@/lib/applicant-auth/applicant-repository";

const input = {
  publicId:
    "44444444-4444-4444-8444-444444444444",
  firstName: "Amina",
  lastName: "Ibrahim",
  email: "amina@example.com",
  passwordHash:
    "$2b$12$hashed-password",
};

const createdApplicantRow = {
  id: 31,
  public_id:
    "44444444-4444-4444-8444-444444444444",
  first_name: "Amina",
  last_name: "Ibrahim",
  email: "amina@example.com",
  password_hash:
    "$2b$12$hashed-password",
  email_verified_at: null,
  is_active: 1,
  created_at: new Date(
    "2026-10-23T10:00:00.000Z"
  ),
  updated_at: new Date(
    "2026-10-23T10:00:00.000Z"
  ),
};

describe(
  "applicant repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("creates an applicant with a public UUID and password hash", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 31,
          },
        ])
        .mockResolvedValueOnce([
          [createdApplicantRow],
        ]);

      const applicant =
        await createApplicant(input);

      expect(
        execute
      ).toHaveBeenCalledTimes(2);

      const insertCall =
        execute.mock.calls[0];

      expect(
        insertCall[0]
      ).toContain(
        "INSERT INTO applicants"
      );

      expect(
        insertCall[1]
      ).toEqual([
        "44444444-4444-4444-8444-444444444444",
        "Amina",
        "Ibrahim",
        "amina@example.com",
        "$2b$12$hashed-password",
      ]);

      expect(applicant).toEqual({
        id: 31,
        publicId:
          "44444444-4444-4444-8444-444444444444",
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        passwordHash:
          "$2b$12$hashed-password",
        emailVerifiedAt: null,
        isActive: true,
        createdAt:
          createdApplicantRow.created_at,
        updatedAt:
          createdApplicantRow.updated_at,
      });
    });

    it("never sends a plaintext password to the database", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 31,
          },
        ])
        .mockResolvedValueOnce([
          [createdApplicantRow],
        ]);

      await createApplicant(input);

      const insertValues =
        execute.mock.calls[0][1];

      expect(
        insertValues
      ).toContain(
        "$2b$12$hashed-password"
      );

      expect(
        JSON.stringify(
          insertValues
        )
      ).not.toContain(
        "StrongPassword123!"
      );
    });

    it("starts a new applicant unverified and active from database defaults", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 31,
          },
        ])
        .mockResolvedValueOnce([
          [createdApplicantRow],
        ]);

      const applicant =
        await createApplicant(input);

      expect(
        applicant.emailVerifiedAt
      ).toBeNull();

      expect(
        applicant.isActive
      ).toBe(true);

      const insertSql =
        execute.mock.calls[0][0];

      expect(
        insertSql
      ).not.toContain(
        "email_verified_at"
      );

      expect(
        insertSql
      ).not.toContain(
        "is_active"
      );
    });

    it("supports a supplied transaction executor for insert and reload", async () => {
      const transactionExecute =
        vi.fn();

      transactionExecute
        .mockResolvedValueOnce([
          {
            insertId: 31,
          },
        ])
        .mockResolvedValueOnce([
          [createdApplicantRow],
        ]);

      const executor = {
        execute:
          transactionExecute,
      };

      await createApplicant(
        input,
        executor
      );

      expect(
        transactionExecute
      ).toHaveBeenCalledTimes(2);

      expect(
        execute
      ).not.toHaveBeenCalled();
    });

    it("throws when a created applicant cannot be reloaded", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 31,
          },
        ])
        .mockResolvedValueOnce([
          [],
        ]);

      await expect(
        createApplicant(input)
      ).rejects.toThrow(
        "Created applicant could not be loaded."
      );
    });

    it("translates the applicant email unique constraint into ApplicantEmailConflictError", async () => {
      const duplicateEmailError = {
        code: "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'amina@example.com' for key 'applicants.uq_applicants_email'",
      };

      execute.mockRejectedValue(
        duplicateEmailError
      );

      await expect(
        createApplicant(input)
      ).rejects.toBeInstanceOf(
        ApplicantEmailConflictError
      );
    });

    it("finds an applicant by normalized email", async () => {
      execute.mockResolvedValueOnce([
        [createdApplicantRow],
      ]);

      const applicant =
        await findApplicantByEmail(
          "amina@example.com"
        );

      expect(
        execute
      ).toHaveBeenCalledTimes(1);

      const selectCall =
        execute.mock.calls[0];

      expect(
        selectCall[0]
      ).toContain(
        "FROM applicants"
      );

      expect(
        selectCall[0]
      ).toContain(
        "WHERE email = ?"
      );

      expect(
        selectCall[1]
      ).toEqual([
        "amina@example.com",
      ]);

      expect(applicant).toEqual({
        id: 31,
        publicId:
          "44444444-4444-4444-8444-444444444444",
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        passwordHash:
          "$2b$12$hashed-password",
        emailVerifiedAt: null,
        isActive: true,
        createdAt:
          createdApplicantRow.created_at,
        updatedAt:
          createdApplicantRow.updated_at,
      });
    });

    it("returns null when an applicant email does not exist", async () => {
      execute.mockResolvedValueOnce([
        [],
      ]);

      await expect(
        findApplicantByEmail(
          "missing@example.com"
        )
      ).resolves.toBeNull();
    });

    it("marks an unverified applicant email as verified", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ]);

      const verified =
        await markApplicantEmailVerified(
          31
        );

      expect(
        execute
      ).toHaveBeenCalledOnce();

      const updateCall =
        execute.mock.calls[0];

      const sql =
        updateCall[0] as string;

      expect(sql).toContain(
        "UPDATE applicants"
      );

      expect(sql).toContain(
        "email_verified_at = NOW()"
      );

      expect(sql).toContain(
        "WHERE id = ?"
      );

      expect(sql).toContain(
        "email_verified_at IS NULL"
      );

      expect(
        updateCall[1]
      ).toEqual([
        31,
      ]);

      expect(
        verified
      ).toBe(true);
    });

    it("returns false when the applicant email was already verified or the applicant does not exist", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 0,
        },
      ]);

      await expect(
        markApplicantEmailVerified(
          31
        )
      ).resolves.toBe(false);
    });

    it("marks the applicant email verified using a supplied transaction executor", async () => {
      const transactionExecute =
        vi.fn()
          .mockResolvedValueOnce([
            {
              affectedRows: 1,
            },
          ]);

      const executor = {
        execute:
          transactionExecute,
      };

      const verified =
        await markApplicantEmailVerified(
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
        verified
      ).toBe(true);
    });
  }
);