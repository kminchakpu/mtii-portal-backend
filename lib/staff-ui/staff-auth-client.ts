export type StaffLoginCredentials = {
  email: string;
  password: string;
};

export type StaffLoginUser = {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentCode: string | null;
};

type StaffLoginResponse = {
  user: StaffLoginUser;
};

type ApiErrorResponse = {
  error?: string;
};

export class StaffLoginError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "StaffLoginError";

    this.status = status;
  }
}

async function readApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body =
      (await response.json()) as
        ApiErrorResponse;

    if (
      typeof body.error ===
        "string" &&
      body.error.trim()
    ) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function loginStaff(
  credentials: StaffLoginCredentials
): Promise<StaffLoginUser> {
  const response = await fetch(
    "/api/staff/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        credentials
      ),
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to sign in at this time."
      );

    throw new StaffLoginError(
      message,
      response.status
    );
  }

  const body =
    (await response.json()) as
      StaffLoginResponse;

  return body.user;
}

export async function logoutStaff(): Promise<void> {
  const response = await fetch(
    "/api/staff/auth/logout",
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to sign out at this time."
      );

    throw new Error(message);
  }
}