import { NextResponse } from "next/server";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  findStaffRoleByPublicId,
  type StaffRole,
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
      "ROLE_VIEW"
    );

    const { publicId } =
      await context.params;

    const role =
      await findStaffRoleByPublicId(
        publicId
      );

    if (!role) {
      return NextResponse.json(
        {
          error:
            "Staff role not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      role:
        serializeStaffRole(
          role
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