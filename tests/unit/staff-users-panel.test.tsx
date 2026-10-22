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
  getStaffUsers:
    vi.fn(),
  createStaffUser:
    vi.fn(),
  updateStaffUser:
    vi.fn(),
  getStaffRoles:
    vi.fn(),
  assignStaffRole:
    vi.fn(),
  removeStaffRole:
    vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-users-client",
  () => ({
    getStaffUsers:
      mocks.getStaffUsers,
    createStaffUser:
      mocks.createStaffUser,
    updateStaffUser:
      mocks.updateStaffUser,
  })
);

vi.mock(
  "@/lib/staff-ui/staff-roles-client",
  () => ({
    getStaffRoles:
      mocks.getStaffRoles,
    assignStaffRole:
      mocks.assignStaffRole,
    removeStaffRole:
      mocks.removeStaffRole,
  })
);

import StaffUsersPanel from "@/components/staff/StaffUsersPanel";

const staffUsers = [
  {
    publicId:
      "11111111-1111-4111-8111-111111111111",
    department: {
      publicId:
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      code: "TRADE",
      name:
        "Trade Department",
    },
    firstName: "Amina",
    lastName: "Ibrahim",
    email:
      "amina@example.com",
    isActive: true,
    lastLoginAt:
      "2026-10-20T10:00:00.000Z",
    passwordChangedAt:
      "2026-10-01T08:00:00.000Z",
    createdAt:
      "2026-09-01T08:00:00.000Z",
    updatedAt:
      "2026-10-20T10:00:00.000Z",
    roles: [
      "DEPARTMENT_ADMIN",
      "REPORTING_OFFICER",
    ],
  },
  {
    publicId:
      "22222222-2222-4222-8222-222222222222",
    department: null,
    firstName: "Grace",
    lastName: "John",
    email:
      "grace@example.com",
    isActive: false,
    lastLoginAt: null,
    passwordChangedAt: null,
    createdAt:
      "2026-09-15T08:00:00.000Z",
    updatedAt:
      "2026-10-18T08:00:00.000Z",
    roles: [],
  },
];

const staffRoles = [
  {
    publicId:
      "33333333-3333-4333-8333-333333333333",
    code:
      "DEPARTMENT_ADMIN",
    name:
      "Department Admin",
    description:
      "Department administration role.",
    isActive: true,
    createdAt:
      "2026-09-01T08:00:00.000Z",
    updatedAt:
      "2026-09-01T08:00:00.000Z",
  },
  {
    publicId:
      "44444444-4444-4444-8444-444444444444",
    code:
      "REVIEW_OFFICER",
    name:
      "Review Officer",
    description:
      "Reviews ministry applications.",
    isActive: true,
    createdAt:
      "2026-09-01T08:00:00.000Z",
    updatedAt:
      "2026-09-01T08:00:00.000Z",
  },
  {
    publicId:
      "55555555-5555-4555-8555-555555555555",
    code:
      "REPORTING_OFFICER",
    name:
      "Reporting Officer",
    description:
      "Views and exports reports.",
    isActive: true,
    createdAt:
      "2026-09-01T08:00:00.000Z",
    updatedAt:
      "2026-09-01T08:00:00.000Z",
  },
];

