// @vitest-environment jsdom

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getStaffDepartments:
    vi.fn(),
  createStaffDepartment:
    vi.fn(),
  updateStaffDepartment:
    vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-departments-client",
  () => ({
    getStaffDepartments:
      mocks.getStaffDepartments,
    createStaffDepartment:
      mocks.createStaffDepartment,
    updateStaffDepartment:
      mocks.updateStaffDepartment,
  })
);

import StaffDepartmentsPanel from "@/components/staff/StaffDepartmentsPanel";

const departments = [
  {
    publicId:
      "11111111-1111-4111-8111-111111111111",
    code: "TRADE",
    name:
      "Trade Department",
    isActive: true,
  },
  {
    publicId:
      "22222222-2222-4222-8222-222222222222",
    code: "COOP",
    name:
      "Cooperative Department",
    isActive: false,
  },
];

describe(
  "StaffDepartmentsPanel",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks
        .getStaffDepartments
        .mockResolvedValue(
          departments
        );
    });

    it("loads and displays staff departments", async () => {
      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      expect(
        screen.getByText(
          "Loading departments..."
        )
      ).toBeTruthy();

      expect(
        await screen.findAllByText(
          "Trade Department"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Cooperative Department"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "TRADE"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "COOP"
        )
      ).toHaveLength(2);
    });

    it("shows active and inactive department status", async () => {
      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      expect(
        screen.getAllByText(
          "Active"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Inactive"
        )
      ).toHaveLength(2);
    });

    it("does not show management controls without DEPARTMENT_MANAGE", async () => {
      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Add Department",
          }
        )
      ).toBeNull();

      expect(
        screen.queryAllByRole(
          "button",
          {
            name: /edit/i,
          }
        )
      ).toHaveLength(0);
    });

    it("shows management controls when department management is allowed", async () => {
      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Add Department",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getAllByRole(
          "button",
          {
            name: /edit/i,
          }
        ).length
      ).toBeGreaterThan(0);
    });

    it("opens the create department form for authorized staff", async () => {
      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Department",
          }
        )
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Create Department",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Department Code"
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Department Name"
        )
      ).toBeTruthy();
    });

    it("creates a department and refreshes the list", async () => {
      mocks
        .createStaffDepartment
        .mockResolvedValue({
          publicId:
            "33333333-3333-4333-8333-333333333333",
          code: "INDUSTRY",
          name:
            "Industry Department",
          isActive: true,
        });

      mocks
        .getStaffDepartments
        .mockResolvedValueOnce(
          departments
        )
        .mockResolvedValueOnce([
          ...departments,
          {
            publicId:
              "33333333-3333-4333-8333-333333333333",
            code: "INDUSTRY",
            name:
              "Industry Department",
            isActive: true,
          },
        ]);

      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Department",
          }
        )
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Code"
        ),
        {
          target: {
            value: "INDUSTRY",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Name"
        ),
        {
          target: {
            value:
              "Industry Department",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Department",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.createStaffDepartment
        ).toHaveBeenCalledWith({
          code: "INDUSTRY",
          name:
            "Industry Department",
        });
      });

      expect(
        mocks.getStaffDepartments
      ).toHaveBeenCalledTimes(
        2
      );

      expect(
        await screen.findAllByText(
          "Industry Department"
        )
      ).toHaveLength(2);
    });

    it("opens the edit form with an immutable department code", async () => {
      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      const editButtons =
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Trade Department",
          }
        );

      fireEvent.click(
        editButtons[0]
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Edit Department",
          }
        )
      ).toBeTruthy();

      const codeInput =
        screen.getByLabelText(
          "Department Code"
        ) as HTMLInputElement;

      expect(
        codeInput.value
      ).toBe(
        "TRADE"
      );

      expect(
        codeInput.disabled
      ).toBe(true);

      expect(
        (
          screen.getByLabelText(
            "Department Name"
          ) as HTMLInputElement
        ).value
      ).toBe(
        "Trade Department"
      );
    });

    it("updates a department and refreshes the list", async () => {
      mocks
        .updateStaffDepartment
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          code: "TRADE",
          name:
            "Trade and Commerce Department",
          isActive: false,
        });

      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Trade Department",
          }
        )[0]
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Name"
        ),
        {
          target: {
            value:
              "Trade and Commerce Department",
          },
        }
      );

      fireEvent.click(
        screen.getByLabelText(
          "Department Active"
        )
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Save Changes",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.updateStaffDepartment
        ).toHaveBeenCalledWith(
          "11111111-1111-4111-8111-111111111111",
          {
            name:
              "Trade and Commerce Department",
            isActive: false,
          }
        );
      });

      expect(
        mocks.getStaffDepartments
      ).toHaveBeenCalledTimes(
        2
      );
    });

    it("shows mutation API errors without closing the form", async () => {
      mocks
        .createStaffDepartment
        .mockRejectedValue(
          new Error(
            "Department code already exists."
          )
        );

      render(
        <StaffDepartmentsPanel
          canManage
        />
      );

      await screen.findAllByText(
        "Trade Department"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Department",
          }
        )
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Code"
        ),
        {
          target: {
            value: "TRADE",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Name"
        ),
        {
          target: {
            value:
              "Another Trade Department",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Department",
          }
        )
      );

      expect(
        (
          await screen.findByRole(
            "alert"
          )
        ).textContent
      ).toContain(
        "Department code already exists."
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Create Department",
          }
        )
      ).toBeTruthy();
    });

    it("shows an empty state when no departments are available", async () => {
      mocks
        .getStaffDepartments
        .mockResolvedValue([]);

      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      expect(
        await screen.findByText(
          "No departments found."
        )
      ).toBeTruthy();
    });

    it("shows the API error when departments cannot be loaded", async () => {
      mocks
        .getStaffDepartments
        .mockRejectedValue(
          new Error(
            "Forbidden."
          )
        );

      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      expect(
        (
          await screen.findByRole(
            "alert"
          )
        ).textContent
      ).toContain(
        "Forbidden."
      );
    });

    it("uses a safe message for an unexpected failure", async () => {
      mocks
        .getStaffDepartments
        .mockRejectedValue(
          "unexpected failure"
        );

      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      expect(
        (
          await screen.findByRole(
            "alert"
          )
        ).textContent
      ).toContain(
        "Unable to load departments."
      );
    });

    it("requests departments only once when mounted", async () => {
      mocks
        .getStaffDepartments
        .mockResolvedValue([]);

      render(
        <StaffDepartmentsPanel
          canManage={false}
        />
      );

      await waitFor(() => {
        expect(
          mocks.getStaffDepartments
        ).toHaveBeenCalledTimes(
          1
        );
      });
    });
  }
);