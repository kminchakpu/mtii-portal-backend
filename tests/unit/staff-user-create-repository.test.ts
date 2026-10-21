import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  StaffEmailConflictError,
} from "@/lib/staff/errors";

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
  createStaffUser,
} from "@/lib/staff/staff-user-repository";

const input = {
  publicId:
    "33333333-3333-4333-8333-333333333333",
  departmentId: 2,
  firstName: "Amina",
  lastName: "Ibrahim",
  email: "amina@example.com",
  passwordHash:
    "$2b$12$hashed-password",
};

const createdUserRow = {
  id: 25,
  public_id:
    "33333333-3333-4333-8333-333333333333",
  department_id: 2,
  department_public_id:
    "11111111-1111-4111-8111-111111111111",
  department_code: "TRADE",
  department_name:
    "Trade Department",
  first_name: "Amina",
  last_name: "Ibrahim",
  email: "amina@example.com",
  is_active: 1,
  last_login_at: null,
  password_changed_at: null,
  created_at: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
  updated_at: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
  role_codes: null,
};

describe(
  "staff user creation repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("stores the supplied public UUID and password hash", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 25,
          },
        ])
        .mockResolvedValueOnce([
          [createdUserRow],
        ]);

      const user =
        await createStaffUser(
          input
        );

      expect(
        execute
      ).toHaveBeenCalledTimes(2);

      const insertCall =
        execute.mock.calls[0];

      expect(
        insertCall[0]
      ).toContain(
        "INSERT INTO users"
      );

      expect(
        insertCall[1]
      ).toEqual([
        "33333333-3333-4333-8333-333333333333",
        2,
        "Amina",
        "Ibrahim",
        "amina@example.com",
        "$2b$12$hashed-password",
      ]);

      expect(user).toEqual({
        id: 25,
        publicId:
          "33333333-3333-4333-8333-333333333333",
        departmentId: 2,
        departmentPublicId:
          "11111111-1111-4111-8111-111111111111",
        departmentCode:
          "TRADE",
        departmentName:
          "Trade Department",
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        isActive: true,
        lastLoginAt: null,
        passwordChangedAt: null,
        createdAt:
          createdUserRow.created_at,
        updatedAt:
          createdUserRow.updated_at,
        roles: [],
      });
    });

    it("never stores a plaintext password", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 25,
          },
        ])
        .mockResolvedValueOnce([
          [createdUserRow],
        ]);

      await createStaffUser(
        input
      );

      const insertValues =
        execute.mock
          .calls[0][1];

      expect(
        insertValues
      ).toContain(
        "$2b$12$hashed-password"
      );

      expect(
        JSON.stringify(
          insertValues
        )
      ).not.toContain(
        "StrongPassword123!"
      );
    });

    it("supports a null department", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 26,
          },
        ])
        .mockResolvedValueOnce([
          [
            {
              ...createdUserRow,
              id: 26,
              department_id:
                null,
              department_public_id:
                null,
              department_code:
                null,
              department_name:
                null,
            },
          ],
        ]);

      const user =
        await createStaffUser({
          ...input,
          departmentId: null,
        });

      expect(
        execute.mock
          .calls[0][1]
      ).toEqual([
        "33333333-3333-4333-8333-333333333333",
        null,
        "Amina",
        "Ibrahim",
        "amina@example.com",
        "$2b$12$hashed-password",
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

    it("uses the supplied transaction executor for insert and reload", async () => {
      const transactionExecute =
        vi.fn();

      transactionExecute
        .mockResolvedValueOnce([
          {
            insertId: 25,
          },
        ])
        .mockResolvedValueOnce([
          [createdUserRow],
        ]);

      const executor = {
        execute:
          transactionExecute,
      };

      await createStaffUser(
        input,
        executor
      );

      expect(
        transactionExecute
      ).toHaveBeenCalledTimes(2);

      expect(
        execute
      ).not.toHaveBeenCalled();
    });

    it("throws when the created staff user cannot be reloaded", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 25,
          },
        ])
        .mockResolvedValueOnce([
          [],
        ]);

      await expect(
        createStaffUser(
          input
        )
      ).rejects.toThrow(
        "Created staff user could not be loaded."
      );
    });

    it("converts a duplicate staff email database error into StaffEmailConflictError", async () => {
      const duplicateEmailError = {
        code: "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'amina@example.com' for key 'users.uq_users_email'",
      };

      const transactionExecute =
        vi
          .fn()
          .mockRejectedValue(
            duplicateEmailError
          );

      const executor = {
        execute:
          transactionExecute,
      };

      await expect(
        createStaffUser(
          input,
          executor
        )
      ).rejects.toBeInstanceOf(
        StaffEmailConflictError
      );
    });
  }
);