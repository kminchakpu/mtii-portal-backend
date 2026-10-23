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
  clearStaffLoginRateLimit,
  findStaffLoginRateLimit,
  recordStaffLoginFailure,
} from "@/lib/auth/staff-login-rate-limit-repository";

describe(
  "staff login rate limit repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("finds an existing login rate limit by key", async () => {
      const windowStartedAt =
        new Date(
          "2026-10-22T21:00:00.000Z"
        );

      const blockedUntil =
        new Date(
          "2026-10-22T21:20:00.000Z"
        );

      execute.mockResolvedValueOnce([
        [
          {
            rate_limit_key:
              "hashed-rate-limit-key",
            failed_attempts: 5,
            window_started_at:
              windowStartedAt,
            blocked_until:
              blockedUntil,
          },
        ],
        [],
      ]);

      const result =
        await findStaffLoginRateLimit(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        key:
          "hashed-rate-limit-key",
        failedAttempts: 5,
        windowStartedAt,
        blockedUntil,
      });

      expect(execute)
        .toHaveBeenCalledOnce();

      const [
        sql,
        parameters,
      ] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "FROM staff_login_rate_limits"
      );

      expect(parameters).toEqual([
        "hashed-rate-limit-key",
      ]);
    });

    it("returns null when no login rate limit exists", async () => {
      execute.mockResolvedValueOnce([
        [],
        [],
      ]);

      const result =
        await findStaffLoginRateLimit(
          "hashed-rate-limit-key"
        );

      expect(result).toBeNull();
    });

    it("records a failed login with one atomic upsert", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
        [],
      ]);

      await recordStaffLoginFailure(
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      expect(execute)
        .toHaveBeenCalledOnce();

      const [
        sql,
        parameters,
      ] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "INSERT INTO staff_login_rate_limits"
      );

      expect(sql).toContain(
        "ON DUPLICATE KEY UPDATE"
      );

      expect(sql).toContain(
        "failed_attempts"
      );

      expect(parameters).toEqual([
        "hashed-rate-limit-key",
        15,
        5,
        15,
        15,
      ]);
    });

    it("resets an expired attempt window inside the atomic upsert", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
        [],
      ]);

      await recordStaffLoginFailure(
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      const [sql] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "TIMESTAMPDIFF"
      );

      expect(sql).toContain(
        "failed_attempts ="
      );

      expect(sql).toContain(
        "window_started_at ="
      );
    });

    it("increments the failure count before deciding whether to block", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
        [],
      ]);

      await recordStaffLoginFailure(
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      const [sql] =
        execute.mock.calls[0];

      const failedAttemptsPosition =
        sql.indexOf(
          "failed_attempts ="
        );

      const blockedUntilPosition =
        sql.indexOf(
          "blocked_until ="
        );

      expect(
        failedAttemptsPosition
      ).toBeGreaterThan(-1);

      expect(
        blockedUntilPosition
      ).toBeGreaterThan(-1);

      expect(
        failedAttemptsPosition
      ).toBeLessThan(
        blockedUntilPosition
      );

      expect(sql).toContain(
        "failed_attempts + 1"
      );

      expect(sql).toContain(
        "failed_attempts >= ?"
      );

      expect(sql).toContain(
        "DATE_ADD"
      );
    });

    it("preserves an existing active block", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
        [],
      ]);

      await recordStaffLoginFailure(
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      const [sql] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "blocked_until > NOW()"
      );

      expect(sql).toContain(
        "THEN blocked_until"
      );
    });

    it("clears the login rate limit after successful authentication", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
        [],
      ]);

      await clearStaffLoginRateLimit(
        "hashed-rate-limit-key"
      );

      expect(execute)
        .toHaveBeenCalledOnce();

      const [
        sql,
        parameters,
      ] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "DELETE FROM staff_login_rate_limits"
      );

      expect(parameters).toEqual([
        "hashed-rate-limit-key",
      ]);
    });

    it("propagates database errors while recording a failed attempt", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "database unavailable"
        )
      );

      await expect(
        recordStaffLoginFailure(
          "hashed-rate-limit-key",
          15,
          5,
          15
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });

    it("propagates database errors while clearing a rate limit", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "database unavailable"
        )
      );

      await expect(
        clearStaffLoginRateLimit(
          "hashed-rate-limit-key"
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });
  }
);