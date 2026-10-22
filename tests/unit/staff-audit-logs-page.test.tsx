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
  requireStaffPagePermission:
    vi.fn(),
  panelProps:
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

vi.mock(
  "@/lib/staff-ui/staff-page-access",
  () => ({
    requireStaffPagePermission:
      mocks.requireStaffPagePermission,
  })
);

vi.mock(
  "@/components/staff/StaffAuditLogsPanel",
  () => ({
    StaffAuditLogsPanel: (
      props: Record<string, never>
    ) => {
      mocks.panelProps(
        props
      );

      return (
        <div>
          Staff Audit Logs Panel
        </div>
      );
    },
  })
);

import StaffAuditLogsPage, {
  metadata,
} from "@/app/staff/(protected)/audit-logs/page";

const request =
  new Request(
    "http://localhost:3000/staff/audit-logs"
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
    "AUDITOR",
  ],
  permissions: [
    "AUDIT_VIEW",
  ],
};

describe(
  "staff audit logs page",
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

      mocks.requireStaffPagePermission
        .mockImplementation(
          (
            currentStaff
          ) =>
            currentStaff
        );
    });

    it(
      "defines staff audit logs metadata",
      () => {
        expect(
          metadata
        ).toEqual({
          title:
            "Audit Logs | MTII Staff Portal",
          description:
            "Review MTII staff authentication and administrative audit logs.",
        });
      }
    );

    it(
      "creates a server request for the staff audit logs page",
      async () => {
        const page =
          await StaffAuditLogsPage();

        render(page);

        expect(
          mocks.createStaffServerRequest
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.createStaffServerRequest
        ).toHaveBeenCalledWith(
          "/staff/audit-logs"
        );
      }
    );

    it(
      "resolves the current authenticated staff member",
      async () => {
        const page =
          await StaffAuditLogsPage();

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
      "requires AUDIT_VIEW permission",
      async () => {
        const page =
          await StaffAuditLogsPage();

        render(page);

        expect(
          mocks.requireStaffPagePermission
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.requireStaffPagePermission
        ).toHaveBeenCalledWith(
          staff,
          "AUDIT_VIEW"
        );
      }
    );

    it(
      "renders the audit logs panel for authorized staff",
      async () => {
        const page =
          await StaffAuditLogsPage();

        render(page);

        expect(
          screen.getByText(
            "Staff Audit Logs Panel"
          )
        ).toBeTruthy();

        expect(
          mocks.panelProps
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "does not render the panel when the permission guard rejects access",
      async () => {
        mocks.requireStaffPagePermission
          .mockImplementation(
            () => {
              throw new Error(
                "Forbidden"
              );
            }
          );

        await expect(
          StaffAuditLogsPage()
        ).rejects.toThrow(
          "Forbidden"
        );

        expect(
          mocks.panelProps
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "does not render the panel when current staff resolution fails",
      async () => {
        mocks.requireCurrentStaff
          .mockRejectedValue(
            new Error(
              "Unauthenticated"
            )
          );

        await expect(
          StaffAuditLogsPage()
        ).rejects.toThrow(
          "Unauthenticated"
        );

        expect(
          mocks.requireStaffPagePermission
        ).not.toHaveBeenCalled();

        expect(
          mocks.panelProps
        ).not.toHaveBeenCalled();
      }
    );
  }
);