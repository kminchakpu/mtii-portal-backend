import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(
  () => ({
    findApplicantByEmail:
      vi.fn(),
    issueApplicantVerification:
      vi.fn(),
    buildApplicantVerificationUrl:
      vi.fn(),
    buildApplicantVerificationEmail:
      vi.fn(),
    getAppUrl:
      vi.fn(),
    sendEmail:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-repository",
  () => ({
    findApplicantByEmail:
      mocks.findApplicantByEmail,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-service",
  () => ({
    issueApplicantVerification:
      mocks.issueApplicantVerification,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-email",
  () => ({
    buildApplicantVerificationUrl:
      mocks.buildApplicantVerificationUrl,
    buildApplicantVerificationEmail:
      mocks.buildApplicantVerificationEmail,
  })
);

vi.mock(
  "@/lib/config/app-url",
  () => ({
    getAppUrl:
      mocks.getAppUrl,
  })
);

vi.mock(
  "@/lib/email/email-service",
  () => ({
    sendEmail:
      mocks.sendEmail,
  })
);

import {
  resendApplicantVerification,
} from "@/lib/applicant-auth/resend-verification-service";

function createApplicant(
  overrides: {
    email?: string;
    emailVerifiedAt?:
      Date | null;
    isActive?: boolean;
  } = {}
) {
  return {
    id: 42,
    publicId:
      "0f78e2a0-1111-4444-8888-123456789abc",
    firstName:
      "Amina",
    lastName:
      "Abdullahi",
    email:
      overrides.email ??
      "amina@example.com",
    passwordHash:
      "stored-password-hash",
    emailVerifiedAt:
      overrides.emailVerifiedAt ??
      null,
    isActive:
      overrides.isActive ??
      true,
    createdAt:
      new Date(
        "2026-10-29T10:00:00.000Z"
      ),
    updatedAt:
      new Date(
        "2026-10-29T10:00:00.000Z"
      ),
  };
}

describe(
  "resendApplicantVerification",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      mocks.getAppUrl.mockReturnValue(
        "https://portal.example.com"
      );

      mocks.issueApplicantVerification.mockResolvedValue({
        token:
          "new-secret-verification-token",
        expiresAt:
          new Date(
            "2026-10-30T10:00:00.000Z"
          ),
      });

      mocks.buildApplicantVerificationUrl.mockReturnValue(
        "https://portal.example.com/api/applicant/auth/verify-email?token=new-secret-verification-token"
      );

      mocks.buildApplicantVerificationEmail.mockReturnValue({
        subject:
          "Verify your MTII applicant account",
        text:
          "Verification email text",
        html:
          "<p>Verification email</p>",
      });

      mocks.sendEmail.mockResolvedValue(
        undefined
      );
    });

    it(
      "normalizes the email before looking up the applicant",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          null
        );

        await resendApplicantVerification(
          "  AMINA@EXAMPLE.COM  "
        );

        expect(
          mocks.findApplicantByEmail
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.findApplicantByEmail
        ).toHaveBeenCalledWith(
          "amina@example.com"
        );
      }
    );

    it(
      "does nothing when the applicant does not exist",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          null
        );

        await expect(
          resendApplicantVerification(
            "missing@example.com"
          )
        ).resolves.toBeUndefined();

        expect(
          mocks.issueApplicantVerification
        ).not.toHaveBeenCalled();

        expect(
          mocks.sendEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "does nothing when the applicant email is already verified",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant({
            emailVerifiedAt:
              new Date(
                "2026-10-29T12:00:00.000Z"
              ),
          })
        );

        await expect(
          resendApplicantVerification(
            "amina@example.com"
          )
        ).resolves.toBeUndefined();

        expect(
          mocks.issueApplicantVerification
        ).not.toHaveBeenCalled();

        expect(
          mocks.sendEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "does nothing when the applicant account is inactive",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant({
            isActive:
              false,
          })
        );

        await expect(
          resendApplicantVerification(
            "amina@example.com"
          )
        ).resolves.toBeUndefined();

        expect(
          mocks.issueApplicantVerification
        ).not.toHaveBeenCalled();

        expect(
          mocks.sendEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "issues a new verification for an active unverified applicant",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        await resendApplicantVerification(
          "amina@example.com"
        );

        expect(
          mocks.issueApplicantVerification
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.issueApplicantVerification
        ).toHaveBeenCalledWith(
          42
        );
      }
    );

    it(
      "builds the verification URL from the newly issued token",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        await resendApplicantVerification(
          "amina@example.com"
        );

        expect(
          mocks.getAppUrl
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.buildApplicantVerificationUrl
        ).toHaveBeenCalledWith(
          "new-secret-verification-token",
          "https://portal.example.com"
        );
      }
    );

    it(
      "builds the verification email using the applicant first name",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        await resendApplicantVerification(
          "amina@example.com"
        );

        expect(
          mocks.buildApplicantVerificationEmail
        ).toHaveBeenCalledWith({
          firstName:
            "Amina",
          verificationUrl:
            "https://portal.example.com/api/applicant/auth/verify-email?token=new-secret-verification-token",
        });
      }
    );

    it(
      "sends the verification email to the stored applicant email",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant({
            email:
              "amina@example.com",
          })
        );

        await resendApplicantVerification(
          "AMINA@EXAMPLE.COM"
        );

        expect(
          mocks.sendEmail
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.sendEmail
        ).toHaveBeenCalledWith({
          to:
            "amina@example.com",
          subject:
            "Verify your MTII applicant account",
          text:
            "Verification email text",
          html:
            "<p>Verification email</p>",
        });
      }
    );

    it(
      "does not return the verification token",
      async () => {
        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        const result =
          await resendApplicantVerification(
            "amina@example.com"
          );

        expect(
          result
        ).toBeUndefined();
      }
    );

    it(
      "propagates unexpected repository failures",
      async () => {
        const error =
          new Error(
            "database unavailable"
          );

        mocks.findApplicantByEmail.mockRejectedValue(
          error
        );

        await expect(
          resendApplicantVerification(
            "amina@example.com"
          )
        ).rejects.toBe(
          error
        );

        expect(
          mocks.issueApplicantVerification
        ).not.toHaveBeenCalled();

        expect(
          mocks.sendEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "propagates verification issuance failures",
      async () => {
        const error =
          new Error(
            "verification issuance failed"
          );

        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        mocks.issueApplicantVerification.mockRejectedValue(
          error
        );

        await expect(
          resendApplicantVerification(
            "amina@example.com"
          )
        ).rejects.toBe(
          error
        );

        expect(
          mocks.sendEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "propagates email delivery failures",
      async () => {
        const error =
          new Error(
            "SMTP unavailable"
          );

        mocks.findApplicantByEmail.mockResolvedValue(
          createApplicant()
        );

        mocks.sendEmail.mockRejectedValue(
          error
        );

        await expect(
          resendApplicantVerification(
            "amina@example.com"
          )
        ).rejects.toBe(
          error
        );
      }
    );
  }
);