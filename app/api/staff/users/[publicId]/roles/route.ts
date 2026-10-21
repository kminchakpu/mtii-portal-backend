import { NextResponse } from "next/server";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  assignStaffRoleSchema,
} from "@/lib/staff/staff-role-validation";
import {
  assignRoleToStaffUser,
} from "@/lib/staff/staff-role-service";
import {
  StaffRoleAlreadyAssignedError,
  StaffRoleInactiveError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";
import type {
  StaffRole,
} from "@/lib/staff/staff-role-repository";

type RouteContext = {
  params: Promise<{
    publicId: string;
  }>;
};

function serializeStaffRole(
  role: StaffRole
) {
  return {
    publicId: role.publicId,
    code: role.code,
    name: role.name,
    description:
      role.description,
    isActive: role.isActive,
    createdAt:
      role.createdAt.toISOString(),
    updatedAt:
      role.updatedAt.toISOString(),
  };
}

export async function POST(
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
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const validationResult =
      assignStaffRoleSchema.safeParse(
        body
      );

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid staff role data.",
          details:
            validationResult.error
              .issues,
        },
        {
          status: 400,
        }
      );
    }

    const { publicId } =
      await context.params;

    const role =
      await assignRoleToStaffUser(
        authorization,
        publicId,
        validationResult.data
          .rolePublicId
      );

    return NextResponse.json(
      {
        role:
          serializeStaffRole(
            role
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
      StaffUserNotFoundError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof
      StaffRoleNotFoundError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof
        StaffRoleInactiveError ||
      error instanceof
        StaffRoleAlreadyAssignedError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 409,
        }
      );
    }

    throw error;
  }
}