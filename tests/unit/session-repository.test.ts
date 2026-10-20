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
  revokeSessionsForDepartment,
} from "@/lib/auth/session-repository";

describe(
  "session repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("revokes unrevoked staff sessions for users assigned to a department", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 3,
        },
      ]);

      const revokedCount =
        await revokeSessionsForDepartment(
          2
        );

      expect(
        execute
      ).toHaveBeenCalledOnce();

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE sessions s"
        ),
        [2]
      );

      const sql =
        execute.mock.calls[0][0] as string;

      expect(
        sql
      ).toContain(
        "INNER JOIN users u"
      );

      expect(
        sql
      ).toContain(
        "u.id = s.user_id"
      );

      expect(
        sql
      ).toContain(
        "u.department_id = ?"
      );

      expect(
        sql
      ).toContain(
        "s.revoked_at IS NULL"
      );

      expect(
        revokedCount
      ).toBe(3);
    });

    it("returns zero when the department has no sessions to revoke", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 0,
        },
      ]);

      const revokedCount =
        await revokeSessionsForDepartment(
          2
        );

      expect(
        revokedCount
      ).toBe(0);

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.any(String),
        [2]
      );
    });

    it("uses the supplied transaction connection instead of the global database pool", async () => {
      const transactionExecute =
        vi.fn()
          .mockResolvedValueOnce([
            {
              affectedRows: 4,
            },
          ]);

      const transactionConnection = {
        execute:
          transactionExecute,
      };

      const revokedCount =
        await revokeSessionsForDepartment(
          3,
          transactionConnection
        );

      expect(
        transactionExecute
      ).toHaveBeenCalledOnce();

      expect(
        transactionExecute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE sessions s"
        ),
        [3]
      );

      expect(
        execute
      ).not.toHaveBeenCalled();

      expect(
        revokedCount
      ).toBe(4);
    });

    it("propagates database errors", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "Session update failed"
        )
      );

      await expect(
        revokeSessionsForDepartment(
          2
        )
      ).rejects.toThrow(
        "Session update failed"
      );
    });
  }
);