import {
  describe,
  expect,
  it,
} from "vitest";
import {
  registerApplicantSchema,
} from "@/lib/applicant-auth/applicant-validation";

describe(
  "applicant registration validation",
  () => {
    it("accepts and normalizes valid applicant registration data", () => {
      const result =
        registerApplicantSchema.parse({
          firstName: "  Amina  ",
          lastName: "  Ibrahim  ",
          email:
            "  AMINA@EXAMPLE.COM  ",
          password:
            "StrongPassword123!",
        });

      expect(result).toEqual({
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
      });
    });

    it("rejects a blank first name", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "   ",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).toThrow();
    });

    it("rejects a blank last name", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "   ",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).toThrow();
    });

    it("rejects names longer than 100 characters", () => {
      const longName = "A".repeat(101);

      expect(() =>
        registerApplicantSchema.parse({
          firstName: longName,
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).toThrow();

      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: longName,
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).toThrow();
    });

    it("rejects an invalid email address", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email: "not-an-email",
          password:
            "StrongPassword123!",
        })
      ).toThrow();
    });

    it("rejects an email longer than 255 characters", () => {
      const email =
        `${"a".repeat(244)}@example.com`;

      expect(email.length).toBe(256);

      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email,
          password:
            "StrongPassword123!",
        })
      ).toThrow();
    });

    it("rejects a password shorter than 12 characters", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password: "Short1!",
        })
      ).toThrow();
    });

    it("accepts a password exactly 12 characters long", () => {
      const result =
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password: "123456789012",
        });

      expect(result.password).toBe(
        "123456789012"
      );
    });

    it("does not trim or lowercase the password", () => {
      const password =
        "  Password123!  ";

      const result =
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password,
        });

      expect(result.password).toBe(
        password
      );
    });

    it("rejects unexpected applicant registration fields", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          isActive: false,
        })
      ).toThrow();

      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          emailVerifiedAt:
            "2026-10-23T12:00:00Z",
        })
      ).toThrow();
    });

    it("rejects staff authorization fields", () => {
      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId:
            "11111111-1111-4111-8111-111111111111",
        })
      ).toThrow();

      expect(() =>
        registerApplicantSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          roles: ["SUPER_ADMIN"],
        })
      ).toThrow();
    });
  }
);