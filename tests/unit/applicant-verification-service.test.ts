import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  generateApplicantVerificationToken:
    vi.fn(),
  hashApplicantVerificationToken:
    vi.fn(),
  getApplicantVerificationConfig:
    vi.fn(),
  getApplicantVerificationExpiresAt:
    vi.fn(),
  invalidateApplicantVerifications:
    vi.fn(),
  createApplicantVerification:
    vi.fn(),
  findValidApplicantVerificationByTokenHashForUpdate:
    vi.fn(),
  consumeApplicantVerification:
    vi.fn(),
  markApplicantEmailVerified:
    vi.fn(),
  withTransaction:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/verification-token",
  () => ({
    generateApplicantVerificationToken:
      mocks.generateApplicantVerificationToken,
    hashApplicantVerificationToken:
      mocks.hashApplicantVerificationToken,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-config",
  () => ({
    getApplicantVerificationConfig:
      mocks.getApplicantVerificationConfig,
    getApplicantVerificationExpiresAt:
      mocks.getApplicantVerificationExpiresAt,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-repository",
  () => ({
    invalidateApplicantVerifications:
      mocks.invalidateApplicantVerifications,
    createApplicantVerification:
      mocks.createApplicantVerification,
    findValidApplicantVerificationByTokenHashForUpdate:
      mocks.findValidApplicantVerificationByTokenHashForUpdate,
    consumeApplicantVerification:
      mocks.consumeApplicantVerification,
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-repository",
  () => ({
    markApplicantEmailVerified:
      mocks.markApplicantEmailVerified,
  })
);

vi.mock(
  "@/lib/db/transaction",
  () => ({
    withTransaction:
      mocks.withTransaction,
  })
);

import {
  issueApplicantVerification,
  verifyApplicantEmail,
} from "@/lib/applicant-auth/verification-service";

const rawToken =
  "secure-raw-verification-token";

const tokenHash =
  "a".repeat(64);

const expiresAt = new Date(
  "2026-10-29T10:00:00.000Z"
);

const verification = {
  id: 41,
  applicantId: 31,
  tokenHash,
  expiresAt,
  consumedAt: null,
  createdAt: new Date(
    "2026-10-28T10:00:00.000Z"
  ),
};

describe(
  "applicant verification issuance service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.generateApplicantVerificationToken
        .mockReturnValue(
          rawToken
        );

      mocks.hashApplicantVerificationToken
        .mockReturnValue(
          tokenHash
        );

      mocks.getApplicantVerificationConfig
        .mockReturnValue({
          ttlHours: 24,
        });

      mocks.getApplicantVerificationExpiresAt
        .mockReturnValue(
          expiresAt
        );

      mocks.invalidateApplicantVerifications
        .mockResolvedValue(
          1
        );

      mocks.createApplicantVerification
        .mockResolvedValue(
          41
        );

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              connection: object
            ) => Promise<unknown>
          ) => {
            return operation({
              execute: vi.fn(),
            });
          }
        );
    });

    it("generates and hashes a secure verification token", async () => {
      await issueApplicantVerification(
        31
      );

      expect(
        mocks.generateApplicantVerificationToken
      ).toHaveBeenCalledOnce();

      expect(
        mocks.hashApplicantVerificationToken
      ).toHaveBeenCalledWith(
        rawToken
      );
    });

    it("calculates expiration using the configured verification lifetime", async () => {
      await issueApplicantVerification(
        31
      );

      expect(
        mocks.getApplicantVerificationConfig
      ).toHaveBeenCalledOnce();

      expect(
        mocks.getApplicantVerificationExpiresAt
      ).toHaveBeenCalledOnce();

      const [
        now,
        ttlHours,
      ] =
        mocks.getApplicantVerificationExpiresAt
          .mock.calls[0];

      expect(
        now
      ).toBeInstanceOf(
        Date
      );

      expect(
        ttlHours
      ).toBe(24);
    });

    it("invalidates existing verification records using the transaction connection", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await issueApplicantVerification(
        31
      );

      expect(
        mocks.invalidateApplicantVerifications
      ).toHaveBeenCalledWith(
        31,
        connection
      );
    });

    it("creates the replacement verification using the same transaction", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await issueApplicantVerification(
        31
      );

      expect(
        mocks.createApplicantVerification
      ).toHaveBeenCalledWith(
        {
          applicantId: 31,
          tokenHash,
          expiresAt,
        },
        connection
      );
    });

    it("invalidates old verification records before creating the replacement", async () => {
      const callOrder: string[] =
        [];

      mocks.invalidateApplicantVerifications
        .mockImplementation(
          async () => {
            callOrder.push(
              "invalidate"
            );

            return 1;
          }
        );

      mocks.createApplicantVerification
        .mockImplementation(
          async () => {
            callOrder.push(
              "create"
            );

            return 41;
          }
        );

      await issueApplicantVerification(
        31
      );

      expect(
        callOrder
      ).toEqual([
        "invalidate",
        "create",
      ]);
    });

    it("returns the raw token and expiration for email delivery", async () => {
      const result =
        await issueApplicantVerification(
          31
        );

      expect(
        result
      ).toEqual({
        token: rawToken,
        expiresAt,
      });
    });

    it("never sends the raw token to the verification repository", async () => {
      await issueApplicantVerification(
        31
      );

      expect(
        mocks.createApplicantVerification
      ).toHaveBeenCalledWith(
        {
          applicantId: 31,
          tokenHash,
          expiresAt,
        },
        expect.anything()
      );

      const repositoryArguments =
        JSON.stringify(
          mocks.createApplicantVerification
            .mock.calls
        );

      expect(
        repositoryArguments
      ).not.toContain(
        rawToken
      );
    });

    it("does not create a replacement if invalidation fails", async () => {
      mocks.invalidateApplicantVerifications
        .mockRejectedValueOnce(
          new Error(
            "Invalidation failed"
          )
        );

      await expect(
        issueApplicantVerification(
          31
        )
      ).rejects.toThrow(
        "Invalidation failed"
      );

      expect(
        mocks.createApplicantVerification
      ).not.toHaveBeenCalled();
    });

    it("propagates verification creation failures", async () => {
      mocks.createApplicantVerification
        .mockRejectedValueOnce(
          new Error(
            "Verification creation failed"
          )
        );

      await expect(
        issueApplicantVerification(
          31
        )
      ).rejects.toThrow(
        "Verification creation failed"
      );
    });

    it("performs replacement operations inside one transaction", async () => {
      await issueApplicantVerification(
        31
      );

      expect(
        mocks.withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        mocks.invalidateApplicantVerifications
      ).toHaveBeenCalledOnce();

      expect(
        mocks.createApplicantVerification
      ).toHaveBeenCalledOnce();
    });
  }
);

