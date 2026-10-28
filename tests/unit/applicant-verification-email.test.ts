import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildApplicantVerificationEmail,
  buildApplicantVerificationUrl,
} from "@/lib/applicant-auth/verification-email";

const rawToken =
  "secure+/verification?token=value";

describe(
  "applicant verification email",
  () => {
    it("builds a verification URL using APP_URL", () => {
      const url =
        buildApplicantVerificationUrl(
          rawToken,
          "https://api.mtiinasarawa.com.ng"
        );

      expect(
        url
      ).toBe(
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=secure%2B%2Fverification%3Ftoken%3Dvalue"
      );
    });

    it("handles a trailing slash on the application URL", () => {
      const url =
        buildApplicantVerificationUrl(
          rawToken,
          "https://api.mtiinasarawa.com.ng/"
        );

      expect(
        url
      ).toBe(
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=secure%2B%2Fverification%3Ftoken%3Dvalue"
      );
    });

    it("includes the applicant name and verification URL in the text email", () => {
      const email =
        buildApplicantVerificationEmail({
          firstName: "Amina",
          verificationUrl:
            "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123",
        });

      expect(
        email.text
      ).toContain(
        "Amina"
      );

      expect(
        email.text
      ).toContain(
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123"
      );
    });

    it("includes the applicant name and verification URL in the HTML email", () => {
      const email =
        buildApplicantVerificationEmail({
          firstName: "Amina",
          verificationUrl:
            "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123",
        });

      expect(
        email.html
      ).toContain(
        "Amina"
      );

      expect(
        email.html
      ).toContain(
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123"
      );
    });

    it("uses a clear verification subject", () => {
      const email =
        buildApplicantVerificationEmail({
          firstName: "Amina",
          verificationUrl:
            "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123",
        });

      expect(
        email.subject
      ).toBe(
        "Verify your MTII applicant account"
      );
    });

    it("explains that verification is required before login", () => {
      const email =
        buildApplicantVerificationEmail({
          firstName: "Amina",
          verificationUrl:
            "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123",
        });

      expect(
        email.text
      ).toContain(
        "verify your email address before you can log in"
      );
    });

    it("escapes applicant-controlled content in the HTML email", () => {
      const email =
        buildApplicantVerificationEmail({
          firstName:
            '<script>alert("xss")</script>',
          verificationUrl:
            "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123&next=<script>",
        });

      expect(
        email.html
      ).not.toContain(
        "<script>"
      );

      expect(
        email.html
      ).toContain(
        "&lt;script&gt;"
      );

      expect(
        email.html
      ).toContain(
        "&amp;"
      );
    });

    it("does not expose the raw verification token outside the verification URL", () => {
      const verificationUrl =
        "https://api.mtiinasarawa.com.ng/api/applicant/auth/verify-email?token=abc123";

      const email =
        buildApplicantVerificationEmail({
          firstName: "Amina",
          verificationUrl,
        });

      expect(
        email.text.match(
          /abc123/g
        )
      ).toHaveLength(
        1
      );

      expect(
        email.html.match(
          /abc123/g
        )
      ).toHaveLength(
        1
      );
    });
  }
);