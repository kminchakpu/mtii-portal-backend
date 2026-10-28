import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getApplicantAuthRateLimitPolicy,
} from "@/lib/applicant-auth/rate-limit-policy";

describe(
  "applicant auth rate limit policy",
  () => {
    it("returns the registration rate-limit policy", () => {
      const policy =
        getApplicantAuthRateLimitPolicy(
          "registration"
        );

      expect(policy).toEqual({
        windowMinutes: 15,
        maxRequests: 5,
        blockDurationMinutes: 15,
      });
    });

    it("returns the resend verification rate-limit policy", () => {
      const policy =
        getApplicantAuthRateLimitPolicy(
          "resend_verification"
        );

      expect(policy).toEqual({
        windowMinutes: 30,
        maxRequests: 3,
        blockDurationMinutes: 30,
      });
    });

    it("returns a new policy object instead of exposing shared mutable state", () => {
      const firstPolicy =
        getApplicantAuthRateLimitPolicy(
          "registration"
        );

      const secondPolicy =
        getApplicantAuthRateLimitPolicy(
          "registration"
        );

      expect(
        firstPolicy
      ).not.toBe(
        secondPolicy
      );

      expect(
        firstPolicy
      ).toEqual(
        secondPolicy
      );
    });

    it("keeps registration and resend verification policies independent", () => {
      const registrationPolicy =
        getApplicantAuthRateLimitPolicy(
          "registration"
        );

      const resendPolicy =
        getApplicantAuthRateLimitPolicy(
          "resend_verification"
        );

      expect(
        registrationPolicy
      ).not.toEqual(
        resendPolicy
      );

      expect(
        registrationPolicy.maxRequests
      ).toBe(5);

      expect(
        resendPolicy.maxRequests
      ).toBe(3);
    });

    it("returns positive policy values", () => {
      const actions = [
        "registration",
        "resend_verification",
      ] as const;

      for (
        const action of actions
      ) {
        const policy =
          getApplicantAuthRateLimitPolicy(
            action
          );

        expect(
          policy.windowMinutes
        ).toBeGreaterThan(0);

        expect(
          policy.maxRequests
        ).toBeGreaterThan(0);

        expect(
          policy.blockDurationMinutes
        ).toBeGreaterThan(0);
      }
    });
  }
);