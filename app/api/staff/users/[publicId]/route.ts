import { NextResponse } from "next/server";
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
  isSuperAdmin,
} from "@/lib/rbac/department-scope";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  findStaffUserByPublicId,
  type StaffUser,
} from "@/lib/staff/staff-user-repository";
import {
  updateStaffAccount,
} from "@/lib/staff/staff-user-service";
import {
  updateStaffUserSchema,
} from "@/lib/staff/staff-user-validation";
import {
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
  StaffEmailConflictError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";

type RouteContext = {
  params: Promise<{
    publicId: string;
  }>;
};

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
      "USER_VIEW"
    );

    const { publicId } =
      await context.params;

    const user =
      await findStaffUserByPublicId(
        publicId
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Staff user not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      user.departmentId === null
    ) {
      if (
        !isSuperAdmin(
          authorization
        )
      ) {
        throw new ForbiddenError();
      }
    } else {
      requireDepartmentAccess(
        authorization,
        user.departmentId
      );
    }

    return NextResponse.json({
      user:
        serializeStaffUser(
          user
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
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
            "Invalid JSON body.",
        },
        {
          status: 400,
        }
      );
    }

    const validationResult =
      updateStaffUserSchema.safeParse(
        body
      );

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid staff user data.",
          issues:
            validationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { publicId } =
      await context.params;

    const user =
      await updateStaffAccount(
        authorization,
        publicId,
        validationResult.data
      );

    return NextResponse.json({
      user:
        serializeStaffUser(
          user
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
      StaffUserNotFoundError
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