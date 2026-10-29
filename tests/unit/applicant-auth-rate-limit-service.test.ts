import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  findApplicantAuthRateLimit,
  recordApplicantAuthRequest,
} = vi.hoisted(() => ({
  findApplicantAuthRateLimit:
    vi.fn(),
  recordApplicantAuthRequest:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/rate-limit-repository",
  () => ({
    findApplicantAuthRateLimit,
    recordApplicantAuthRequest,
  })
);

import {
  checkApplicantAuthRateLimit,
} from "@/lib/applicant-auth/rate-limit-service";

describe(
  "applicant auth rate limit service",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("allows a request when no rate-limit record exists before or after recording", async () => {
      findApplicantAuthRateLimit
        .mockResolvedValueOnce(
          null
        )
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 1,
          windowStartedAt:
            new Date(
              "2026-10-28T18:00:00.000Z"
            ),
          blockedUntil:
            null,
        });

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      const result =
        await checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          }
        );

      expect(result).toEqual({
        allowed: true,
        retryAfterSeconds: 0,
      });

      expect(
        recordApplicantAuthRequest
      ).toHaveBeenCalledWith(
        "registration",
        "hashed-rate-limit-key",
        15,
        5,
        15
      );

      expect(
        findApplicantAuthRateLimit
      ).toHaveBeenCalledTimes(
        2
      );
    });

    it("allows a request when an existing record is not blocked", async () => {
      const windowStartedAt =
        new Date(
          "2026-10-28T18:00:00.000Z"
        );

      findApplicantAuthRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 3,
          windowStartedAt,
          blockedUntil:
            null,
        })
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 4,
          windowStartedAt,
          blockedUntil:
            null,
        });

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      const result =
        await checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          }
        );

      expect(result).toEqual({
        allowed: true,
        retryAfterSeconds: 0,
      });
    });

    it("rejects immediately when an active block already exists", async () => {
      const now =
        new Date(
          "2026-10-28T18:00:00.000Z"
        );

      const blockedUntil =
        new Date(
          "2026-10-28T18:05:00.000Z"
        );

      findApplicantAuthRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 6,
          windowStartedAt:
            new Date(
              "2026-10-28T17:55:00.000Z"
            ),
          blockedUntil,
        });

      const result =
        await checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          },
          now
        );

      expect(result).toEqual({
        allowed: false,
        retryAfterSeconds: 300,
      });

      expect(
        recordApplicantAuthRequest
      ).not.toHaveBeenCalled();

      expect(
        findApplicantAuthRateLimit
      ).toHaveBeenCalledOnce();
    });

    it("treats an expired block as no longer active", async () => {
      const now =
        new Date(
          "2026-10-28T18:00:00.000Z"
        );

      findApplicantAuthRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 6,
          windowStartedAt:
            new Date(
              "2026-10-28T17:30:00.000Z"
            ),
          blockedUntil:
            new Date(
              "2026-10-28T17:59:59.000Z"
            ),
        })
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 1,
          windowStartedAt:
            now,
          blockedUntil:
            null,
        });

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      const result =
        await checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          },
          now
        );

      expect(result).toEqual({
        allowed: true,
        retryAfterSeconds: 0,
      });

      expect(
        recordApplicantAuthRequest
      ).toHaveBeenCalledOnce();
    });

    it("rejects the request that causes the repository to establish a block", async () => {
      const now =
        new Date(
          "2026-10-28T18:00:00.000Z"
        );

      findApplicantAuthRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 5,
          windowStartedAt:
            new Date(
              "2026-10-28T17:55:00.000Z"
            ),
          blockedUntil:
            null,
        })
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "registration",
          requestCount: 6,
          windowStartedAt:
            new Date(
              "2026-10-28T17:55:00.000Z"
            ),
          blockedUntil:
            new Date(
              "2026-10-28T18:15:00.000Z"
            ),
        });

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      const result =
        await checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          },
          now
        );

      expect(result).toEqual({
        allowed: false,
        retryAfterSeconds: 900,
      });

      expect(
        recordApplicantAuthRequest
      ).toHaveBeenCalledOnce();

      expect(
        findApplicantAuthRateLimit
      ).toHaveBeenCalledTimes(
        2
      );
    });

    it("rounds retry-after seconds up", async () => {
      const now =
        new Date(
          "2026-10-28T18:00:00.100Z"
        );

      findApplicantAuthRateLimit
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "resend_verification",
          requestCount: 4,
          windowStartedAt:
            new Date(
              "2026-10-28T17:55:00.000Z"
            ),
          blockedUntil:
            new Date(
              "2026-10-28T18:00:01.001Z"
            ),
        });

      const result =
        await checkApplicantAuthRateLimit(
          "resend_verification",
          "hashed-rate-limit-key",
          {
            windowMinutes: 30,
            maxRequests: 3,
            blockDurationMinutes: 30,
          },
          now
        );

      expect(result).toEqual({
        allowed: false,
        retryAfterSeconds: 1,
      });
    });

    it("supports resend verification with its own policy", async () => {
      findApplicantAuthRateLimit
        .mockResolvedValueOnce(
          null
        )
        .mockResolvedValueOnce({
          key:
            "hashed-rate-limit-key",
          action:
            "resend_verification",
          requestCount: 1,
          windowStartedAt:
            new Date(
              "2026-10-28T18:00:00.000Z"
            ),
          blockedUntil:
            null,
        });

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      const result =
        await checkApplicantAuthRateLimit(
          "resend_verification",
          "hashed-rate-limit-key",
          {
            windowMinutes: 30,
            maxRequests: 3,
            blockDurationMinutes: 30,
          }
        );

      expect(result.allowed)
        .toBe(true);

      expect(
        recordApplicantAuthRequest
      ).toHaveBeenCalledWith(
        "resend_verification",
        "hashed-rate-limit-key",
        30,
        3,
        30
      );
    });

    it("propagates repository errors while checking the existing state", async () => {
      findApplicantAuthRateLimit
        .mockRejectedValueOnce(
          new Error(
            "database unavailable"
          )
        );

      await expect(
        checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          }
        )
      ).rejects.toThrow(
        "database unavailable"
      );

      expect(
        recordApplicantAuthRequest
      ).not.toHaveBeenCalled();
    });

    it("propagates repository errors while recording the request", async () => {
      findApplicantAuthRateLimit
        .mockResolvedValueOnce(
          null
        );

      recordApplicantAuthRequest
        .mockRejectedValueOnce(
          new Error(
            "database unavailable"
          )
        );

      await expect(
        checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          }
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });

    it("propagates repository errors while checking the state after recording", async () => {
      findApplicantAuthRateLimit
        .mockResolvedValueOnce(
          null
        )
        .mockRejectedValueOnce(
          new Error(
            "database unavailable"
          )
        );

      recordApplicantAuthRequest
        .mockResolvedValueOnce(
          undefined
        );

      await expect(
        checkApplicantAuthRateLimit(
          "registration",
          "hashed-rate-limit-key",
          {
            windowMinutes: 15,
            maxRequests: 5,
            blockDurationMinutes: 15,
          }
        )
      ).rejects.toThrow(
        "database unavailable"
      );
    });
  }
);