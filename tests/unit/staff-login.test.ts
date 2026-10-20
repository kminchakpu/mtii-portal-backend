import { describe, expect, it } from "vitest";
import {
  parseStaffLoginInput,
} from "@/lib/auth/staff-login";

describe("staff login input", () => {
  it("normalizes the email address", () => {
    const result = parseStaffLoginInput({
      email: "  ADMIN@MTII.GOV.NG  ",
      password: "SecurePassword123!",
    });

    expect(result.email).toBe(
      "admin@mtii.gov.ng"
    );
    expect(result.password).toBe(
      "SecurePassword123!"
    );
  });

  it("rejects an invalid email address", () => {
    expect(() =>
      parseStaffLoginInput({
        email: "not-an-email",
        password: "SecurePassword123!",
      })
    ).toThrow();
  });

  it("rejects an empty email address", () => {
    expect(() =>
      parseStaffLoginInput({
        email: "",
        password: "SecurePassword123!",
      })
    ).toThrow();
  });

  it("rejects an empty password", () => {
    expect(() =>
      parseStaffLoginInput({
        email: "admin@mtii.gov.ng",
        password: "",
      })
    ).toThrow();
  });

  it("rejects missing credentials", () => {
    expect(() =>
      parseStaffLoginInput({})
    ).toThrow();
  });
});