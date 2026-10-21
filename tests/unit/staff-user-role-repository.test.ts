import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute: mocks.execute,
    },
  })
);

import {
  assignStaffUserRole,
  hasStaffUserRole,
  removeStaffUserRole,
} from "@/lib/staff/staff-user-role-repository";

describe(
  "staff user role repository",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("checks whether a user already has a role", async () => {
      mocks.execute.mockResolvedValue([
        [
          {
            user_id: 10,
          },
        ],
        [],
      ]);

      const result =
        await hasStaffUserRole(
          10,
          4
        );

      expect(result).toBe(true);

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "FROM user_roles"
      );

      expect(sql).toContain(
        "user_id = ?"
      );

      expect(sql).toContain(
        "role_id = ?"
      );

      expect(
        parameters
      ).toEqual([
        10,
        4,
      ]);
    });

    it("returns false when a user does not have a role", async () => {
      mocks.execute.mockResolvedValue([
        [],
        [],
      ]);

      const result =
        await hasStaffUserRole(
          10,
          4
        );

      expect(result).toBe(false);
    });

    it("assigns a role to a staff user with the acting user recorded", async () => {
      mocks.execute.mockResolvedValue([
        {
          affectedRows: 1,
        },
        [],
      ]);

      const affectedRows =
        await assignStaffUserRole(
          10,
          4,
          1
        );

      expect(
        affectedRows
      ).toBe(1);

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "INSERT INTO user_roles"
      );

      expect(sql).toContain(
        "assigned_by_user_id"
      );

      expect(
        parameters
      ).toEqual([
        10,
        4,
        1,
      ]);
    });

    it("supports a null assigning user when needed by trusted internal operations", async () => {
      mocks.execute.mockResolvedValue([
        {
          affectedRows: 1,
        },
        [],
      ]);

      const affectedRows =
        await assignStaffUserRole(
          10,
          4,
          null
        );

      expect(
        affectedRows
      ).toBe(1);

      const [
        ,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(
        parameters
      ).toEqual([
        10,
        4,
        null,
      ]);
    });

    it("removes a role from a staff user", async () => {
      mocks.execute.mockResolvedValue([
        {
          affectedRows: 1,
        },
        [],
      ]);

      const affectedRows =
        await removeStaffUserRole(
          10,
          4
        );

      expect(
        affectedRows
      ).toBe(1);

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "DELETE FROM user_roles"
      );

      expect(sql).toContain(
        "user_id = ?"
      );

      expect(sql).toContain(
        "role_id = ?"
      );

      expect(
        parameters
      ).toEqual([
        10,
        4,
      ]);
    });

    it("returns zero when no role assignment was removed", async () => {
      mocks.execute.mockResolvedValue([
        {
          affectedRows: 0,
        },
        [],
      ]);

      const affectedRows =
        await removeStaffUserRole(
          10,
          999
        );

      expect(
        affectedRows
      ).toBe(0);
    });

    it("uses a supplied transaction executor instead of the default pool", async () => {
      const transactionExecute =
        vi.fn();

      transactionExecute
        .mockResolvedValueOnce([
          [
            {
              user_id: 10,
            },
          ],
          [],
        ])
        .mockResolvedValueOnce([
          {
            affectedRows: 1,
          },
          [],
        ])
        .mockResolvedValueOnce([
          {
            affectedRows: 1,
          },
          [],
        ]);

      const executor = {
        execute:
          transactionExecute,
      };

      await hasStaffUserRole(
        10,
        4,
        executor
      );

      await assignStaffUserRole(
        10,
        4,
        1,
        executor
      );

      await removeStaffUserRole(
        10,
        4,
        executor
      );

      expect(
        transactionExecute
      ).toHaveBeenCalledTimes(3);

      expect(
        mocks.execute
      ).not.toHaveBeenCalled();
    });
  }
);