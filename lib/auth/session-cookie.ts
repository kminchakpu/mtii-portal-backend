export type AppEnvironment =
  | "development"
  | "production"
  | "test";

export function getSessionCookieOptions(
  expiresAt: Date,
  environment: AppEnvironment
) {
  return {
    httpOnly: true,
    secure: environment !== "development",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}