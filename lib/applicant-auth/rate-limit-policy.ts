import type {
  ApplicantAuthRateLimitAction,
} from "@/lib/applicant-auth/rate-limit-repository";
import type {
  ApplicantAuthRateLimitPolicy,
} from "@/lib/applicant-auth/rate-limit-service";

const REGISTRATION_POLICY:
  ApplicantAuthRateLimitPolicy = {
    windowMinutes: 15,
    maxRequests: 5,
    blockDurationMinutes: 15,
  };

const RESEND_VERIFICATION_POLICY:
  ApplicantAuthRateLimitPolicy = {
    windowMinutes: 30,
    maxRequests: 3,
    blockDurationMinutes: 30,
  };

export function getApplicantAuthRateLimitPolicy(
  action:
    ApplicantAuthRateLimitAction
): ApplicantAuthRateLimitPolicy {
  switch (action) {
    case "registration":
      return {
        ...REGISTRATION_POLICY,
      };

    case "resend_verification":
      return {
        ...RESEND_VERIFICATION_POLICY,
      };
  }
}