// @vitest-environment jsdom
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
} from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  createStaffServerRequest:
    vi.fn(),
  requireCurrentStaff:
    vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-server-request",
  () => ({
    createStaffServerRequest:
      mocks.createStaffServerRequest,
  })
);

vi.mock(
  "@/lib/staff-ui/staff-access",
  () => ({
    requireCurrentStaff:
      mocks.requireCurrentStaff,
  })
);

import StaffDashboardPage, {
  metadata,
} from "@/app/staff/(protected)/dashboard/page";

const request =
  new Request(
    "http://localhost:3000/staff/dashboard"
  );

const staff = {
  publicId:
    "11111111-1111-4111-8111-111111111111",
  firstName: "Amina",
  lastName: "Ibrahim",
  email:
    "amina@example.com",
  departmentCode:
    "ADMIN",
  roles: [
    "SUPER_ADMIN",
  ],
  permissions: [
    "DEPARTMENT_VIEW",
    "USER_VIEW",
    "AUDIT_VIEW",
  ],
};

describe(
  "StaffDashboardPage",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.createStaffServerRequest
        .mockResolvedValue(
          request
        );

      mocks.requireCurrentStaff
        .mockResolvedValue(
          staff
        );
    });

    it(
      "uses staff dashboard metadata",
      () => {
        expect(
          metadata.title
        ).toBe(
          "Dashboard | MTII Staff Portal"
        );

        expect(
          metadata.description
        ).toBe(
          "MTII internal staff portal dashboard."
        );
      }
    );

    it(
      "creates a server request for the dashboard",
      async () => {
        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          mocks.createStaffServerRequest
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.createStaffServerRequest
        ).toHaveBeenCalledWith(
          "/staff/dashboard"
        );
      }
    );

    it(
      "resolves the current authenticated staff member",
      async () => {
        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          mocks.requireCurrentStaff
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.requireCurrentStaff
        ).toHaveBeenCalledWith(
          request
        );
      }
    );

    it(
      "renders the staff dashboard heading",
      async () => {
        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Staff Dashboard",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Ministry Operations"
          )
        ).toBeTruthy();
      }
    );

    it(
      "shows all administration areas when staff has all required view permissions",
      async () => {
        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Open Departments/i,
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Open Staff Accounts/i,
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "link",
            {
              name:
                /Open Audit Logs/i,
            }
          )
        ).toBeTruthy();
      }
    );

    it(
      "shows Departments only when staff has DEPARTMENT_VIEW",
      async () => {
        mocks.requireCurrentStaff
          .mockResolvedValue({
            ...staff,
            roles: [
              "DEPARTMENT_ADMIN",
            ],
            permissions: [
              "DEPARTMENT_VIEW",
            ],
          });

        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Departments/i,
            }
          )
        ).toBeTruthy();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Staff Accounts/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Audit Logs/i,
            }
          )
        ).toBeNull();
      }
    );

    it(
      "shows Staff Accounts only when staff has USER_VIEW",
      async () => {
        mocks.requireCurrentStaff
          .mockResolvedValue({
            ...staff,
            roles: [
              "DEPARTMENT_ADMIN",
            ],
            permissions: [
              "USER_VIEW",
            ],
          });

        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Departments/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Staff Accounts/i,
            }
          )
        ).toBeTruthy();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Audit Logs/i,
            }
          )
        ).toBeNull();
      }
    );

    it(
      "shows Audit Logs only when staff has AUDIT_VIEW",
      async () => {
        mocks.requireCurrentStaff
          .mockResolvedValue({
            ...staff,
            roles: [
              "AUDITOR",
            ],
            permissions: [
              "AUDIT_VIEW",
            ],
          });

        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Departments/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Staff Accounts/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Audit Logs/i,
            }
          )
        ).toBeTruthy();
      }
    );

    it(
      "shows no administration links when staff has none of the required view permissions",
      async () => {
        mocks.requireCurrentStaff
          .mockResolvedValue({
            ...staff,
            roles: [
              "REVIEW_OFFICER",
            ],
            permissions: [
              "APPLICATION_VIEW",
            ],
          });

        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Departments/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Staff Accounts/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "link",
            {
              name:
                /Open Audit Logs/i,
            }
          )
        ).toBeNull();

        expect(
          screen.getByText(
            "Registration Services"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Security Notice"
          )
        ).toBeTruthy();
      }
    );

    it(
      "does not invent application or payment statistics",
      async () => {
        const page =
          await StaffDashboardPage();

        render(page);

        expect(
          screen.queryByText(
            "Total Applications"
          )
        ).toBeNull();

        expect(
          screen.queryByText(
            "Total Revenue"
          )
        ).toBeNull();

        expect(
          screen.queryByText(
            "Pending Payments"
          )
        ).toBeNull();
      }
    );

    it(
      "does not render the dashboard when current staff resolution fails",
      async () => {
        mocks.requireCurrentStaff
          .mockRejectedValue(
            new Error(
              "Unauthenticated"
            )
          );

        await expect(
          StaffDashboardPage()
        ).rejects.toThrow(
          "Unauthenticated"
        );
      }
    );
  }
);