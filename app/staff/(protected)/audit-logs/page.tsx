import type {
  Metadata,
} from "next";
import {
  StaffAuditLogsPanel,
} from "@/components/staff/StaffAuditLogsPanel";
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
    "Audit Logs | MTII Staff Portal",
  description:
    "Review MTII staff authentication and administrative audit logs.",
};

export default async function StaffAuditLogsPage() {
  const request =
    await createStaffServerRequest(
      "/staff/audit-logs"
    );

  const staff =
    await requireCurrentStaff(
      request
    );

  requireStaffPagePermission(
    staff,
    "AUDIT_VIEW"
  );

  return (
    <StaffAuditLogsPanel />
  );
}