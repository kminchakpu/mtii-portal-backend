import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getEmailConfig,
} from "@/lib/email/email-config";

describe(
  "email configuration",
  () => {
    it("loads valid SMTP configuration", () => {
      const config =
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        });

      expect(
        config
      ).toEqual({
        host:
          "smtp.example.com",
        port: 465,
        secure: true,
        user:
          "mailer@example.com",
        password:
          "secret-password",
        fromEmail:
          "noreply@example.com",
        fromName:
          "MTII Nasarawa",
      });
    });

    it("supports non-secure SMTP connections", () => {
      const config =
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "587",
          SMTP_SECURE:
            "false",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        });

      expect(
        config.port
      ).toBe(587);

      expect(
        config.secure
      ).toBe(false);
    });

    it("requires SMTP_HOST", () => {
      expect(() =>
        getEmailConfig({
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_HOST is required"
      );
    });

    it("requires a valid SMTP port", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "invalid",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_PORT must be an integer between 1 and 65535"
      );
    });

    it("rejects an out-of-range SMTP port", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "70000",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_PORT must be an integer between 1 and 65535"
      );
    });

    it("requires SMTP_SECURE to be true or false", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "yes",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_SECURE must be true or false"
      );
    });

    it("requires SMTP_USER", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_USER is required"
      );
    });

    it("requires SMTP_PASSWORD", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_PASSWORD is required"
      );
    });

    it("requires a valid sender email address", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "not-an-email",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        })
      ).toThrow(
        "SMTP_FROM_EMAIL must be a valid email address"
      );
    });

    it("requires SMTP_FROM_NAME", () => {
      expect(() =>
        getEmailConfig({
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
        })
      ).toThrow(
        "SMTP_FROM_NAME is required"
      );
    });

    it("trims text configuration values", () => {
      const config =
        getEmailConfig({
          SMTP_HOST:
            "  smtp.example.com  ",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "  mailer@example.com  ",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "  noreply@example.com  ",
          SMTP_FROM_NAME:
            "  MTII Nasarawa  ",
        });

      expect(
        config.host
      ).toBe(
        "smtp.example.com"
      );

      expect(
        config.user
      ).toBe(
        "mailer@example.com"
      );

      expect(
        config.fromEmail
      ).toBe(
        "noreply@example.com"
      );

      expect(
        config.fromName
      ).toBe(
        "MTII Nasarawa"
      );
    });
  }
);