describe(
  "applicant email verification consumption service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.hashApplicantVerificationToken
        .mockReturnValue(
          tokenHash
        );

      mocks.findValidApplicantVerificationByTokenHashForUpdate
        .mockResolvedValue(
          verification
        );

      mocks.markApplicantEmailVerified
        .mockResolvedValue(
          true
        );

      mocks.consumeApplicantVerification
        .mockResolvedValue(
          true
        );

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              connection: object
            ) => Promise<unknown>
          ) => {
            return operation({
              execute: vi.fn(),
            });
          }
        );
    });

    it("hashes the raw verification token before database lookup", async () => {
      await verifyApplicantEmail(
        rawToken
      );

      expect(
        mocks.hashApplicantVerificationToken
      ).toHaveBeenCalledOnce();

      expect(
        mocks.hashApplicantVerificationToken
      ).toHaveBeenCalledWith(
        rawToken
      );

      expect(
        mocks.findValidApplicantVerificationByTokenHashForUpdate
      ).toHaveBeenCalledWith(
        tokenHash,
        expect.anything()
      );
    });

    it("never sends the raw verification token to the repository", async () => {
      await verifyApplicantEmail(
        rawToken
      );

      const repositoryArguments =
        JSON.stringify(
          mocks.findValidApplicantVerificationByTokenHashForUpdate
            .mock.calls
        );

      expect(
        repositoryArguments
      ).not.toContain(
        rawToken
      );

      expect(
        repositoryArguments
      ).toContain(
        tokenHash
      );
    });

    it("locks the verification record using the transaction connection", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await verifyApplicantEmail(
        rawToken
      );

      expect(
        mocks.findValidApplicantVerificationByTokenHashForUpdate
      ).toHaveBeenCalledWith(
        tokenHash,
        connection
      );
    });

    it("rejects an invalid, expired, or already consumed verification token", async () => {
      mocks.findValidApplicantVerificationByTokenHashForUpdate
        .mockResolvedValueOnce(
          null
        );

      await expect(
        verifyApplicantEmail(
          rawToken
        )
      ).rejects.toThrow(
        "Invalid or expired applicant verification token."
      );

      expect(
        mocks.markApplicantEmailVerified
      ).not.toHaveBeenCalled();

      expect(
        mocks.consumeApplicantVerification
      ).not.toHaveBeenCalled();
    });

    it("marks the applicant email verified using the same transaction", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await verifyApplicantEmail(
        rawToken
      );

      expect(
        mocks.markApplicantEmailVerified
      ).toHaveBeenCalledWith(
        31,
        connection
      );
    });

    it("consumes the verification token using the same transaction", async () => {
      const connection = {
        execute: vi.fn(),
      };

      mocks.withTransaction
        .mockImplementation(
          async (
            operation: (
              transactionConnection:
                object
            ) => Promise<unknown>
          ) => {
            return operation(
              connection
            );
          }
        );

      await verifyApplicantEmail(
        rawToken
      );

      expect(
        mocks.consumeApplicantVerification
      ).toHaveBeenCalledWith(
        41,
        connection
      );
    });

    it("marks the applicant verified before consuming the token", async () => {
      const callOrder: string[] =
        [];

      mocks.markApplicantEmailVerified
        .mockImplementation(
          async () => {
            callOrder.push(
              "verify-applicant"
            );

            return true;
          }
        );

      mocks.consumeApplicantVerification
        .mockImplementation(
          async () => {
            callOrder.push(
              "consume-token"
            );

            return true;
          }
        );

      await verifyApplicantEmail(
        rawToken
      );

      expect(
        callOrder
      ).toEqual([
        "verify-applicant",
        "consume-token",
      ]);
    });

    it("rejects verification when the applicant cannot be marked verified", async () => {
      mocks.markApplicantEmailVerified
        .mockResolvedValueOnce(
          false
        );

      await expect(
        verifyApplicantEmail(
          rawToken
        )
      ).rejects.toThrow(
        "Invalid or expired applicant verification token."
      );

      expect(
        mocks.consumeApplicantVerification
      ).not.toHaveBeenCalled();
    });

    it("rejects verification when the token cannot be consumed", async () => {
      mocks.consumeApplicantVerification
        .mockResolvedValueOnce(
          false
        );

      await expect(
        verifyApplicantEmail(
          rawToken
        )
      ).rejects.toThrow(
        "Invalid or expired applicant verification token."
      );
    });

    it("performs verification operations inside one transaction", async () => {
      await verifyApplicantEmail(
        rawToken
      );

      expect(
        mocks.withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        mocks.findValidApplicantVerificationByTokenHashForUpdate
      ).toHaveBeenCalledOnce();

      expect(
        mocks.markApplicantEmailVerified
      ).toHaveBeenCalledOnce();

      expect(
        mocks.consumeApplicantVerification
      ).toHaveBeenCalledOnce();
    });

    it("propagates repository failures so the transaction can roll back", async () => {
      mocks.markApplicantEmailVerified
        .mockRejectedValueOnce(
          new Error(
            "Applicant update failed"
          )
        );

      await expect(
        verifyApplicantEmail(
          rawToken
        )
      ).rejects.toThrow(
        "Applicant update failed"
      );

      expect(
        mocks.consumeApplicantVerification
      ).not.toHaveBeenCalled();
    });
  }
);