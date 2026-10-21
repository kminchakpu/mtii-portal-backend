import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import type {
  CurrentStaff,
} from "@/lib/staff-ui/current-staff";

export function requireStaffPagePermission(
  staff: CurrentStaff,
  permission: string
): CurrentStaff {
  if (
    !staff.permissions.includes(
      permission
    )
  ) {
    throw new ForbiddenError();
  }

  return staff;
}