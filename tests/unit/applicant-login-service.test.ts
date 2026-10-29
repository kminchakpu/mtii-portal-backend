import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  findApplicantByEmail,
  verifyPassword,
  createApplicantSession,
} = vi.hoisted(() => ({
  findApplicantByEmail:
    vi.fn(),
  verifyPassword:
    vi.fn(),
  createApplicantSession:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/applicant-repository",
  () => ({
    findApplicantByEmail,
  })
);

vi.mock(
  "@/lib/auth/password",
  () => ({
    verifyPassword,
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-repository",
  () => ({
    createApplicantSession,
  })
);

import {
  ApplicantAccountInactiveError,
  ApplicantEmailNotVerifiedError,
  InvalidApplicantCredentialsError,
  authenticateApplicant,
} from "@/lib/applicant-auth/login-service";

const verifiedAt =
  new Date(
    "2026-10-29T12:00:00.000Z"
  );

const createdAt =
  new Date(
    "2026-10-01T12:00:00.000Z"
  );

const updatedAt =
  new Date(
    "2026-10-29T12:00:00.000Z"
  );

const expiresAt =
  new Date(
    "2026-11-05T12:00:00.000Z"
  );

function buildApplicant(
  overrides: Record<
    string,
    unknown
  > = {}
) {
  return {
    id: 42,
    publicId:
      "applicant-public-id",
    firstName: "Kevin",
    lastName: "Applicant",
    email:
      "applicant@example.com",
    passwordHash:
      "stored-password-hash",
    emailVerifiedAt:
      verifiedAt,
    isActive: true,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe(
  "applicant login service",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it(
      "normalizes the applicant email before repository lookup",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant()
          );

        verifyPassword
          .mockResolvedValueOnce(
            true
          );

        createApplicantSession
          .mockResolvedValueOnce({
            token:
              "applicant-session-token",
            expiresAt,
          });

        await authenticateApplicant({
          email:
            "  Applicant@Example.COM  ",
          password:
            "correct-password",
        });

        expect(
          findApplicantByEmail
        ).toHaveBeenCalledWith(
          "applicant@example.com"
        );
      }
    );

    it(
      "authenticates an active verified applicant with a valid password",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant()
          );

        verifyPassword
          .mockResolvedValueOnce(
            true
          );

        createApplicantSession
          .mockResolvedValueOnce({
            token:
              "applicant-session-token",
            expiresAt,
          });

        const result =
          await authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "correct-password",
          });

        expect(
          verifyPassword
        ).toHaveBeenCalledWith(
          "correct-password",
          "stored-password-hash"
        );

        expect(
          createApplicantSession
        ).toHaveBeenCalledWith(
          42
        );

        expect(
          result
        ).toEqual({
          applicant: {
            id: 42,
            publicId:
              "applicant-public-id",
            firstName:
              "Kevin",
            lastName:
              "Applicant",
            email:
              "applicant@example.com",
          },
          session: {
            token:
              "applicant-session-token",
            expiresAt,
          },
        });
      }
    );

    it(
      "does not expose the password hash in the authenticated applicant result",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant()
          );

        verifyPassword
          .mockResolvedValueOnce(
            true
          );

        createApplicantSession
          .mockResolvedValueOnce({
            token:
              "applicant-session-token",
            expiresAt,
          });

        const result =
          await authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "correct-password",
          });

        expect(
          result.applicant
        ).not.toHaveProperty(
          "passwordHash"
        );
      }
    );

    it(
      "rejects an unknown applicant with the generic invalid credentials error",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            null
          );

        await expect(
          authenticateApplicant({
            email:
              "missing@example.com",
            password:
              "some-password",
          })
        ).rejects.toBeInstanceOf(
          InvalidApplicantCredentialsError
        );

        expect(
          verifyPassword
        ).not.toHaveBeenCalled();

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an incorrect password with the same generic invalid credentials error",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant()
          );

        verifyPassword
          .mockResolvedValueOnce(
            false
          );

        await expect(
          authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "wrong-password",
          })
        ).rejects.toBeInstanceOf(
          InvalidApplicantCredentialsError
        );

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an inactive applicant before creating a session",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant({
              isActive: false,
            })
          );

        verifyPassword
          .mockResolvedValueOnce(
            true
          );

        await expect(
          authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "correct-password",
          })
        ).rejects.toBeInstanceOf(
          ApplicantAccountInactiveError
        );

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an unverified applicant before creating a session",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant({
              emailVerifiedAt:
                null,
            })
          );

        verifyPassword
          .mockResolvedValueOnce(
            true
          );

        await expect(
          authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "correct-password",
          })
        ).rejects.toBeInstanceOf(
          ApplicantEmailNotVerifiedError
        );

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "checks the password before revealing that an account is inactive",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant({
              isActive: false,
            })
          );

        verifyPassword
          .mockResolvedValueOnce(
            false
          );

        await expect(
          authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "wrong-password",
          })
        ).rejects.toBeInstanceOf(
          InvalidApplicantCredentialsError
        );

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "checks the password before revealing that an account is unverified",
      async () => {
        findApplicantByEmail
          .mockResolvedValueOnce(
            buildApplicant({
              emailVerifiedAt:
                null,
            })
          );

        verifyPassword
          .mockResolvedValueOnce(
            false
          );

        await expect(
          authenticateApplicant({
            email:
              "applicant@example.com",
            password:
              "wrong-password",
          })
        ).rejects.toBeInstanceOf(
          InvalidApplicantCredentialsError
        );

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "does not create a session when validation fails",
      async () => {
        await expect(
          authenticateApplicant({
            email:
              "not-an-email",
            password: "",
          })
        ).rejects.toBeDefined();

        expect(
          findApplicantByEmail
        ).not.toHaveBeenCalled();

        expect(
          verifyPassword
        ).not.toHaveBeenCalled();

        expect(
          createApplicantSession
        ).not.toHaveBeenCalled();
      }
    );
  }
);