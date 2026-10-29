import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getApplicantSessionConfig,
  getApplicantSessionExpiresAt,
} from "../../lib/applicant-auth/applicant-session-config";

import {
  generateApplicantSessionToken,
  hashApplicantSessionToken,
} from "../../lib/applicant-auth/applicant-session-token";

describe(
  "applicant session configuration",
  () => {
    it(
      "uses a dedicated applicant cookie name by default",
      () => {
        const config =
          getApplicantSessionConfig(
            {}
          );

        expect(
          config.cookieName
        ).toBe(
          "mtii_applicant_session"
        );

        expect(
          config.cookieName
        ).not.toBe(
          "mtii_staff_session"
        );
      }
    );

    it(
      "uses a seven-day applicant session by default",
      () => {
        const config =
          getApplicantSessionConfig(
            {}
          );

        expect(
          config.ttlDays
        ).toBe(7);
      }
    );

    it(
      "allows a dedicated applicant cookie name from the environment",
      () => {
        const config =
          getApplicantSessionConfig(
            {
              APPLICANT_SESSION_COOKIE_NAME:
                "custom_applicant_session",
            }
          );

        expect(
          config.cookieName
        ).toBe(
          "custom_applicant_session"
        );
      }
    );

    it(
      "allows applicant session lifetime to be configured in whole days",
      () => {
        const config =
          getApplicantSessionConfig(
            {
              APPLICANT_SESSION_TTL_DAYS:
                "14",
            }
          );

        expect(
          config.ttlDays
        ).toBe(14);
      }
    );

    it.each([
      "0",
      "-1",
      "1.5",
      "abc",
      "31",
    ])(
      "rejects invalid applicant session TTL value %s",
      (value) => {
        expect(
          () =>
            getApplicantSessionConfig(
              {
                APPLICANT_SESSION_TTL_DAYS:
                  value,
              }
            )
        ).toThrow(
          "APPLICANT_SESSION_TTL_DAYS must be an integer between 1 and 30"
        );
      }
    );

    it(
      "calculates applicant session expiration from the configured number of days",
      () => {
        const now =
          new Date(
            "2026-10-29T12:00:00.000Z"
          );

        const expiresAt =
          getApplicantSessionExpiresAt(
            now,
            7
          );

        expect(
          expiresAt.toISOString()
        ).toBe(
          "2026-11-05T12:00:00.000Z"
        );
      }
    );
  }
);

describe(
  "applicant session token security",
  () => {
    it(
      "generates opaque applicant session tokens with strong randomness",
      () => {
        const token =
          generateApplicantSessionToken();

        expect(
          typeof token
        ).toBe("string");

        expect(
          token.length
        ).toBeGreaterThanOrEqual(
          40
        );

        expect(
          token
        ).toMatch(
          /^[A-Za-z0-9_-]+$/
        );
      }
    );

    it(
      "generates a different applicant session token each time",
      () => {
        const tokens =
          new Set(
            Array.from(
              {
                length: 20,
              },
              () =>
                generateApplicantSessionToken()
            )
          );

        expect(
          tokens.size
        ).toBe(20);
      }
    );

    it(
      "hashes applicant session tokens with SHA-256",
      () => {
        const hash =
          hashApplicantSessionToken(
            "applicant-session-token"
          );

        expect(hash).toMatch(
          /^[a-f0-9]{64}$/
        );
      }
    );

    it(
      "produces deterministic hashes for the same token",
      () => {
        const token =
          "same-applicant-session-token";

        expect(
          hashApplicantSessionToken(
            token
          )
        ).toBe(
          hashApplicantSessionToken(
            token
          )
        );
      }
    );

    it(
      "produces different hashes for different tokens",
      () => {
        expect(
          hashApplicantSessionToken(
            "applicant-token-one"
          )
        ).not.toBe(
          hashApplicantSessionToken(
            "applicant-token-two"
          )
        );
      }
    );

    it(
      "does not return the raw applicant token as its stored hash",
      () => {
        const token =
          generateApplicantSessionToken();

        expect(
          hashApplicantSessionToken(
            token
          )
        ).not.toBe(token);
      }
    );
  }
);