export type StaffNavigationItem = {
  label: string;
  href: string;
};

type PermissionNavigationItem =
  StaffNavigationItem & {
    permission: string;
  };

const dashboardNavigationItem:
  StaffNavigationItem = {
    label: "Dashboard",
    href: "/staff/dashboard",
  };

const permissionNavigationItems:
  PermissionNavigationItem[] = [
    {
      label: "Departments",
      href: "/staff/departments",
      permission:
        "DEPARTMENT_VIEW",
    },
    {
      label: "Staff Users",
      href: "/staff/users",
      permission: "USER_VIEW",
    },
    {
      label: "Audit Logs",
      href: "/staff/audit-logs",
      permission: "AUDIT_VIEW",
    },
  ];

export function getStaffNavigation(
  permissions: string[]
): StaffNavigationItem[] {
  const permissionSet =
    new Set(permissions);

  const authorizedItems =
    permissionNavigationItems
      .filter((item) =>
        permissionSet.has(
          item.permission
        )
      )
      .map(
        ({
          label,
          href,
        }) => ({
          label,
          href,
        })
      );

  return [
    dashboardNavigationItem,
    ...authorizedItems,
  ];
}