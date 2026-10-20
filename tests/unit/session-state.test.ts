import { describe, expect, it } from "vitest";
import { isSessionActive } from "@/lib/auth/session-state";

describe("staff session state", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");

  it("accepts an unrevoked unexpired session", () => {
    expect(
      isSessionActive(
        {
          expiresAt: new Date(
            "2026-10-20T20:00:00.000Z"
          ),
          revokedAt: null,
        },
        now
      )
    ).toBe(true);
  });

  it("rejects an expired session", () => {
    expect(
      isSessionActive(
        {
          expiresAt: new Date(
            "2026-10-20T11:59:59.000Z"
          ),
          revokedAt: null,
        },
        now
      )
    ).toBe(false);
  });

  it("rejects a session expiring exactly now", () => {
    expect(
      isSessionActive(
        {
          expiresAt: now,
          revokedAt: null,
        },
        now
      )
    ).toBe(false);
  });

  it("rejects a revoked session", () => {
    expect(
      isSessionActive(
        {
          expiresAt: new Date(
            "2026-10-20T20:00:00.000Z"
          ),
          revokedAt: new Date(
            "2026-10-20T11:00:00.000Z"
          ),
        },
        now
      )
    ).toBe(false);
  });
});