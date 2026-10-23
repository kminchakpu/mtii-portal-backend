import {
  describe,
  expect,
  it,
} from "vitest";
import {
  isStaffRequestOriginAllowed,
} from "@/lib/http/staff-request-origin";

function createRequest(
  method: string,
  headers: Record<string, string> = {}
) {
  return new Request(
    "https://portal.example.com/api/staff/users",
    {
      method,
      headers,
    }
  );
}

describe(
  "staff request origin protection",
  () => {
    it("allows safe GET requests regardless of origin", () => {
      const request = createRequest(
        "GET",
        {
          origin:
            "https://attacker.example.com",
          "sec-fetch-site":
            "cross-site",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(true);
    });

    it("allows a mutation with a same-origin Origin header", () => {
      const request = createRequest(
        "POST",
        {
          origin:
            "https://portal.example.com",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(true);
    });

    it("rejects a mutation with a cross-origin Origin header", () => {
      const request = createRequest(
        "POST",
        {
          origin:
            "https://attacker.example.com",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(false);
    });

    it("rejects a mutation when Sec-Fetch-Site is cross-site", () => {
      const request = createRequest(
        "PATCH",
        {
          "sec-fetch-site":
            "cross-site",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(false);
    });

    it("allows a mutation when Sec-Fetch-Site is same-origin", () => {
      const request = createRequest(
        "DELETE",
        {
          "sec-fetch-site":
            "same-origin",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(true);
    });

    it("allows a mutation when browser origin headers are absent", () => {
      const request =
        createRequest("POST");

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(true);
    });

    it("rejects a malformed Origin header on a mutation", () => {
      const request = createRequest(
        "POST",
        {
          origin: "not-a-valid-origin",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(false);
    });

    it("rejects cross-site Sec-Fetch-Site even when Origin matches", () => {
      const request = createRequest(
        "POST",
        {
          origin:
            "https://portal.example.com",
          "sec-fetch-site":
            "cross-site",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(false);
    });

    it("supports PUT as an unsafe method", () => {
      const request = createRequest(
        "PUT",
        {
          origin:
            "https://attacker.example.com",
        }
      );

      expect(
        isStaffRequestOriginAllowed(
          request
        )
      ).toBe(false);
    });
  }
);