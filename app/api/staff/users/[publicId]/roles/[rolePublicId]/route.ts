import { NextResponse } from "next/server";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  enforceStaffRequestOrigin,
  StaffCrossSiteRequestError,
} from "@/lib/http/staff-request-security";
import {
  removeRoleFromStaffUser,
} from "@/lib/staff/staff-role-service";
import {
  StaffRoleNotAssignedError,
  StaffRoleNotFoundError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";
import type {
  StaffRole,
} from "@/lib/staff/staff-role-repository";

type RouteContext = {
  params: Promise<{
    publicId: string;
    rolePublicId: string;
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

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    enforceStaffRequestOrigin(
      request
    );

    const authorization =
      await getRequestAuthorization(
        request
      );

    const {
      publicId,
      rolePublicId,
    } = await context.params;

    const role =
      await removeRoleFromStaffUser(
        authorization,
        publicId,
        rolePublicId
      );

    return NextResponse.json(
      {
        role:
          serializeStaffRole(
            role
          ),
      },
      {
        status: 200,
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
      StaffRoleNotAssignedError
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