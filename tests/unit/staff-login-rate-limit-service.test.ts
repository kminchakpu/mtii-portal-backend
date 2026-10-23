import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  findStaffLoginRateLimit,
  recordStaffLoginFailure,
  clearStaffLoginRateLimit,
} = vi.hoisted(() => ({
  findStaffLoginRateLimit:
    vi.fn(),
  recordStaffLoginFailure:
    vi.fn(),
  clearStaffLoginRateLimit:
    vi.fn(),
}));

vi.mock(
  "@/lib/auth/staff-login-rate-limit-repository",
  () => ({
    findStaffLoginRateLimit,
    recordStaffLoginFailure,
    clearStaffLoginRateLimit,
  })
);

import {
  clearStaffLoginFailures,
  isStaffLoginBlocked,
  recordFailedStaffLogin,
} from "@/lib/auth/staff-login-rate-limit-service";

describe(
  "staff login rate limit service",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.useFakeTimers();
      vi.setSystemTime(
        new Date(
          "2026-10-22T21:15:00.000Z"
        )
      );
    });

    it("allows login when no rate limit record exists", async () => {
      findStaffLoginRateLimit
        .mockResolvedValueOnce(
          null
        );

      const result =
        await isStaffLoginBlocked(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        blocked: false,
        retryAfterSeconds: 0,
      });

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();
    });

    it("allows login when the stored failure count is below the limit", async () => {
      findStaffLoginRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          failedAttempts: 4,
          windowStartedAt:
            new Date(
              "2026-10-22T21:10:00.000Z"
            ),
          blockedUntil: null,
        });

      const result =
        await isStaffLoginBlocked(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        blocked: false,
        retryAfterSeconds: 0,
      });

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();
    });

    it("blocks login while blocked_until is still in the future", async () => {
      findStaffLoginRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          failedAttempts: 5,
          windowStartedAt:
            new Date(
              "2026-10-22T21:05:00.000Z"
            ),
          blockedUntil:
            new Date(
              "2026-10-22T21:20:00.000Z"
            ),
        });

      const result =
        await isStaffLoginBlocked(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        blocked: true,
        retryAfterSeconds: 300,
      });

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();
    });

    it("allows login after a block expires without deleting the record during the check", async () => {
      findStaffLoginRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          failedAttempts: 5,
          windowStartedAt:
            new Date(
              "2026-10-22T20:45:00.000Z"
            ),
          blockedUntil:
            new Date(
              "2026-10-22T21:00:00.000Z"
            ),
        });

      const result =
        await isStaffLoginBlocked(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        blocked: false,
        retryAfterSeconds: 0,
      });

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();
    });

    it("allows login after the attempt window expires without deleting the record during the check", async () => {
      findStaffLoginRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          failedAttempts: 4,
          windowStartedAt:
            new Date(
              "2026-10-22T20:50:00.000Z"
            ),
          blockedUntil: null,
        });

      const result =
        await isStaffLoginBlocked(
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        blocked: false,
        retryAfterSeconds: 0,
      });

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();
    });

    it("delegates failure counting and blocking to one atomic repository operation", async () => {
      recordStaffLoginFailure
        .mockResolvedValueOnce(
          undefined
        );

      await recordFailedStaffLogin(
        "hashed-rate-limit-key"
      );

      expect(
        findStaffLoginRateLimit
      ).not.toHaveBeenCalled();

      expect(
        clearStaffLoginRateLimit
      ).not.toHaveBeenCalled();

      expect(
        recordStaffLoginFailure
      ).toHaveBeenCalledOnce();

      expect(
        recordStaffLoginFailure
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key",
        15,
        5,
        15
      );
    });

    it("clears failures after successful authentication", async () => {
      clearStaffLoginRateLimit
        .mockResolvedValueOnce(
          undefined
        );

      await clearStaffLoginFailures(
        "hashed-rate-limit-key"
      );

      expect(
        clearStaffLoginRateLimit
      ).toHaveBeenCalledOnce();

      expect(
        clearStaffLoginRateLimit
      ).toHaveBeenCalledWith(
        "hashed-rate-limit-key"
      );
    });
  }
);