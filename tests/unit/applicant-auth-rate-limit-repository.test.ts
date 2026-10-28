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
  clearApplicantAuthRateLimit,
  findApplicantAuthRateLimit,
  recordApplicantAuthRequest,
} from "@/lib/applicant-auth/rate-limit-repository";

describe(
  "applicant auth rate limit repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("finds an existing registration rate limit by action and key", async () => {
      const windowStartedAt =
        new Date(
          "2026-10-28T18:00:00.000Z"
        );

      const blockedUntil =
        new Date(
          "2026-10-28T18:20:00.000Z"
        );

      execute.mockResolvedValueOnce([
        [
          {
            rate_limit_key:
              "hashed-rate-limit-key",
            action:
              "registration",
            request_count: 5,
            window_started_at:
              windowStartedAt,
            blocked_until:
              blockedUntil,
          },
        ],
        [],
      ]);

      const result =
        await findApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key"
        );

      expect(result).toEqual({
        key:
          "hashed-rate-limit-key",
        action:
          "registration",
        requestCount: 5,
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
        "FROM applicant_auth_rate_limits"
      );

      expect(sql).toContain(
        "action = ?"
      );

      expect(sql).toContain(
        "rate_limit_key = ?"
      );

      expect(parameters).toEqual([
        "registration",
        "hashed-rate-limit-key",
      ]);
    });

    it("supports resend verification as a separate action", async () => {
      execute.mockResolvedValueOnce([
        [
          {
            rate_limit_key:
              "hashed-rate-limit-key",
            action:
              "resend_verification",
            request_count: 2,
            window_started_at:
              new Date(
                "2026-10-28T18:00:00.000Z"
              ),
            blocked_until:
              null,
          },
        ],
        [],
      ]);

      const result =
        await findApplicantAuthRateLimit(
          "resend_verification",
          "hashed-rate-limit-key"
        );

      expect(
        result?.action
      ).toBe(
        "resend_verification"
      );

      expect(
        execute.mock.calls[0][1]
      ).toEqual([
        "resend_verification",
        "hashed-rate-limit-key",
      ]);
    });

    it("returns null when no applicant auth rate limit exists", async () => {
      execute.mockResolvedValueOnce([
        [],
        [],
      ]);

      const result =
        await findApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key"
        );

      expect(
        result
      ).toBeNull();
    });

    it("records an applicant auth request with one atomic upsert", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
        [],
      ]);

      await recordApplicantAuthRequest(
        "registration",
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
        "INSERT INTO applicant_auth_rate_limits"
      );

      expect(sql).toContain(
        "ON DUPLICATE KEY UPDATE"
      );

      expect(sql).toContain(
        "request_count"
      );

      expect(parameters).toEqual([
        "hashed-rate-limit-key",
        "registration",
        15,
        5,
        15,
        15,
      ]);
    });

    it("resets an expired request window inside the atomic upsert", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
        [],
      ]);

      await recordApplicantAuthRequest(
        "registration",
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
        "request_count ="
      );

      expect(sql).toContain(
        "window_started_at ="
      );
    });

    it("increments the request count before deciding whether to block", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 2,
        },
        [],
      ]);

      await recordApplicantAuthRequest(
        "registration",
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      const [sql] =
        execute.mock.calls[0];

      const requestCountPosition =
        sql.indexOf(
          "request_count ="
        );

      const blockedUntilPosition =
        sql.indexOf(
          "blocked_until ="
        );

      expect(
        requestCountPosition
      ).toBeGreaterThan(-1);

      expect(
        blockedUntilPosition
      ).toBeGreaterThan(-1);

      expect(
        requestCountPosition
      ).toBeLessThan(
        blockedUntilPosition
      );

      expect(sql).toContain(
        "request_count + 1"
      );

      expect(sql).toContain(
        "request_count >= ?"
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

      await recordApplicantAuthRequest(
        "registration",
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

    it("records resend verification independently from registration", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
        [],
      ]);

      await recordApplicantAuthRequest(
        "resend_verification",
        "hashed-rate-limit-key",
        30,
        3,
        30
      );

      const [
        sql,
        parameters,
      ] =
        execute.mock.calls[0];

      expect(sql).toContain(
        "INSERT INTO applicant_auth_rate_limits"
      );

      expect(parameters).toEqual([
        "hashed-rate-limit-key",
        "resend_verification",
        30,
        3,
        30,
        30,
      ]);
    });

    it("clears only the specified applicant auth action and key", async () => {
      execute.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
        [],
      ]);

      await clearApplicantAuthRateLimit(
        "registration",
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
        "DELETE FROM applicant_auth_rate_limits"
      );

      expect(sql).toContain(
        "action = ?"
      );

      expect(sql).toContain(
        "rate_limit_key = ?"
      );

      expect(parameters).toEqual([
        "registration",
        "hashed-rate-limit-key",
      ]);
    });

    it("propagates database errors while finding a rate limit", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "database unavailable"
        )
      );

      await expect(
        findApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key"
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });

    it("propagates database errors while recording a request", async () => {
      execute.mockRejectedValueOnce(
        new Error(
          "database unavailable"
        )
      );

      await expect(
        recordApplicantAuthRequest(
          "registration",
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
        clearApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key"
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });
  }
);