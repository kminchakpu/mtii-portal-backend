import type {
  Metadata,
} from "next";
import StaffUsersPanel from "@/components/staff/StaffUsersPanel";
import {
  requireCurrentStaff,
} from "@/lib/staff-ui/staff-access";
import {
  requireStaffPagePermission,
} from "@/lib/staff-ui/staff-page-access";
import {
  createStaffServerRequest,
} from "@/lib/staff-ui/staff-server-request";

export const metadata: Metadata = {
  title:
    "Staff Users | MTII Staff Portal",
  description:
    "View MTII staff accounts.",
};

export default async function StaffUsersPage() {
  const request =
    await createStaffServerRequest(
      "/staff/users"
    );

  const staff =
    await requireCurrentStaff(
      request
    );

  requireStaffPagePermission(
    staff,
    "USER_VIEW"
  );

  const canManage =
    staff.permissions.includes(
      "USER_MANAGE"
    );

  const canViewRoles =
    staff.permissions.includes(
      "ROLE_VIEW"
    );

  const canAssignRoles =
    staff.permissions.includes(
      "ROLE_ASSIGN"
    );

  return (
    <StaffUsersPanel
      canManage={canManage}
      canViewRoles={
        canViewRoles
      }
      canAssignRoles={
        canAssignRoles
      }
    />
  );
}