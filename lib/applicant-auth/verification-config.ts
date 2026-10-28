export type ApplicantVerificationConfig = {
  ttlHours: number;
};

type ApplicantVerificationEnvironment =
  Record<
    string,
    string | undefined
  > & {
    APPLICANT_VERIFICATION_TTL_HOURS?: string;
  };

const DEFAULT_TTL_HOURS = 24;

const MIN_TTL_HOURS = 1;

const MAX_TTL_HOURS = 48;

export function getApplicantVerificationConfig(
  env: ApplicantVerificationEnvironment =
    process.env
): ApplicantVerificationConfig {
  const ttlHours = Number(
    env.APPLICANT_VERIFICATION_TTL_HOURS ??
      DEFAULT_TTL_HOURS
  );

  if (
    !Number.isInteger(ttlHours) ||
    ttlHours < MIN_TTL_HOURS ||
    ttlHours > MAX_TTL_HOURS
  ) {
    throw new Error(
      "APPLICANT_VERIFICATION_TTL_HOURS must be an integer between 1 and 48"
    );
  }

  return {
    ttlHours,
  };
}

export function getApplicantVerificationExpiresAt(
  now: Date,
  ttlHours: number
): Date {
  return new Date(
    now.getTime() +
      ttlHours *
        60 *
        60 *
        1000
  );
}