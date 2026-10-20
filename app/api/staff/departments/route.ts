import { NextResponse } from "next/server";
import {
  createDepartment,
  listDepartments,
  listDepartmentsById,
  type Department,
} from "@/lib/departments/department-repository";
import {
  createDepartmentSchema,
} from "@/lib/departments/department-validation";
import {
  DepartmentCodeConflictError,
} from "@/lib/departments/errors";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  isSuperAdmin,
} from "@/lib/rbac/department-scope";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  writeAuditLog,
} from "@/lib/audit/logger";
import {
  withTransaction,
} from "@/lib/db/transaction";

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
  request: Request
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

    let departments: Department[];

    if (
      isSuperAdmin(
        authorization
      )
    ) {
      departments =
        await listDepartments();
    } else if (
      authorization.departmentId !==
      null
    ) {
      departments =
        await listDepartmentsById(
          authorization.departmentId
        );
    } else {
      departments = [];
    }

    return NextResponse.json(
      {
        departments:
          departments.map(
            toDepartmentResponse
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

export async function POST(
  request: Request
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
      createDepartmentSchema.safeParse(
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

    const department =
      await withTransaction(
        async (
          connection
        ) => {
          const createdDepartment =
            await createDepartment(
              validationResult.data,
              connection
            );

          await writeAuditLog(
            {
              actorUserId:
                authorization.userId,
              departmentId:
                createdDepartment.id,
              action:
                "DEPARTMENT_CREATED",
              entityType:
                "DEPARTMENT",
              entityId:
                createdDepartment.publicId,
              newValues:
                toDepartmentAuditValues(
                  createdDepartment
                ),
            },
            connection
          );

          return createdDepartment;
        }
      );

    return NextResponse.json(
      {
        department:
          toDepartmentResponse(
            department
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const authorizationResponse =
      handleAuthorizationError(
        error
      );

    if (
      authorizationResponse
    ) {
      return authorizationResponse;
    }

    if (
      error instanceof
      DepartmentCodeConflictError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 409,
        }
      );
    }

    throw error;
  }
}