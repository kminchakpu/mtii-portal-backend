export type StaffDepartment = {
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type CreateStaffDepartmentInput = {
  code: string;
  name: string;
};

export type UpdateStaffDepartmentInput = {
  name?: string;
  isActive?: boolean;
};

type StaffDepartmentsResponse = {
  departments: StaffDepartment[];
};

type StaffDepartmentResponse = {
  department: StaffDepartment;
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

export async function getStaffDepartments(): Promise<
  StaffDepartment[]
> {
  const response = await fetch(
    "/api/staff/departments",
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to load departments."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffDepartmentsResponse;

  return body.departments;
}

export async function createStaffDepartment(
  input: CreateStaffDepartmentInput
): Promise<StaffDepartment> {
  const response = await fetch(
    "/api/staff/departments",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        code: input.code,
        name: input.name,
      }),
    }
  );

  if (!response.ok) {
    const message =
      await readApiError(
        response,
        "Unable to create department."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffDepartmentResponse;

  return body.department;
}

export async function updateStaffDepartment(
  publicId: string,
  input: UpdateStaffDepartmentInput
): Promise<StaffDepartment> {
  const response = await fetch(
    `/api/staff/departments/${publicId}`,
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
        "Unable to update department."
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as
      StaffDepartmentResponse;

  return body.department;
}