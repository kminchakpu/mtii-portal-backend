import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getApplicantVerificationConfig,
  getApplicantVerificationExpiresAt,
} from "@/lib/applicant-auth/verification-config";

describe(
  "applicant email verification configuration",
  () => {
    it("uses a 24-hour default verification lifetime", () => {
      const config =
        getApplicantVerificationConfig(
          {}
        );

      expect(
        config.ttlHours
      ).toBe(24);
    });

    it("reads the verification lifetime from the environment", () => {
      const config =
        getApplicantVerificationConfig({
          APPLICANT_VERIFICATION_TTL_HOURS:
            "12",
        });

      expect(
        config.ttlHours
      ).toBe(12);
    });

    it("rejects a non-integer verification lifetime", () => {
      expect(() =>
        getApplicantVerificationConfig({
          APPLICANT_VERIFICATION_TTL_HOURS:
            "12.5",
        })
      ).toThrow(
        "APPLICANT_VERIFICATION_TTL_HOURS must be an integer between 1 and 48"
      );
    });

    it("rejects a verification lifetime below one hour", () => {
      expect(() =>
        getApplicantVerificationConfig({
          APPLICANT_VERIFICATION_TTL_HOURS:
            "0",
        })
      ).toThrow(
        "APPLICANT_VERIFICATION_TTL_HOURS must be an integer between 1 and 48"
      );
    });

    it("rejects a verification lifetime above 48 hours", () => {
      expect(() =>
        getApplicantVerificationConfig({
          APPLICANT_VERIFICATION_TTL_HOURS:
            "49",
        })
      ).toThrow(
        "APPLICANT_VERIFICATION_TTL_HOURS must be an integer between 1 and 48"
      );
    });

    it("rejects an invalid verification lifetime", () => {
      expect(() =>
        getApplicantVerificationConfig({
          APPLICANT_VERIFICATION_TTL_HOURS:
            "invalid",
        })
      ).toThrow(
        "APPLICANT_VERIFICATION_TTL_HOURS must be an integer between 1 and 48"
      );
    });

    it("calculates the verification expiration time", () => {
      const now = new Date(
        "2026-10-24T10:00:00.000Z"
      );

      const expiresAt =
        getApplicantVerificationExpiresAt(
          now,
          24
        );

      expect(
        expiresAt.toISOString()
      ).toBe(
        "2026-10-25T10:00:00.000Z"
      );
    });

    it("does not mutate the supplied current date", () => {
      const now = new Date(
        "2026-10-24T10:00:00.000Z"
      );

      const original =
        now.toISOString();

      getApplicantVerificationExpiresAt(
        now,
        24
      );

      expect(
        now.toISOString()
      ).toBe(original);
    });
  }
);