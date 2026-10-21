import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  execute,
} = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute,
    },
  })
);

import {
  updateStaffUser,
} from "@/lib/staff/staff-user-repository";
import {
  StaffEmailConflictError,
} from "@/lib/staff/errors";

const updatedUserRow = {
  id: 25,
  public_id:
    "550e8400-e29b-41d4-a716-446655440000",
  department_id: 2,
  department_public_id:
    "660e8400-e29b-41d4-a716-446655440000",
  department_code: "TRADE",
  department_name:
    "Trade Department",
  first_name: "Amina",
  last_name: "Ibrahim",
  email:
    "amina.ibrahim@example.com",
  is_active: 1,
  last_login_at: null,
  password_changed_at: null,
  created_at: new Date(
    "2026-09-01T08:00:00.000Z"
  ),
  updated_at: new Date(
    "2026-10-21T10:00:00.000Z"
  ),
  role_codes:
    "DEPARTMENT_ADMIN",
};

describe("updateStaffUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates the supplied staff fields and returns the updated user", async () => {
    execute
      .mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ])
      .mockResolvedValueOnce([
        [updatedUserRow],
      ]);

    const user =
      await updateStaffUser(
        25,
        {
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina.ibrahim@example.com",
          departmentId: 2,
          isActive: true,
        }
      );

    expect(execute).toHaveBeenCalledTimes(
      2
    );

    expect(
      execute.mock.calls[0][0]
    ).toContain(
      "UPDATE users"
    );

    expect(
      execute.mock.calls[0][1]
    ).toEqual([
      "Amina",
      "Ibrahim",
      "amina.ibrahim@example.com",
      2,
      true,
      25,
    ]);

    expect(user).toEqual({
      id: 25,
      publicId:
        "550e8400-e29b-41d4-a716-446655440000",
      departmentId: 2,
      departmentPublicId:
        "660e8400-e29b-41d4-a716-446655440000",
      departmentCode: "TRADE",
      departmentName:
        "Trade Department",
      firstName: "Amina",
      lastName: "Ibrahim",
      email:
        "amina.ibrahim@example.com",
      isActive: true,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt: new Date(
        "2026-09-01T08:00:00.000Z"
      ),
      updatedAt: new Date(
        "2026-10-21T10:00:00.000Z"
      ),
      roles: [
        "DEPARTMENT_ADMIN",
      ],
    });
  });

  it("updates only the supplied fields", async () => {
    execute
      .mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ])
      .mockResolvedValueOnce([
        [
          {
            ...updatedUserRow,
            first_name:
              "Maryam",
          },
        ],
      ]);

    await updateStaffUser(
      25,
      {
        firstName: "Maryam",
      }
    );

    expect(
      execute.mock.calls[0][0]
    ).toContain(
      "first_name = ?"
    );

    expect(
      execute.mock.calls[0][0]
    ).not.toContain(
      "last_name = ?"
    );

    expect(
      execute.mock.calls[0][0]
    ).not.toContain(
      "email = ?"
    );

    expect(
      execute.mock.calls[0][0]
    ).not.toContain(
      "department_id = ?"
    );

    expect(
      execute.mock.calls[0][0]
    ).not.toContain(
      "is_active = ?"
    );

    expect(
      execute.mock.calls[0][1]
    ).toEqual([
      "Maryam",
      25,
    ]);
  });

  it("supports assigning no department", async () => {
    execute
      .mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ])
      .mockResolvedValueOnce([
        [
          {
            ...updatedUserRow,
            department_id: null,
            department_public_id:
              null,
            department_code: null,
            department_name: null,
          },
        ],
      ]);

    const user =
      await updateStaffUser(
        25,
        {
          departmentId: null,
        }
      );

    expect(
      execute.mock.calls[0][1]
    ).toEqual([
      null,
      25,
    ]);

    expect(
      user.departmentId
    ).toBeNull();

    expect(
      user.departmentPublicId
    ).toBeNull();

    expect(
      user.departmentCode
    ).toBeNull();

    expect(
      user.departmentName
    ).toBeNull();
  });

  it("supports deactivating a staff user", async () => {
    execute
      .mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ])
      .mockResolvedValueOnce([
        [
          {
            ...updatedUserRow,
            is_active: 0,
          },
        ],
      ]);

    const user =
      await updateStaffUser(
        25,
        {
          isActive: false,
        }
      );

    expect(
      execute.mock.calls[0][1]
    ).toEqual([
      false,
      25,
    ]);

    expect(
      user.isActive
    ).toBe(false);
  });

  it("throws when no update fields are supplied", async () => {
    await expect(
      updateStaffUser(
        25,
        {}
      )
    ).rejects.toThrow(
      "At least one staff user field must be provided."
    );

    expect(
      execute
    ).not.toHaveBeenCalled();
  });

  it("translates duplicate email errors", async () => {
    execute.mockRejectedValueOnce({
      code: "ER_DUP_ENTRY",
      errno: 1062,
      sqlMessage:
        "Duplicate entry 'amina@example.com' for key 'uq_users_email'",
    });

    await expect(
      updateStaffUser(
        25,
        {
          email:
            "amina@example.com",
        }
      )
    ).rejects.toBeInstanceOf(
      StaffEmailConflictError
    );
  });

  it("rethrows unrelated database errors", async () => {
    const error = {
      code:
        "ER_LOCK_DEADLOCK",
      errno: 1213,
      sqlMessage:
        "Deadlock found",
    };

    execute.mockRejectedValueOnce(
      error
    );

    await expect(
      updateStaffUser(
        25,
        {
          firstName: "Amina",
        }
      )
    ).rejects.toBe(error);
  });

  it("throws if the updated staff user cannot be reloaded", async () => {
    execute
      .mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ])
      .mockResolvedValueOnce([
        [],
      ]);

    await expect(
      updateStaffUser(
        25,
        {
          firstName: "Amina",
        }
      )
    ).rejects.toThrow(
      "Updated staff user could not be loaded."
    );
  });
});