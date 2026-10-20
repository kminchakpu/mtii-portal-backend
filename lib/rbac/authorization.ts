export type AuthorizationContext = {
  userId: number;
  publicId: string;
  departmentId: number | null;
  departmentCode: string | null;
  roles: string[];
  permissions: string[];
};

export function hasRole(
  context: AuthorizationContext,
  role: string
): boolean {
  return context.roles.includes(role);
}

export function hasPermission(
  context: AuthorizationContext,
  permission: string
): boolean {
  return context.permissions.includes(
    permission
  );
}

export function hasAnyPermission(
  context: AuthorizationContext,
  permissions: string[]
): boolean {
  return permissions.some((permission) =>
    context.permissions.includes(
      permission
    )
  );
}

export function hasAllPermissions(
  context: AuthorizationContext,
  permissions: string[]
): boolean {
  return permissions.every((permission) =>
    context.permissions.includes(
      permission
    )
  );
}