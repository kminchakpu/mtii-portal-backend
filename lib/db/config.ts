export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function getRequiredEnv(
  env: NodeJS.ProcessEnv,
  name: string
): string {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing required database environment variable: ${name}`
    );
  }

  return value;
}

export function getDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env
): DatabaseConfig {
  const port = Number(env.DB_PORT ?? "3306");

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("DB_PORT must be a valid positive integer");
  }

  return {
    host: getRequiredEnv(env, "DB_HOST"),
    port,
    user: getRequiredEnv(env, "DB_USER"),
    password: getRequiredEnv(env, "DB_PASSWORD"),
    database: getRequiredEnv(env, "DB_NAME"),
  };
}