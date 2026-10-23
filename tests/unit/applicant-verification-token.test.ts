import {
  describe,
  expect,
  it,
} from "vitest";
import {
  generateApplicantVerificationToken,
  hashApplicantVerificationToken,
} from "@/lib/applicant-auth/verification-token";

describe(
  "applicant email verification token security",
  () => {
    it("generates different opaque verification tokens", () => {
      const firstToken =
        generateApplicantVerificationToken();

      const secondToken =
        generateApplicantVerificationToken();

      expect(
        firstToken
      ).not.toBe(
        secondToken
      );

      expect(
        firstToken.length
      ).toBeGreaterThanOrEqual(
        40
      );

      expect(
        secondToken.length
      ).toBeGreaterThanOrEqual(
        40
      );
    });

    it("generates URL-safe verification tokens", () => {
      const token =
        generateApplicantVerificationToken();

      expect(token).toMatch(
        /^[A-Za-z0-9_-]+$/
      );
    });

    it("creates a SHA-256 verification token hash", () => {
      const token =
        generateApplicantVerificationToken();

      const hash =
        hashApplicantVerificationToken(
          token
        );

      expect(hash).toMatch(
        /^[a-f0-9]{64}$/
      );

      expect(
        hash
      ).not.toBe(
        token
      );
    });

    it("hashes the same verification token consistently", () => {
      const token =
        generateApplicantVerificationToken();

      expect(
        hashApplicantVerificationToken(
          token
        )
      ).toBe(
        hashApplicantVerificationToken(
          token
        )
      );
    });

    it("produces different hashes for different verification tokens", () => {
      const firstToken =
        generateApplicantVerificationToken();

      const secondToken =
        generateApplicantVerificationToken();

      expect(
        hashApplicantVerificationToken(
          firstToken
        )
      ).not.toBe(
        hashApplicantVerificationToken(
          secondToken
        )
      );
    });

    it("does not expose the raw token through its hash", () => {
      const token =
        generateApplicantVerificationToken();

      const hash =
        hashApplicantVerificationToken(
          token
        );

      expect(
        hash
      ).not.toContain(
        token
      );
    });
  }
);