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
  "@/components/staff/StaffUsersPanel",
  () => ({
    default: (
      props: {
        canManage: boolean;
        canViewRoles: boolean;
        canAssignRoles: boolean;
      }
    ) => {
      mocks.panelProps(
        props
      );

      return (
        <div>
          Staff Users Panel
        </div>
      );
    },
  })
);

import StaffUsersPage, {
  metadata,
} from "@/app/staff/(protected)/users/page";

const request =
  new Request(
    "http://localhost:3000/staff/users"
  );

const staff = {
  publicId:
    "11111111-1111-4111-8111-111111111111",
  firstName: "Amina",
  lastName: "Ibrahim",
  email:
    "amina@example.com",
  departmentCode:
    "TRADE",
  roles: [
    "DEPARTMENT_ADMIN",
  ],
  permissions: [
    "USER_VIEW",
  ],
};

describe(
  "staff users page",
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

    it("defines staff users metadata", () => {
      expect(
        metadata
      ).toEqual({
        title:
          "Staff Users | MTII Staff Portal",
        description:
          "View MTII staff accounts.",
      });
    });

    it("creates a server request for the staff users page", async () => {
      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.createStaffServerRequest
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        mocks.createStaffServerRequest
      ).toHaveBeenCalledWith(
        "/staff/users"
      );
    });

    it("resolves the current authenticated staff member", async () => {
      const page =
        await StaffUsersPage();

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
    });

    it("requires USER_VIEW permission", async () => {
      const page =
        await StaffUsersPage();

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
        "USER_VIEW"
      );
    });

    it("renders the staff users panel for authorized staff", async () => {
      const page =
        await StaffUsersPage();

      render(page);

      expect(
        screen.getByText(
          "Staff Users Panel"
        )
      ).toBeTruthy();
    });

    it("passes canManage false without USER_MANAGE", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: false,
        })
      );
    });

    it("passes canManage true with USER_MANAGE", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "USER_MANAGE",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: true,
        })
      );
    });

    it("does not treat ROLE_ASSIGN as USER_MANAGE", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "ROLE_ASSIGN",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: false,
        })
      );
    });

    it("passes canViewRoles true with ROLE_VIEW", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "ROLE_VIEW",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: false,
          canViewRoles: true,
          canAssignRoles: false,
        })
      );
    });

    it("passes canAssignRoles true with ROLE_ASSIGN", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "ROLE_VIEW",
            "ROLE_ASSIGN",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: false,
          canViewRoles: true,
          canAssignRoles: true,
        })
      );
    });

    it("keeps role permissions independent from USER_MANAGE", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "USER_MANAGE",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canManage: true,
          canViewRoles: false,
          canAssignRoles: false,
        })
      );
    });

    it("does not treat ROLE_VIEW as ROLE_ASSIGN", async () => {
      mocks.requireCurrentStaff
        .mockResolvedValue({
          ...staff,
          permissions: [
            "USER_VIEW",
            "ROLE_VIEW",
          ],
        });

      const page =
        await StaffUsersPage();

      render(page);

      expect(
        mocks.panelProps
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          canViewRoles: true,
          canAssignRoles: false,
        })
      );
    });

    it("does not render the panel when the permission guard rejects access", async () => {
      mocks.requireStaffPagePermission
        .mockImplementation(
          () => {
            throw new Error(
              "Forbidden"
            );
          }
        );

      await expect(
        StaffUsersPage()
      ).rejects.toThrow(
        "Forbidden"
      );

      expect(
        mocks.panelProps
      ).not.toHaveBeenCalled();
    });

    it("does not render the panel when current staff resolution fails", async () => {
      mocks.requireCurrentStaff
        .mockRejectedValue(
          new Error(
            "Unauthenticated"
          )
        );

      await expect(
        StaffUsersPage()
      ).rejects.toThrow(
        "Unauthenticated"
      );

      expect(
        mocks.requireStaffPagePermission
      ).not.toHaveBeenCalled();

      expect(
        mocks.panelProps
      ).not.toHaveBeenCalled();
    });
  }
);