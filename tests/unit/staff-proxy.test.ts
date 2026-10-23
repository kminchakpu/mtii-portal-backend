import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe(
  "staff route proxy",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("redirects an unauthenticated staff request to /staff/login", () => {
      const request =
        new NextRequest(
          "https://portal.example.com/staff/dashboard"
        );

      const response =
        proxy(request);

      expect(response.status).toBe(
        307
      );

      expect(
        response.headers.get(
          "location"
        )
      ).toBe(
        "https://portal.example.com/staff/login"
      );
    });

    it("allows a protected staff request when the session cookie exists", () => {
      const request =
        new NextRequest(
          "https://portal.example.com/staff/dashboard",
          {
            headers: {
              cookie:
                "mtii_staff_session=test-session-token",
            },
          }
        );

      const response =
        proxy(request);

      expect(response.status).toBe(
        200
      );

      expect(
        response.headers.get(
          "x-middleware-next"
        )
      ).toBe("1");
    });

    it("allows unauthenticated requests to /staff/login", () => {
      const request =
        new NextRequest(
          "https://portal.example.com/staff/login"
        );

      const response =
        proxy(request);

      expect(response.status).toBe(
        200
      );

      expect(
        response.headers.get(
          "x-middleware-next"
        )
      ).toBe("1");
    });

    it("does not apply staff authentication redirects outside /staff", () => {
      const request =
        new NextRequest(
          "https://portal.example.com/api/applications"
        );

      const response =
        proxy(request);

      expect(response.status).toBe(
        200
      );

      expect(
        response.headers.get(
          "x-middleware-next"
        )
      ).toBe("1");
    });
  }
);