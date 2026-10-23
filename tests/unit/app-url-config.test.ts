import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getAppUrl,
} from "@/lib/config/app-url";

describe(
  "application URL configuration",
  () => {
    it("uses localhost by default outside production", () => {
      expect(
        getAppUrl(
          {},
          "development"
        )
      ).toBe(
        "http://localhost:3000"
      );
    });

    it("uses the configured application URL", () => {
      expect(
        getAppUrl(
          {
            APP_URL:
              "http://localhost:4000",
          },
          "development"
        )
      ).toBe(
        "http://localhost:4000"
      );
    });

    it("removes trailing slashes from the configured URL", () => {
      expect(
        getAppUrl(
          {
            APP_URL:
              "https://portal.example.gov.ng///",
          },
          "production"
        )
      ).toBe(
        "https://portal.example.gov.ng"
      );
    });

    it("requires APP_URL in production", () => {
      expect(() =>
        getAppUrl(
          {},
          "production"
        )
      ).toThrow(
        "APP_URL is required in production"
      );
    });

    it("requires HTTPS for the production application URL", () => {
      expect(() =>
        getAppUrl(
          {
            APP_URL:
              "http://portal.example.gov.ng",
          },
          "production"
        )
      ).toThrow(
        "APP_URL must use HTTPS in production"
      );
    });

    it("rejects an invalid configured application URL", () => {
      expect(() =>
        getAppUrl(
          {
            APP_URL:
              "not-a-valid-url",
          },
          "production"
        )
      ).toThrow(
        "APP_URL must be a valid absolute URL"
      );
    });
  }
);