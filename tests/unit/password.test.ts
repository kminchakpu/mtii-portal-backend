import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";

describe("password security", () => {
  it("hashes passwords without storing the plaintext value", async () => {
    const password = "SecureTestPassword123!";

    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the correct password", async () => {
    const password = "SecureTestPassword123!";
    const hash = await hashPassword(password);

    await expect(
      verifyPassword(password, hash)
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword(
      "SecureTestPassword123!"
    );

    await expect(
      verifyPassword("WrongPassword123!", hash)
    ).resolves.toBe(false);
  });
});