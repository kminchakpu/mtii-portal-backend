import type {
  AuthorizationContext,
} from "./authorization";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "./authorization";
import {
  ForbiddenError,
} from "./errors";

export function requirePermission(
  context: AuthorizationContext,
  permission: string
): void {
  if (
    !hasPermission(
      context,
      permission
    )
  ) {
    throw new ForbiddenError();
  }
}

export function requireAnyPermission(
  context: AuthorizationContext,
  permissions: string[]
): void {
  if (
    !hasAnyPermission(
      context,
      permissions
    )
  ) {
    throw new ForbiddenError();
  }
}

export function requireAllPermissions(
  context: AuthorizationContext,
  permissions: string[]
): void {
  if (
    !hasAllPermissions(
      context,
      permissions
    )
  ) {
    throw new ForbiddenError();
  }
}