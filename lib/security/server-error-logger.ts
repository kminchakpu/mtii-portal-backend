export type ServerEnvironment =
  | "development"
  | "production"
  | "test";

function getServerEnvironment(): ServerEnvironment {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return "production";
  }

  if (
    process.env.NODE_ENV ===
    "test"
  ) {
    return "test";
  }

  return "development";
}

export function logServerError(
  message: string,
  error: unknown,
  environment: ServerEnvironment =
    getServerEnvironment()
): void {
  if (
    environment ===
    "production"
  ) {
    console.error(message);
    return;
  }

  console.error(
    message,
    error
  );
}