export type AppEnvironment =
  | "development"
  | "production"
  | "test";

type AppUrlEnvironment =
  Record<
    string,
    string | undefined
  > & {
    APP_URL?: string;
  };

const DEFAULT_APP_URL =
  "http://localhost:3000";

export function getAppUrl(
  env: AppUrlEnvironment =
    process.env,
  environment: AppEnvironment =
    process.env.NODE_ENV ===
    "production"
      ? "production"
      : process.env.NODE_ENV ===
          "test"
        ? "test"
        : "development"
): string {
  const configuredUrl =
    env.APP_URL?.trim();

  if (!configuredUrl) {
    if (
      environment ===
      "production"
    ) {
      throw new Error(
        "APP_URL is required in production"
      );
    }

    return DEFAULT_APP_URL;
  }

  let url: URL;

  try {
    url = new URL(
      configuredUrl
    );
  } catch {
    throw new Error(
      "APP_URL must be a valid absolute URL"
    );
  }

  if (
    environment ===
      "production" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      "APP_URL must use HTTPS in production"
    );
  }

  return configuredUrl.replace(
    /\/+$/,
    ""
  );
}