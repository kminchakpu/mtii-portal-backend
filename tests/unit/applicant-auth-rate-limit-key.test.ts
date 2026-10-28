import {
  createHash,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createApplicantAuthEmailRateLimitKey,
  createApplicantAuthIpRateLimitKey,
  getApplicantAuthClientIp,
} from "@/lib/applicant-auth/rate-limit-key";

describe(
  "applicant auth rate limit key",
  () => {
    it("uses x-real-ip as the client IP", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                "203.0.113.10",
            },
          }
        );

      expect(
        getApplicantAuthClientIp(
          request
        )
      ).toBe(
        "203.0.113.10"
      );
    });

    it("trims the client IP", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                " 203.0.113.10 ",
            },
          }
        );

      expect(
        getApplicantAuthClientIp(
          request
        )
      ).toBe(
        "203.0.113.10"
      );
    });

    it("uses an unknown client marker when x-real-ip is missing", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register"
        );

      expect(
        getApplicantAuthClientIp(
          request
        )
      ).toBe(
        "unknown"
      );
    });

    it("uses an unknown client marker when x-real-ip is blank", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip": "   ",
            },
          }
        );

      expect(
        getApplicantAuthClientIp(
          request
        )
      ).toBe(
        "unknown"
      );
    });

    it("creates a SHA-256 IP rate-limit key without exposing the raw IP", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                "203.0.113.10",
            },
          }
        );

      const expected =
        createHash(
          "sha256"
        )
          .update(
            "ip|203.0.113.10"
          )
          .digest(
            "hex"
          );

      const key =
        createApplicantAuthIpRateLimitKey(
          request
        );

      expect(
        key
      ).toBe(
        expected
      );

      expect(
        key
      ).toHaveLength(
        64
      );

      expect(
        key
      ).not.toContain(
        "203.0.113.10"
      );
    });

    it("creates the same IP key for equivalent trimmed IP values", () => {
      const firstRequest =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                "203.0.113.10",
            },
          }
        );

      const secondRequest =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                " 203.0.113.10 ",
            },
          }
        );

      expect(
        createApplicantAuthIpRateLimitKey(
          firstRequest
        )
      ).toBe(
        createApplicantAuthIpRateLimitKey(
          secondRequest
        )
      );
    });

    it("creates a normalized SHA-256 email rate-limit key", () => {
      const expected =
        createHash(
          "sha256"
        )
          .update(
            "email|amina@example.com"
          )
          .digest(
            "hex"
          );

      const key =
        createApplicantAuthEmailRateLimitKey(
          "  Amina@Example.COM  "
        );

      expect(
        key
      ).toBe(
        expected
      );

      expect(
        key
      ).toHaveLength(
        64
      );

      expect(
        key
      ).not.toContain(
        "amina@example.com"
      );
    });

    it("creates the same email key regardless of case and surrounding whitespace", () => {
      const firstKey =
        createApplicantAuthEmailRateLimitKey(
          "Amina@Example.COM"
        );

      const secondKey =
        createApplicantAuthEmailRateLimitKey(
          "  amina@example.com  "
        );

      expect(
        firstKey
      ).toBe(
        secondKey
      );
    });

    it("keeps IP and email key namespaces distinct", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register",
          {
            headers: {
              "x-real-ip":
                "amina@example.com",
            },
          }
        );

      const ipKey =
        createApplicantAuthIpRateLimitKey(
          request
        );

      const emailKey =
        createApplicantAuthEmailRateLimitKey(
          "amina@example.com"
        );

      expect(
        ipKey
      ).not.toBe(
        emailKey
      );
    });

    it("creates a stable SHA-256 key for an unknown client", () => {
      const request =
        new Request(
          "https://api.mtiinasarawa.com.ng/api/applicant/auth/register"
        );

      const expected =
        createHash(
          "sha256"
        )
          .update(
            "ip|unknown"
          )
          .digest(
            "hex"
          );

      expect(
        createApplicantAuthIpRateLimitKey(
          request
        )
      ).toBe(
        expected
      );
    });
  }
);