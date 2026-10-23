import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createHash,
} from "node:crypto";
import {
  createStaffLoginRateLimitKey,
  getStaffLoginClientIp,
} from "@/lib/auth/staff-login-rate-limit-key";

function hash(
  value: string
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

describe(
  "staff login rate limit key",
  () => {
    it("normalizes the email address before creating the key", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-real-ip":
                "203.0.113.10",
            },
          }
        );

      const result =
        createStaffLoginRateLimitKey(
          request,
          "  Staff@Example.COM "
        );

      expect(result).toBe(
        hash(
          "staff@example.com|203.0.113.10"
        )
      );
    });

    it("uses x-real-ip as the client IP when available", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-real-ip":
                "203.0.113.25",
            },
          }
        );

      expect(
        getStaffLoginClientIp(
          request
        )
      ).toBe(
        "203.0.113.25"
      );
    });

    it("trims whitespace from x-real-ip", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-real-ip":
                " 203.0.113.25 ",
            },
          }
        );

      expect(
        getStaffLoginClientIp(
          request
        )
      ).toBe(
        "203.0.113.25"
      );
    });

    it("does not trust x-forwarded-for by default", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-forwarded-for":
                "198.51.100.20",
            },
          }
        );

      expect(
        getStaffLoginClientIp(
          request
        )
      ).toBe(
        "unknown"
      );
    });

    it("uses unknown when no trusted client IP is available", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login"
        );

      expect(
        getStaffLoginClientIp(
          request
        )
      ).toBe(
        "unknown"
      );
    });

    it("uses unknown when x-real-ip contains only whitespace", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-real-ip": "   ",
            },
          }
        );

      expect(
        getStaffLoginClientIp(
          request
        )
      ).toBe(
        "unknown"
      );
    });

    it("returns a fixed length SHA-256 key instead of exposing the email and IP", () => {
      const request =
        new Request(
          "https://api.example.com/api/staff/auth/login",
          {
            headers: {
              "x-real-ip":
                "203.0.113.10",
            },
          }
        );

      const result =
        createStaffLoginRateLimitKey(
          request,
          "staff@example.com"
        );

      expect(result).toHaveLength(
        64
      );

      expect(result).not.toContain(
        "staff@example.com"
      );

      expect(result).not.toContain(
        "203.0.113.10"
      );
    });
  }
);