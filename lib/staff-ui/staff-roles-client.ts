export type StaffRole = {
  publicId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StaffRolesResponse = {
  roles: StaffRole[];
};

type StaffRoleResponse = {
  role: StaffRole;
};

type ApiErrorResponse = {
  error?: string;
};

async function readApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data =
      (await response.json()) as
        ApiErrorResponse;

    if (
      typeof data.error ===
        "string" &&
      data.error.trim()
    ) {
      return data.error;
    }
  } catch {
    // Use the safe fallback below.
  }

  return fallbackMessage;
}

export async function getStaffRoles(): Promise<
  StaffRole[]
> {
  const response =
    await fetch(
      "/api/staff/roles",
      {
        method: "GET",
      }
    );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to load staff roles."
      );

    throw new Error(
      message
    );
  }

  const data =
    (await response.json()) as
      StaffRolesResponse;

  return data.roles;
}

export async function assignStaffRole(
  userPublicId: string,
  rolePublicId: string
): Promise<StaffRole> {
  const response =
    await fetch(
      `/api/staff/users/${userPublicId}/roles`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          rolePublicId,
        }),
      }
    );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to assign staff role."
      );

    throw new Error(
      message
    );
  }

  const data =
    (await response.json()) as
      StaffRoleResponse;

  return data.role;
}

export async function removeStaffRole(
  userPublicId: string,
  rolePublicId: string
): Promise<StaffRole> {
  const response =
    await fetch(
      `/api/staff/users/${userPublicId}/roles/${rolePublicId}`,
      {
        method: "DELETE",
      }
    );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to remove staff role."
      );

    throw new Error(
      message
    );
  }

  const data =
    (await response.json()) as
      StaffRoleResponse;

  return data.role;
}