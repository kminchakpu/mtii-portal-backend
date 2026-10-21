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
  listStaffRoles,
  type StaffRole,
} from "@/lib/staff/staff-role-repository";

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
  request: Request
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

    const roles =
      await listStaffRoles();

    return NextResponse.json({
      roles:
        roles.map(
          serializeStaffRole
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