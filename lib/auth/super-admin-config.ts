export type SuperAdminConfig = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

function required(
  env: NodeJS.ProcessEnv,
  name: string
): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required Super Admin environment variable: ${name}`
    );
  }

  return value;
}

export function getSuperAdminConfig(
  env: NodeJS.ProcessEnv = process.env
): SuperAdminConfig {
  const firstName = required(
    env,
    "SUPER_ADMIN_FIRST_NAME"
  );
  const lastName = required(
    env,
    "SUPER_ADMIN_LAST_NAME"
  );
  const email = required(
    env,
    "SUPER_ADMIN_EMAIL"
  ).toLowerCase();
  const password = required(
    env,
    "SUPER_ADMIN_PASSWORD"
  );

  if (!email.includes("@")) {
    throw new Error(
      "SUPER_ADMIN_EMAIL must be a valid email address"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "SUPER_ADMIN_PASSWORD must be at least 12 characters"
    );
  }

  return {
    firstName,
    lastName,
    email,
    password,
  };
}