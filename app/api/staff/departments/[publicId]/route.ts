import { NextResponse } from "next/server";
import {
  findDepartmentByPublicId,
  updateDepartment,
  type Department,
} from "@/lib/departments/department-repository";
import {
  updateDepartmentSchema,
} from "@/lib/departments/department-validation";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  requireDepartmentAccess,
} from "@/lib/rbac/department-guard";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  revokeSessionsForDepartment,
} from "@/lib/auth/session-repository";
import {
  writeAuditLog,
} from "@/lib/audit/logger";
import {
  withTransaction,
} from "@/lib/db/transaction";

type RouteContext = {
  params: Promise<{
    publicId: string;
  }>;
};

function toDepartmentResponse(
  department: Department
) {
  return {
    publicId:
      department.publicId,
    code:
      department.code,
    name:
      department.name,
    description:
      department.description,
    isActive:
      department.isActive,
    createdAt:
      department.createdAt,
    updatedAt:
      department.updatedAt,
  };
}

function toDepartmentAuditValues(
  department: Department
) {
  return {
    publicId:
      department.publicId,
    code:
      department.code,
    name:
      department.name,
    description:
      department.description,
    isActive:
      department.isActive,
  };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const authorization =
      await getRequestAuthorization(
        request
      );

    requirePermission(
      authorization,
      "DEPARTMENT_VIEW"
    );

    const {
      publicId,
    } = await context.params;

    const department =
      await findDepartmentByPublicId(
        publicId
      );

    if (!department) {
      return NextResponse.json(
        {
          error:
            "Department not found.",
        },
        {
          status: 404,
        }
      );
    }

    requireDepartmentAccess(
      authorization,
      department.id
    );

    return NextResponse.json(
      {
        department:
          toDepartmentResponse(
            department
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    const response =
      handleAuthorizationError(
        error
      );

    if (response) {
      return response;
    }

    throw error;
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authorization =
      await getRequestAuthorization(
        request
      );

    requirePermission(
      authorization,
      "DEPARTMENT_MANAGE"
    );

    let requestBody: unknown;

    try {
      requestBody =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const validationResult =
      updateDepartmentSchema.safeParse(
        requestBody
      );

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid department data.",
          details:
            validationResult.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      publicId,
    } = await context.params;

    const result =
      await withTransaction(
        async (
          connection
        ) => {
          const existingDepartment =
            await findDepartmentByPublicId(
              publicId,
              connection
            );

          if (
            !existingDepartment
          ) {
            return null;
          }

          requireDepartmentAccess(
            authorization,
            existingDepartment.id
          );

          const updatedDepartment =
            await updateDepartment(
              existingDepartment.id,
              validationResult.data,
              connection
            );

          if (
            !updatedDepartment
          ) {
            return null;
          }

          const wasDeactivated =
            existingDepartment.isActive &&
            !updatedDepartment.isActive;

          if (wasDeactivated) {
            await revokeSessionsForDepartment(
              existingDepartment.id,
              connection
            );
          }

          await writeAuditLog(
            {
              actorUserId:
                authorization.userId,
              departmentId:
                existingDepartment.id,
              action:
                "DEPARTMENT_UPDATED",
              entityType:
                "DEPARTMENT",
              entityId:
                existingDepartment.publicId,
              previousValues:
                toDepartmentAuditValues(
                  existingDepartment
                ),
              newValues:
                toDepartmentAuditValues(
                  updatedDepartment
                ),
            },
            connection
          );

          return updatedDepartment;
        }
      );

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Department not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        department:
          toDepartmentResponse(
            result
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    const response =
      handleAuthorizationError(
        error
      );

    if (response) {
      return response;
    }

    throw error;
  }
}