describe(
  "StaffUsersPanel",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getStaffUsers
        .mockResolvedValue(
          staffUsers
        );

      mocks.getStaffRoles
        .mockResolvedValue(
          staffRoles
        );
    });

    it("loads and displays staff users", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      expect(
        screen.getByText(
          "Loading staff accounts..."
        )
      ).toBeTruthy();

      expect(
        await screen.findAllByText(
          "Amina Ibrahim"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Grace John"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "amina@example.com"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "grace@example.com"
        )
      ).toHaveLength(2);
    });

    it("shows assigned and unassigned departments", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      expect(
        await screen.findAllByText(
          "Trade Department"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "TRADE"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Unassigned"
        )
      ).toHaveLength(2);
    });

    it("shows active and inactive account status", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
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

    it("shows assigned staff roles", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        screen.getAllByText(
          "DEPARTMENT_ADMIN"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "REPORTING_OFFICER"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "No roles assigned"
        )
      ).toHaveLength(2);
    });

    it("shows the last login date when available", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        screen.getAllByText(
          "20 Oct 2026"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Never"
        )
      ).toHaveLength(2);
    });

    it("hides account management controls without USER_MANAGE", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      ).toBeNull();

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Edit Amina Ibrahim",
          }
        )
      ).toBeNull();
    });

    it("shows account management controls with USER_MANAGE", async () => {
      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Amina Ibrahim",
          }
        )
      ).toHaveLength(2);
    });

    it("opens the create staff account form", async () => {
      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Add Staff Account",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "First Name"
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Last Name"
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Email Address"
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Temporary Password"
        )
      ).toBeTruthy();

      expect(
        screen.getByLabelText(
          "Department Public ID"
        )
      ).toBeTruthy();
    });

    it("creates a staff account and refreshes the list", async () => {
      mocks.createStaffUser
        .mockResolvedValue({
          ...staffUsers[1],
          publicId:
            "33333333-3333-4333-8333-333333333333",
          firstName: "Musa",
          lastName:
            "Abdullahi",
          email:
            "musa@example.com",
          isActive: true,
        });

      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      );

      fireEvent.change(
        screen.getByLabelText(
          "First Name"
        ),
        {
          target: {
            value: "Musa",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Last Name"
        ),
        {
          target: {
            value:
              "Abdullahi",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Email Address"
        ),
        {
          target: {
            value:
              "musa@example.com",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Temporary Password"
        ),
        {
          target: {
            value:
              "TemporaryPassword123!",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Public ID"
        ),
        {
          target: {
            value:
              "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Staff Account",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.createStaffUser
        ).toHaveBeenCalledWith({
          firstName: "Musa",
          lastName:
            "Abdullahi",
          email:
            "musa@example.com",
          password:
            "TemporaryPassword123!",
          departmentPublicId:
            "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        });
      });

      await waitFor(() => {
        expect(
          mocks.getStaffUsers
        ).toHaveBeenCalledTimes(
          2
        );
      });
    });

    it("opens the edit form with the selected staff account", async () => {
      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Amina Ibrahim",
          }
        )[0]
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Edit Staff Account",
          }
        )
      ).toBeTruthy();

      const firstNameInput =
        screen.getByLabelText(
          "First Name"
        ) as HTMLInputElement;

      const lastNameInput =
        screen.getByLabelText(
          "Last Name"
        ) as HTMLInputElement;

      const emailInput =
        screen.getByLabelText(
          "Email Address"
        ) as HTMLInputElement;

      const departmentInput =
        screen.getByLabelText(
          "Department Public ID"
        ) as HTMLInputElement;

      const activeInput =
        screen.getByLabelText(
          "Account Active"
        ) as HTMLInputElement;

      expect(
        firstNameInput.value
      ).toBe("Amina");

      expect(
        lastNameInput.value
      ).toBe("Ibrahim");

      expect(
        emailInput.value
      ).toBe(
        "amina@example.com"
      );

      expect(
        departmentInput.value
      ).toBe(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      );

      expect(
        activeInput.checked
      ).toBe(true);

      expect(
        screen.queryByLabelText(
          "Temporary Password"
        )
      ).toBeNull();
    });

    it("updates a staff account and refreshes the list", async () => {
      mocks.updateStaffUser
        .mockResolvedValue({
          ...staffUsers[0],
          lastName:
            "Ibrahim Musa",
          isActive: false,
        });

      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.change(
        screen.getByLabelText(
          "Last Name"
        ),
        {
          target: {
            value:
              "Ibrahim Musa",
          },
        }
      );

      fireEvent.click(
        screen.getByLabelText(
          "Account Active"
        )
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Save Staff Account",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          staffUsers[0].publicId,
          {
            firstName:
              "Amina",
            lastName:
              "Ibrahim Musa",
            email:
              "amina@example.com",
            departmentPublicId:
              "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            isActive: false,
          }
        );
      });

      await waitFor(() => {
        expect(
          mocks.getStaffUsers
        ).toHaveBeenCalledTimes(
          2
        );
      });
    });

    it("converts an empty department field to null", async () => {
      mocks.updateStaffUser
        .mockResolvedValue({
          ...staffUsers[0],
          department: null,
        });

      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Edit Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.change(
        screen.getByLabelText(
          "Department Public ID"
        ),
        {
          target: {
            value: "",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Save Staff Account",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.updateStaffUser
        ).toHaveBeenCalledWith(
          staffUsers[0].publicId,
          expect.objectContaining({
            departmentPublicId:
              null,
          })
        );
      });
    });

    it("keeps the form open and shows a create error", async () => {
      mocks.createStaffUser
        .mockRejectedValue(
          new Error(
            "Staff email already exists."
          )
        );

      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      );

      fireEvent.change(
        screen.getByLabelText(
          "First Name"
        ),
        {
          target: {
            value: "Amina",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Last Name"
        ),
        {
          target: {
            value: "Ibrahim",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Email Address"
        ),
        {
          target: {
            value:
              "amina@example.com",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          "Temporary Password"
        ),
        {
          target: {
            value:
              "TemporaryPassword123!",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Staff Account",
          }
        )
      );

      const alerts =
        await screen.findAllByRole(
          "alert"
        );

      expect(
        alerts.some(
          (alert) =>
            alert.textContent?.includes(
              "Staff email already exists."
            )
        )
      ).toBe(true);

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Add Staff Account",
          }
        )
      ).toBeTruthy();
    });

    it("shows an empty state when no staff users are available", async () => {
      mocks.getStaffUsers
        .mockResolvedValue(
          []
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      expect(
        await screen.findByText(
          "No staff accounts found."
        )
      ).toBeTruthy();
    });

    it("still exposes Add Staff Account to managers when the list is empty", async () => {
      mocks.getStaffUsers
        .mockResolvedValue(
          []
        );

      render(
        <StaffUsersPanel
          canManage
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findByText(
        "No staff accounts found."
      );

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Add Staff Account",
          }
        )
      ).toBeTruthy();
    });

    it("shows the API error when staff users cannot be loaded", async () => {
      mocks.getStaffUsers
        .mockRejectedValue(
          new Error(
            "Forbidden."
          )
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      const alert =
        await screen.findByRole(
          "alert"
        );

      expect(
        alert.textContent
      ).toContain(
        "Forbidden."
      );
    });

    it("uses a safe message for an unexpected loading failure", async () => {
      mocks.getStaffUsers
        .mockRejectedValue(
          "unexpected"
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      const alert =
        await screen.findByRole(
          "alert"
        );

      expect(
        alert.textContent
      ).toContain(
        "Unable to load staff users."
      );
    });

    it("requests staff users only once when mounted", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await waitFor(() => {
        expect(
          mocks.getStaffUsers
        ).toHaveBeenCalledTimes(
          1
        );
      });
    });

    it("does not load available roles without ROLE_VIEW", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles={false}
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        mocks.getStaffRoles
      ).not.toHaveBeenCalled();

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )
      ).toBeNull();
    });

    it("loads available roles with ROLE_VIEW", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles={false}
        />
      );

      await waitFor(() => {
        expect(
          mocks.getStaffRoles
        ).toHaveBeenCalledTimes(
          1
        );
      });
    });

    it("shows role management controls with ROLE_VIEW", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      expect(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )
      ).toHaveLength(2);
    });

    it("opens role management in view-only mode without ROLE_ASSIGN", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles={false}
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Roles for Amina Ibrahim",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getByText(
          "Department Admin"
        )
      ).toBeTruthy();

      expect(
        screen.getByText(
          "Review Officer"
        )
      ).toBeTruthy();

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Assign Review Officer",
          }
        )
      ).toBeNull();

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Remove Department Admin",
          }
        )
      ).toBeNull();
    });

    it("shows assign and remove controls with ROLE_ASSIGN", async () => {
      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Assign Review Officer",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Remove Department Admin",
          }
        )
      ).toBeTruthy();

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Remove Reporting Officer",
          }
        )
      ).toBeTruthy();
    });

    it("assigns a staff role and refreshes staff users", async () => {
      mocks.assignStaffRole
        .mockResolvedValue(
          staffRoles[1]
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Assign Review Officer",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.assignStaffRole
        ).toHaveBeenCalledWith(
          staffUsers[0].publicId,
          staffRoles[1].publicId
        );
      });

      await waitFor(() => {
        expect(
          mocks.getStaffUsers
        ).toHaveBeenCalledTimes(
          2
        );
      });
    });

    it("removes a staff role and refreshes staff users", async () => {
      mocks.removeStaffRole
        .mockResolvedValue(
          staffRoles[0]
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Remove Department Admin",
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.removeStaffRole
        ).toHaveBeenCalledWith(
          staffUsers[0].publicId,
          staffRoles[0].publicId
        );
      });

      await waitFor(() => {
        expect(
          mocks.getStaffUsers
        ).toHaveBeenCalledTimes(
          2
        );
      });
    });

    it("keeps role management open and shows an assignment error", async () => {
      mocks.assignStaffRole
        .mockRejectedValue(
          new Error(
            "Staff role is already assigned."
          )
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Assign Review Officer",
          }
        )
      );

      const alert =
        await screen.findByRole(
          "alert"
        );

      expect(
        alert.textContent
      ).toContain(
        "Staff role is already assigned."
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Roles for Amina Ibrahim",
          }
        )
      ).toBeTruthy();
    });

    it("keeps role management open and shows a removal error", async () => {
      mocks.removeStaffRole
        .mockRejectedValue(
          new Error(
            "Staff role is not assigned."
          )
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles
        />
      );

      await screen.findAllByText(
        "Amina Ibrahim"
      );

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name:
              "Manage roles for Amina Ibrahim",
          }
        )[0]
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Remove Department Admin",
          }
        )
      );

      const alert =
        await screen.findByRole(
          "alert"
        );

      expect(
        alert.textContent
      ).toContain(
        "Staff role is not assigned."
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Roles for Amina Ibrahim",
          }
        )
      ).toBeTruthy();
    });

    it("shows an available roles loading error", async () => {
      mocks.getStaffRoles
        .mockRejectedValue(
          new Error(
            "Unable to load staff roles."
          )
        );

      render(
        <StaffUsersPanel
          canManage={false}
          canViewRoles
          canAssignRoles={false}
        />
      );

      const alerts =
        await screen.findAllByRole(
          "alert"
        );

      expect(
        alerts.some(
          (alert) =>
            alert.textContent?.includes(
              "Unable to load staff roles."
            )
        )
      ).toBe(true);
    });
  }
);