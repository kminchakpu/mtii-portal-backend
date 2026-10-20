import { describe, expect, it } from "vitest";
import { getSuperAdminConfig } from "@/lib/auth/super-admin-config";

describe("Super Admin configuration", () => {
  it("returns normalized Super Admin configuration", () => {
    const config = getSuperAdminConfig({
      NODE_ENV: "test",
      SUPER_ADMIN_FIRST_NAME: "Kevin",
      SUPER_ADMIN_LAST_NAME: "Admin",
      SUPER_ADMIN_EMAIL: "ADMIN@EXAMPLE.COM",
      SUPER_ADMIN_PASSWORD: "StrongPassword123!",
    });

    expect(config).toEqual({
      firstName: "Kevin",
      lastName: "Admin",
      email: "admin@example.com",
      password: "StrongPassword123!",
    });
  });

  it("rejects missing configuration", () => {
    expect(() =>
      getSuperAdminConfig({ NODE_ENV: "test" })
    ).toThrow(
      "Missing required Super Admin environment variable"
    );
  });

  it("rejects passwords shorter than 12 characters", () => {
    expect(() =>
      getSuperAdminConfig({
        NODE_ENV: "test",
        SUPER_ADMIN_FIRST_NAME: "Kevin",
        SUPER_ADMIN_LAST_NAME: "Admin",
        SUPER_ADMIN_EMAIL: "admin@example.com",
        SUPER_ADMIN_PASSWORD: "Short123!",
      })
    ).toThrow(
      "SUPER_ADMIN_PASSWORD must be at least 12 characters"
    );
  });
});