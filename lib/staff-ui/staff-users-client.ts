export type StaffUserDepartment = {
  publicId: string;
  code: string;
  name: string;
};

export type StaffUser = {
  publicId: string;
  department:
    StaffUserDepartment | null;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLoginAt:
    string | null;
  passwordChangedAt:
    string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
};

export type CreateStaffUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentPublicId:
    string | null;
};

export type UpdateStaffUserInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentPublicId?:
    string | null;
  isActive?: boolean;
};

type StaffUsersResponse = {
  users: StaffUser[];
};

type StaffUserResponse = {
  user: StaffUser;
};

type ApiErrorResponse = {
  error?: string;
};

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

export async function getStaffUsers(): Promise<
  StaffUser[]
> {
  const response = await fetch(
    "/api/staff/users",
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to load staff users."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffUsersResponse;

  return body.users;
}

export async function createStaffUser(
  input: CreateStaffUserInput
): Promise<StaffUser> {
  const response = await fetch(
    "/api/staff/users",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        input
      ),
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to create staff user."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffUserResponse;

  return body.user;
}

export async function updateStaffUser(
  publicId: string,
  input: UpdateStaffUserInput
): Promise<StaffUser> {
  const response = await fetch(
    `/api/staff/users/${publicId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        input
      ),
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to update staff user."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffUserResponse;

  return body.user;
}