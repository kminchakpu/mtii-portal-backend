import { describe, expect, it } from "vitest";
import {
  getSessionCookieOptions,
} from "@/lib/auth/session-cookie";

describe("staff session cookie", () => {
  const expiresAt = new Date(
    "2026-10-20T20:00:00.000Z"
  );

  it("uses secure production cookie settings", () => {
    const options = getSessionCookieOptions(
      expiresAt,
      "production"
    );

    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  });

  it("allows HTTP during local development", () => {
    const options = getSessionCookieOptions(
      expiresAt,
      "development"
    );

    expect(options.secure).toBe(false);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("keeps secure cookies enabled in test", () => {
    const options = getSessionCookieOptions(
      expiresAt,
      "test"
    );

    expect(options.secure).toBe(true);
  });
});