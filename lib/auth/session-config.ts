export type SessionConfig = {
  cookieName: string;
  ttlHours: number;
};

type SessionEnvironment = Record<string, string | undefined> & {
  SESSION_COOKIE_NAME?: string;
  SESSION_TTL_HOURS?: string;
};

const DEFAULT_COOKIE_NAME = "mtii_staff_session";
const DEFAULT_TTL_HOURS = 8;

export function getSessionConfig(
  env: SessionEnvironment = process.env
): SessionConfig {
  const cookieName =
    env.SESSION_COOKIE_NAME?.trim() ||
    DEFAULT_COOKIE_NAME;

  const ttlHours = Number(
    env.SESSION_TTL_HOURS ?? DEFAULT_TTL_HOURS
  );

  if (
    !Number.isInteger(ttlHours) ||
    ttlHours <= 0
  ) {
    throw new Error(
      "SESSION_TTL_HOURS must be a positive integer"
    );
  }

  return {
    cookieName,
    ttlHours,
  };
}

export function getSessionExpiresAt(
  now: Date,
  ttlHours: number
): Date {
  return new Date(
    now.getTime() + ttlHours * 60 * 60 * 1000
  );
}