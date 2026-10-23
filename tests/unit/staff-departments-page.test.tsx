import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  renderToStaticMarkup,
} from "react-dom/server";
import type {
  CurrentStaff,
} from "@/lib/staff-ui/current-staff";

const mocks = vi.hoisted(() => ({
  createStaffServerRequest:
    vi.fn(),
  requireCurrentStaff:
    vi.fn(),
  requireStaffPagePermission:
    vi.fn(),
  staffDepartmentsPanel:
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
  "@/components/staff/StaffDepartmentsPanel",
  () => ({
    default: function MockStaffDepartmentsPanel(
      props: {
        canManage: boolean;
      }
    ) {
      mocks.staffDepartmentsPanel(
        props
      );

      return (
        <div>
          Departments Panel
        </div>
      );
    },
  })
);

import StaffDepartmentsPage, {
  metadata,
} from "@/app/staff/(protected)/departments/page";

function createStaff(
  permissions: string[] = [
    "DEPARTMENT_VIEW",
    "DEPARTMENT_MANAGE",
  ]
): CurrentStaff {
  return {
    publicId:
      "11111111-1111-4111-8111-111111111111",
    firstName: "Amina",
    lastName: "Ibrahim",
    email: "amina@example.com",
    departmentCode: "ADMIN",
    roles: [
      "SUPER_ADMIN",
    ],
    permissions,
  };
}

describe(
  "StaffDepartmentsPage",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      const request =
        new Request(
          "http://localhost:3000/staff/departments"
        );

      const staff =
        createStaff();

      mocks
        .createStaffServerRequest
        .mockResolvedValue(
          request
        );

      mocks
        .requireCurrentStaff
        .mockResolvedValue(
          staff
        );

      mocks
        .requireStaffPagePermission
        .mockReturnValue(
          staff
        );
    });

    it("uses department page metadata", () => {
      expect(
        metadata.title
      ).toBe(
        "Departments | MTII Staff Portal"
      );

      expect(
        metadata.description
      ).toBe(
        "View MTII ministry departments."
      );
    });

    it("requires the authenticated staff member to have DEPARTMENT_VIEW", async () => {
      const page =
        await StaffDepartmentsPage();

      renderToStaticMarkup(
        page
      );

      expect(
        mocks.createStaffServerRequest
      ).toHaveBeenCalledWith(
        "/staff/departments"
      );

      expect(
        mocks.requireCurrentStaff
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        mocks.requireStaffPagePermission
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          publicId:
            "11111111-1111-4111-8111-111111111111",
        }),
        "DEPARTMENT_VIEW"
      );
    });

    it("renders the department administration heading", async () => {
      const page =
        await StaffDepartmentsPage();

      const html =
        renderToStaticMarkup(
          page
        );

      expect(html).toContain(
        "Departments"
      );

      expect(html).toContain(
        "Ministry Administration"
      );

      expect(html).toContain(
        "Departments Panel"
      );
    });

    it("allows DEPARTMENT_VIEW without requiring DEPARTMENT_MANAGE", async () => {
      const staff =
        createStaff([
          "DEPARTMENT_VIEW",
        ]);

      mocks
        .requireCurrentStaff
        .mockResolvedValue(
          staff
        );

      mocks
        .requireStaffPagePermission
        .mockReturnValue(
          staff
        );

      const page =
        await StaffDepartmentsPage();

      renderToStaticMarkup(
        page
      );

      expect(
        mocks.requireStaffPagePermission
      ).toHaveBeenCalledWith(
        staff,
        "DEPARTMENT_VIEW"
      );

      expect(
        mocks.requireStaffPagePermission
      ).not.toHaveBeenCalledWith(
        staff,
        "DEPARTMENT_MANAGE"
      );
    });

    it("enables management controls when staff has DEPARTMENT_MANAGE", async () => {
      const staff =
        createStaff([
          "DEPARTMENT_VIEW",
          "DEPARTMENT_MANAGE",
        ]);

      mocks
        .requireCurrentStaff
        .mockResolvedValue(
          staff
        );

      mocks
        .requireStaffPagePermission
        .mockReturnValue(
          staff
        );

      const page =
        await StaffDepartmentsPage();

      renderToStaticMarkup(
        page
      );

      expect(
        mocks.staffDepartmentsPanel
      ).toHaveBeenCalledWith({
        canManage: true,
      });
    });

    it("disables management controls when staff lacks DEPARTMENT_MANAGE", async () => {
      const staff =
        createStaff([
          "DEPARTMENT_VIEW",
        ]);

      mocks
        .requireCurrentStaff
        .mockResolvedValue(
          staff
        );

      mocks
        .requireStaffPagePermission
        .mockReturnValue(
          staff
        );

      const page =
        await StaffDepartmentsPage();

      renderToStaticMarkup(
        page
      );

      expect(
        mocks.staffDepartmentsPanel
      ).toHaveBeenCalledWith({
        canManage: false,
      });
    });

    it("does not treat another permission as DEPARTMENT_MANAGE", async () => {
      const staff =
        createStaff([
          "DEPARTMENT_VIEW",
          "USER_MANAGE",
        ]);

      mocks
        .requireCurrentStaff
        .mockResolvedValue(
          staff
        );

      mocks
        .requireStaffPagePermission
        .mockReturnValue(
          staff
        );

      const page =
        await StaffDepartmentsPage();

      renderToStaticMarkup(
        page
      );

      expect(
        mocks.staffDepartmentsPanel
      ).toHaveBeenCalledWith({
        canManage: false,
      });
    });

    it("does not render the page when the view permission guard rejects access", async () => {
      mocks
        .requireStaffPagePermission
        .mockImplementation(
          () => {
            throw new Error(
              "Forbidden."
            );
          }
        );

      await expect(
        StaffDepartmentsPage()
      ).rejects.toThrow(
        "Forbidden."
      );

      expect(
        mocks.staffDepartmentsPanel
      ).not.toHaveBeenCalled();
    });
  }
);