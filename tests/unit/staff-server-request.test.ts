import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

vi.mock(
  "next/headers",
  () => ({
    headers: mocks.headers,
  })
);

import {
  createStaffServerRequest,
} from "@/lib/staff-ui/staff-server-request";

describe(
  "createStaffServerRequest",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      process.env.APP_URL =
        "https://api.mtiinasarawa.com.ng";
    });

    it("creates a request for the current staff page", async () => {
      mocks.headers.mockResolvedValue(
        new Headers({
          cookie:
            "mtii_staff_session=secure-token",
          "user-agent":
            "staff-browser",
        })
      );

      const request =
        await createStaffServerRequest(
          "/staff/dashboard"
        );

      expect(request.url).toBe(
        "https://api.mtiinasarawa.com.ng/staff/dashboard"
      );

      expect(
        request.headers.get(
          "cookie"
        )
      ).toBe(
        "mtii_staff_session=secure-token"
      );

      expect(
        request.headers.get(
          "user-agent"
        )
      ).toBe(
        "staff-browser"
      );
    });

    it("uses localhost when APP_URL is not configured", async () => {
      delete process.env.APP_URL;

      mocks.headers.mockResolvedValue(
        new Headers({
          cookie:
            "mtii_staff_session=secure-token",
        })
      );

      const request =
        await createStaffServerRequest(
          "/staff/users"
        );

      expect(request.url).toBe(
        "http://localhost:3000/staff/users"
      );
    });

    it("requires an internal staff path", async () => {
      mocks.headers.mockResolvedValue(
        new Headers()
      );

      await expect(
        createStaffServerRequest(
          "/api/applications"
        )
      ).rejects.toThrow(
        "Staff server requests must use a /staff path."
      );
    });
  }
);