import type {
  Metadata,
} from "next";
import StaffDepartmentsPanel from "@/components/staff/StaffDepartmentsPanel";
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
    "Departments | MTII Staff Portal",
  description:
    "View MTII ministry departments.",
};

export default async function StaffDepartmentsPage() {
  const request =
    await createStaffServerRequest(
      "/staff/departments"
    );

  const staff =
    await requireCurrentStaff(
      request
    );

  requireStaffPagePermission(
    staff,
    "DEPARTMENT_VIEW"
  );

  const canManage =
    staff.permissions.includes(
      "DEPARTMENT_MANAGE"
    );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b77900]">
          Ministry Administration
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071d2b]">
          Departments
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          View the ministry
          departments configured for
          staff administration and
          operational workflows.
        </p>
      </section>

      <StaffDepartmentsPanel
        canManage={
          canManage
        }
      />
    </div>
  );
}