import { describe, expect, it } from "vitest";
import {
  getSessionConfig,
  getSessionExpiresAt,
} from "@/lib/auth/session-config";

describe("staff session configuration", () => {
  it("uses the configured session cookie name and TTL", () => {
    const config = getSessionConfig({
      SESSION_COOKIE_NAME: "mtii_staff_session",
      SESSION_TTL_HOURS: "8",
    });

    expect(config).toEqual({
      cookieName: "mtii_staff_session",
      ttlHours: 8,
    });
  });

  it("uses safe defaults when configuration is omitted", () => {
    const config = getSessionConfig({});

    expect(config).toEqual({
      cookieName: "mtii_staff_session",
      ttlHours: 8,
    });
  });

  it("rejects an invalid session TTL", () => {
    expect(() =>
      getSessionConfig({
        SESSION_TTL_HOURS: "invalid",
      })
    ).toThrow(
      "SESSION_TTL_HOURS must be a positive integer"
    );
  });

  it("rejects a zero session TTL", () => {
    expect(() =>
      getSessionConfig({
        SESSION_TTL_HOURS: "0",
      })
    ).toThrow(
      "SESSION_TTL_HOURS must be a positive integer"
    );
  });

  it("calculates session expiration from the configured TTL", () => {
    const now = new Date("2026-10-20T12:00:00.000Z");

    const expiresAt = getSessionExpiresAt(
      now,
      8
    );

    expect(expiresAt.toISOString()).toBe(
      "2026-10-20T20:00:00.000Z"
    );
  });
});