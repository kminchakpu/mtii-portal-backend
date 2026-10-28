export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

type EmailEnvironment =
  Record<
    string,
    string | undefined
  > & {
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    SMTP_FROM_EMAIL?: string;
    SMTP_FROM_NAME?: string;
  };

function requireTrimmedValue(
  value: string | undefined,
  variableName: string
): string {
  const normalized =
    value?.trim();

  if (!normalized) {
    throw new Error(
      `${variableName} is required`
    );
  }

  return normalized;
}

function requireSecret(
  value: string | undefined,
  variableName: string
): string {
  if (
    value === undefined ||
    value.length === 0
  ) {
    throw new Error(
      `${variableName} is required`
    );
  }

  return value;
}

function parsePort(
  value: string | undefined
): number {
  const normalized =
    value?.trim();

  if (!normalized) {
    throw new Error(
      "SMTP_PORT must be an integer between 1 and 65535"
    );
  }

  const port =
    Number(normalized);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      "SMTP_PORT must be an integer between 1 and 65535"
    );
  }

  return port;
}

function parseSecure(
  value: string | undefined
): boolean {
  const normalized =
    value?.trim().toLowerCase();

  if (
    normalized !== "true" &&
    normalized !== "false"
  ) {
    throw new Error(
      "SMTP_SECURE must be true or false"
    );
  }

  return normalized === "true";
}

function validateEmail(
  value: string | undefined
): string {
  const email =
    requireTrimmedValue(
      value,
      "SMTP_FROM_EMAIL"
    );

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(email)
  ) {
    throw new Error(
      "SMTP_FROM_EMAIL must be a valid email address"
    );
  }

  return email;
}

export function getEmailConfig(
  env: EmailEnvironment =
    process.env
): EmailConfig {
  return {
    host:
      requireTrimmedValue(
        env.SMTP_HOST,
        "SMTP_HOST"
      ),
    port:
      parsePort(
        env.SMTP_PORT
      ),
    secure:
      parseSecure(
        env.SMTP_SECURE
      ),
    user:
      requireTrimmedValue(
        env.SMTP_USER,
        "SMTP_USER"
      ),
    password:
      requireSecret(
        env.SMTP_PASSWORD,
        "SMTP_PASSWORD"
      ),
    fromEmail:
      validateEmail(
        env.SMTP_FROM_EMAIL
      ),
    fromName:
      requireTrimmedValue(
        env.SMTP_FROM_NAME,
        "SMTP_FROM_NAME"
      ),
  };
}