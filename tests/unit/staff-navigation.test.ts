import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getStaffNavigation,
} from "@/lib/staff-ui/navigation";

describe(
  "staff navigation",
  () => {
    it("always includes the dashboard for authenticated staff", () => {
      const navigation =
        getStaffNavigation([]);

      expect(navigation).toContainEqual({
        label: "Dashboard",
        href: "/staff/dashboard",
      });
    });

    it("includes departments when the user can view departments", () => {
      const navigation =
        getStaffNavigation([
          "DEPARTMENT_VIEW",
        ]);

      expect(navigation).toContainEqual({
        label: "Departments",
        href: "/staff/departments",
      });
    });

    it("includes users when the user can view staff accounts", () => {
      const navigation =
        getStaffNavigation([
          "USER_VIEW",
        ]);

      expect(navigation).toContainEqual({
        label: "Staff Users",
        href: "/staff/users",
      });
    });

    it("includes audit logs only when the user has AUDIT_VIEW", () => {
      const allowed =
        getStaffNavigation([
          "AUDIT_VIEW",
        ]);

      const denied =
        getStaffNavigation([]);

      expect(allowed).toContainEqual({
        label: "Audit Logs",
        href: "/staff/audit-logs",
      });

      expect(denied).not.toContainEqual({
        label: "Audit Logs",
        href: "/staff/audit-logs",
      });
    });

    it("does not expose unauthorized navigation items", () => {
      const navigation =
        getStaffNavigation([]);

      expect(navigation).toEqual([
        {
          label: "Dashboard",
          href: "/staff/dashboard",
        },
      ]);
    });

    it("returns all Phase 1 navigation items when all required permissions are present", () => {
      const navigation =
        getStaffNavigation([
          "DEPARTMENT_VIEW",
          "USER_VIEW",
          "AUDIT_VIEW",
        ]);

      expect(navigation).toEqual([
        {
          label: "Dashboard",
          href: "/staff/dashboard",
        },
        {
          label: "Departments",
          href: "/staff/departments",
        },
        {
          label: "Staff Users",
          href: "/staff/users",
        },
        {
          label: "Audit Logs",
          href: "/staff/audit-logs",
        },
      ]);
    });
  }
);