import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";

describe("staff session token security", () => {
  it("generates different opaque tokens", () => {
    const firstToken = generateSessionToken();
    const secondToken = generateSessionToken();

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken.length).toBeGreaterThanOrEqual(40);
    expect(secondToken.length).toBeGreaterThanOrEqual(40);
  });

  it("creates a SHA-256 token hash", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
  });

  it("hashes the same token consistently", () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).toBe(
      hashSessionToken(token)
    );
  });

  it("produces different hashes for different tokens", () => {
    const firstToken = generateSessionToken();
    const secondToken = generateSessionToken();

    expect(hashSessionToken(firstToken)).not.toBe(
      hashSessionToken(secondToken)
    );
  });
});