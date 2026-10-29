import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resendApplicantVerificationSchema,
} from "@/lib/applicant-auth/applicant-validation";

describe(
  "resendApplicantVerificationSchema",
  () => {
    it(
      "accepts a valid email address",
      () => {
        const result =
          resendApplicantVerificationSchema.parse({
            email:
              "amina@example.com",
          });

        expect(
          result
        ).toEqual({
          email:
            "amina@example.com",
        });
      }
    );

    it(
      "trims and lowercases the email address",
      () => {
        const result =
          resendApplicantVerificationSchema.parse({
            email:
              "  AMINA@EXAMPLE.COM  ",
          });

        expect(
          result.email
        ).toBe(
          "amina@example.com"
        );
      }
    );

    it(
      "rejects an invalid email address",
      () => {
        expect(() =>
          resendApplicantVerificationSchema.parse({
            email:
              "not-an-email",
          })
        ).toThrow();
      }
    );

    it(
      "rejects an empty email address",
      () => {
        expect(() =>
          resendApplicantVerificationSchema.parse({
            email: "",
          })
        ).toThrow();
      }
    );

    it(
      "rejects a missing email address",
      () => {
        expect(() =>
          resendApplicantVerificationSchema.parse({})
        ).toThrow();
      }
    );

    it(
      "rejects an email longer than 255 characters",
      () => {
        const longEmail =
          `${"a".repeat(
            246
          )}@example.com`;

        expect(
          longEmail.length
        ).toBeGreaterThan(
          255
        );

        expect(() =>
          resendApplicantVerificationSchema.parse({
            email:
              longEmail,
          })
        ).toThrow();
      }
    );

    it(
      "rejects unexpected fields",
      () => {
        expect(() =>
          resendApplicantVerificationSchema.parse({
            email:
              "amina@example.com",
            applicantId:
              42,
          })
        ).toThrow();
      }
    );
  }
);