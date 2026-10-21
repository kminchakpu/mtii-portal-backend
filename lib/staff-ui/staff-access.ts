import {
  getCurrentStaff,
} from "@/lib/staff-ui/current-staff";
import type {
  CurrentStaff,
} from "@/lib/staff-ui/current-staff";
import {
  UnauthenticatedError,
} from "@/lib/rbac/errors";

export async function requireCurrentStaff(
  request: Request
): Promise<CurrentStaff> {
  const staff =
    await getCurrentStaff(
      request
    );

  if (!staff) {
    throw new UnauthenticatedError();
  }

  return staff;
}