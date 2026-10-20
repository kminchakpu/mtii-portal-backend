import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "@/lib/db/config";

describe("database configuration", () => {
  it("rejects missing database environment variables", () => {
    expect(() =>
      getDatabaseConfig({
        NODE_ENV: "test",
        DB_PORT: "3306",
      })
    ).toThrow(
      "Missing required database environment variable: DB_HOST"
    );
  });

  it("returns valid database configuration", () => {
    const config = getDatabaseConfig({
      NODE_ENV: "test",
      DB_HOST: "localhost",
      DB_PORT: "3306",
      DB_USER: "mtii_user",
      DB_PASSWORD: "test-password",
      DB_NAME: "mtii_portal",
    });

    expect(config).toEqual({
      host: "localhost",
      port: 3306,
      user: "mtii_user",
      password: "test-password",
      database: "mtii_portal",
    });
  });

  it("rejects an invalid database port", () => {
    expect(() =>
      getDatabaseConfig({
        NODE_ENV: "test",
        DB_HOST: "localhost",
        DB_PORT: "invalid",
        DB_USER: "mtii_user",
        DB_PASSWORD: "test-password",
        DB_NAME: "mtii_portal",
      })
    ).toThrow(
      "DB_PORT must be a valid positive integer"
    );
  });
});