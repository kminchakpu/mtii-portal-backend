import type {
  AuthorizationContext,
} from "./authorization";
import {
  canAccessDepartment,
} from "./department-scope";
import {
  ForbiddenError,
} from "./errors";

export function requireDepartmentAccess(
  context: AuthorizationContext,
  departmentId: number
): void {
  if (
    !canAccessDepartment(
      context,
      departmentId
    )
  ) {
    throw new ForbiddenError(
      "You do not have access to this department."
    );
  }
}