import { NextResponse } from "next/server";
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
  enforceStaffRequestOrigin,
  StaffCrossSiteRequestError,
} from "@/lib/http/staff-request-security";
import {
  listStaffUsers,
  listStaffUsersByDepartment,
  type StaffUser,
} from "@/lib/staff/staff-user-repository";
import {
  createStaffAccount,
} from "@/lib/staff/staff-user-service";
import {
  createStaffUserSchema,
} from "@/lib/staff/staff-user-validation";
import {
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
  StaffEmailConflictError,
} from "@/lib/staff/errors";

function serializeStaffUser(
  user: StaffUser
) {
  return {
    publicId: user.publicId,
    department:
      user.departmentPublicId &&
      user.departmentCode &&
      user.departmentName
        ? {
            publicId:
              user.departmentPublicId,
            code:
              user.departmentCode,
            name:
              user.departmentName,
          }
        : null,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: user.isActive,
    lastLoginAt:
      user.lastLoginAt?.toISOString() ??
      null,
    passwordChangedAt:
      user.passwordChangedAt?.toISOString() ??
      null,
    createdAt:
      user.createdAt.toISOString(),
    updatedAt:
      user.updatedAt.toISOString(),
    roles: user.roles,
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
      "USER_VIEW"
    );

    let users: StaffUser[];

    if (
      isSuperAdmin(
        authorization
      )
    ) {
      users =
        await listStaffUsers();
    } else if (
      authorization.departmentId !==
      null
    ) {
      users =
        await listStaffUsersByDepartment(
          authorization.departmentId
        );
    } else {
      users = [];
    }

    return NextResponse.json({
      users:
        users.map(
          serializeStaffUser
        ),
    });
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

    throw error;
  }
}

export async function POST(
  request: Request
) {
  try {
    enforceStaffRequestOrigin(
      request
    );

    const authorization =
      await getRequestAuthorization(
        request
      );

    let body: unknown;

    try {
      body =
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
      createStaffUserSchema.safeParse(
        body
      );

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid staff user data.",
          details:
            validationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await createStaffAccount(
        authorization,
        validationResult.data
      );

    return NextResponse.json(
      {
        user:
          serializeStaffUser(
            user
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof
      StaffCrossSiteRequestError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 403,
        }
      );
    }

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
      StaffEmailConflictError
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

    if (
      error instanceof
      StaffDepartmentNotFoundError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof
      StaffDepartmentInactiveError
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