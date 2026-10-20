import type {
  AuthorizationContext,
} from "./authorization";

export function isSuperAdmin(
  context: AuthorizationContext
): boolean {
  return context.roles.includes(
    "SUPER_ADMIN"
  );
}

export function canAccessDepartment(
  context: AuthorizationContext,
  departmentId: number
): boolean {
  if (isSuperAdmin(context)) {
    return true;
  }

  if (context.departmentId === null) {
    return false;
  }

  return (
    context.departmentId === departmentId
  );
}