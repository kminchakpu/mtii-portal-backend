import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  createApplicantMock,
  hashPasswordMock,
  issueApplicantVerificationMock,
  getAppUrlMock,
  buildApplicantVerificationUrlMock,
  buildApplicantVerificationEmailMock,
  sendEmailMock,
  randomUUIDMock,
} = vi.hoisted(
  () => ({
    createApplicantMock:
      vi.fn(),
    hashPasswordMock:
      vi.fn(),
    issueApplicantVerificationMock:
      vi.fn(),
    getAppUrlMock:
      vi.fn(),
    buildApplicantVerificationUrlMock:
      vi.fn(),
    buildApplicantVerificationEmailMock:
      vi.fn(),
    sendEmailMock:
      vi.fn(),
    randomUUIDMock:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-repository",
  () => ({
    createApplicant:
      createApplicantMock,
  })
);

vi.mock(
  "bcryptjs",
  () => ({
    hash:
      hashPasswordMock,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-service",
  () => ({
    issueApplicantVerification:
      issueApplicantVerificationMock,
  })
);

vi.mock(
  "@/lib/config/app-url",
  () => ({
    getAppUrl:
      getAppUrlMock,
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-email",
  () => ({
    buildApplicantVerificationUrl:
      buildApplicantVerificationUrlMock,
    buildApplicantVerificationEmail:
      buildApplicantVerificationEmailMock,
  })
);

vi.mock(
  "@/lib/email/email-service",
  () => ({
    sendEmail:
      sendEmailMock,
  })
);

vi.mock(
  "node:crypto",
  () => ({
    randomUUID:
      randomUUIDMock,
  })
);

import {
  ApplicantEmailConflictError,
} from "@/lib/applicant-auth/errors";
import {
  registerApplicant,
} from "@/lib/applicant-auth/registration-service";

describe(
  "applicant registration service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      randomUUIDMock.mockReturnValue(
        "11111111-2222-4333-8444-555555555555"
      );

      hashPasswordMock.mockResolvedValue(
        "$2b$12$hashed-password"
      );

      createApplicantMock.mockResolvedValue({
        id: 42,
        publicId:
          "11111111-2222-4333-8444-555555555555",
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        passwordHash:
          "$2b$12$hashed-password",
        emailVerifiedAt:
          null,
        isActive:
          true,
        createdAt:
          new Date(
            "2026-10-28T10:00:00Z"
          ),
        updatedAt:
          new Date(
            "2026-10-28T10:00:00Z"
          ),
      });

      issueApplicantVerificationMock.mockResolvedValue({
        token:
          "raw-verification-token",
        expiresAt:
          new Date(
            "2026-10-29T10:00:00Z"
          ),
      });

      getAppUrlMock.mockReturnValue(
        "https://api.mtiinasarawa.com.ng"
      );

      buildApplicantVerificationUrlMock.mockReturnValue(
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=raw-verification-token"
      );

      buildApplicantVerificationEmailMock.mockReturnValue({
        subject:
          "Verify your MTII applicant account",
        text:
          "Verification text",
        html:
          "<p>Verification HTML</p>",
      });

      sendEmailMock.mockResolvedValue({
        messageId:
          "message-123",
      });
    });

    it("validates and normalizes registration input before creating the applicant", async () => {
      await registerApplicant({
        firstName:
          "  Amina  ",
        lastName:
          "  Abdullahi  ",
        email:
          "  AMINA@EXAMPLE.COM  ",
        password:
          "StrongPassword123!",
      });

      expect(
        createApplicantMock
      ).toHaveBeenCalledWith({
        publicId:
          "11111111-2222-4333-8444-555555555555",
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        passwordHash:
          "$2b$12$hashed-password",
      });
    });

    it("hashes the applicant password with bcrypt before database storage", async () => {
      await registerApplicant({
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });

      expect(
        hashPasswordMock
      ).toHaveBeenCalledWith(
        "StrongPassword123!",
        12
      );

      expect(
        createApplicantMock
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash:
            "StrongPassword123!",
        })
      );
    });

    it("generates a public UUID for the applicant", async () => {
      await registerApplicant({
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });

      expect(
        randomUUIDMock
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        createApplicantMock
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          publicId:
            "11111111-2222-4333-8444-555555555555",
        })
      );
    });

    it("issues an email verification token for the created applicant", async () => {
      await registerApplicant({
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });

      expect(
        issueApplicantVerificationMock
      ).toHaveBeenCalledWith(
        42
      );
    });

    it("builds the verification URL using the configured application URL", async () => {
      await registerApplicant({
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });

      expect(
        getAppUrlMock
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        buildApplicantVerificationUrlMock
      ).toHaveBeenCalledWith(
        "raw-verification-token",
        "https://api.mtiinasarawa.com.ng"
      );
    });

    it("builds and sends the verification email to the applicant", async () => {
      await registerApplicant({
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });

      expect(
        buildApplicantVerificationEmailMock
      ).toHaveBeenCalledWith({
        firstName:
          "Amina",
        verificationUrl:
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=raw-verification-token",
      });

      expect(
        sendEmailMock
      ).toHaveBeenCalledWith({
        to:
          "amina@example.com",
        subject:
          "Verify your MTII applicant account",
        text:
          "Verification text",
        html:
          "<p>Verification HTML</p>",
      });
    });

    it("returns only safe applicant registration information", async () => {
      const result =
        await registerApplicant({
          firstName:
            "Amina",
          lastName:
            "Abdullahi",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        });

      expect(
        result
      ).toEqual({
        publicId:
          "11111111-2222-4333-8444-555555555555",
        firstName:
          "Amina",
        lastName:
          "Abdullahi",
        email:
          "amina@example.com",
        emailVerified:
          false,
      });

      expect(
        result
      ).not.toHaveProperty(
        "password"
      );

      expect(
        result
      ).not.toHaveProperty(
        "passwordHash"
      );

      expect(
        result
      ).not.toHaveProperty(
        "verificationToken"
      );
    });

    it("rejects invalid input before hashing or accessing persistence", async () => {
      await expect(
        registerApplicant({
          firstName: "",
          lastName:
            "Abdullahi",
          email:
            "not-an-email",
          password:
            "short",
        })
      ).rejects.toBeDefined();

      expect(
        hashPasswordMock
      ).not.toHaveBeenCalled();

      expect(
        createApplicantMock
      ).not.toHaveBeenCalled();

      expect(
        issueApplicantVerificationMock
      ).not.toHaveBeenCalled();

      expect(
        sendEmailMock
      ).not.toHaveBeenCalled();
    });

    it("does not issue a verification token when applicant creation fails", async () => {
      createApplicantMock.mockRejectedValue(
        new Error(
          "Applicant creation failed"
        )
      );

      await expect(
        registerApplicant({
          firstName:
            "Amina",
          lastName:
            "Abdullahi",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).rejects.toThrow(
        "Applicant creation failed"
      );

      expect(
        issueApplicantVerificationMock
      ).not.toHaveBeenCalled();

      expect(
        sendEmailMock
      ).not.toHaveBeenCalled();
    });

    it("preserves duplicate-email conflicts without issuing verification or sending email", async () => {
      createApplicantMock.mockRejectedValue(
        new ApplicantEmailConflictError()
      );

      const operation =
        registerApplicant({
          firstName:
            "Amina",
          lastName:
            "Abdullahi",
          email:
            "AMINA@EXAMPLE.COM",
          password:
            "StrongPassword123!",
        });

      await expect(
        operation
      ).rejects.toBeInstanceOf(
        ApplicantEmailConflictError
      );

      expect(
        createApplicantMock
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          email:
            "amina@example.com",
        })
      );

      expect(
        issueApplicantVerificationMock
      ).not.toHaveBeenCalled();

      expect(
        buildApplicantVerificationUrlMock
      ).not.toHaveBeenCalled();

      expect(
        buildApplicantVerificationEmailMock
      ).not.toHaveBeenCalled();

      expect(
        sendEmailMock
      ).not.toHaveBeenCalled();
    });

    it("propagates verification issuance failure without attempting email delivery", async () => {
      issueApplicantVerificationMock.mockRejectedValue(
        new Error(
          "Verification issuance failed"
        )
      );

      await expect(
        registerApplicant({
          firstName:
            "Amina",
          lastName:
            "Abdullahi",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).rejects.toThrow(
        "Verification issuance failed"
      );

      expect(
        sendEmailMock
      ).not.toHaveBeenCalled();
    });

    it("propagates email delivery failure", async () => {
      sendEmailMock.mockRejectedValue(
        new Error(
          "SMTP delivery failed"
        )
      );

      await expect(
        registerApplicant({
          firstName:
            "Amina",
          lastName:
            "Abdullahi",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).rejects.toThrow(
        "SMTP delivery failed"
      );
    });
  }
);