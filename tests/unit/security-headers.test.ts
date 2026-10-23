import {
  describe,
  expect,
  it,
} from "vitest";
import nextConfig from "@/next.config";

describe("HTTP security headers", () => {
  it("defines global security headers", async () => {
    expect(nextConfig.headers).toBeDefined();

    const headers =
      await nextConfig.headers!();

    expect(headers).toHaveLength(1);

    expect(headers[0].source).toBe(
      "/(.*)"
    );

    const headerMap = new Map(
      headers[0].headers.map(
        ({ key, value }) => [
          key,
          value,
        ]
      )
    );

    expect(
      headerMap.get(
        "X-Content-Type-Options"
      )
    ).toBe("nosniff");

    expect(
      headerMap.get(
        "Referrer-Policy"
      )
    ).toBe(
      "strict-origin-when-cross-origin"
    );

    expect(
      headerMap.get(
        "X-Frame-Options"
      )
    ).toBe("DENY");

    expect(
      headerMap.get(
        "Permissions-Policy"
      )
    ).toBe(
      "camera=(), microphone=(), geolocation=()"
    );

    expect(
      headerMap.get(
        "Strict-Transport-Security"
      )
    ).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });
});