export type ApplicantSessionConfig = {
  cookieName: string;
  ttlDays: number;
};

type ApplicantSessionEnvironment =
  Record<
    string,
    string | undefined
  > & {
    APPLICANT_SESSION_COOKIE_NAME?: string;
    APPLICANT_SESSION_TTL_DAYS?: string;
  };

const DEFAULT_COOKIE_NAME =
  "mtii_applicant_session";

const DEFAULT_TTL_DAYS = 7;

const MIN_TTL_DAYS = 1;

const MAX_TTL_DAYS = 30;

export function getApplicantSessionConfig(
  env: ApplicantSessionEnvironment =
    process.env
): ApplicantSessionConfig {
  const cookieName =
    env.APPLICANT_SESSION_COOKIE_NAME?.trim() ||
    DEFAULT_COOKIE_NAME;

  const ttlDays = Number(
    env.APPLICANT_SESSION_TTL_DAYS ??
      DEFAULT_TTL_DAYS
  );

  if (
    !Number.isInteger(ttlDays) ||
    ttlDays < MIN_TTL_DAYS ||
    ttlDays > MAX_TTL_DAYS
  ) {
    throw new Error(
      "APPLICANT_SESSION_TTL_DAYS must be an integer between 1 and 30"
    );
  }

  return {
    cookieName,
    ttlDays,
  };
}

export function getApplicantSessionExpiresAt(
  now: Date,
  ttlDays: number
): Date {
  return new Date(
    now.getTime() +
      ttlDays *
        24 *
        60 *
        60 *
        1000
  );
}