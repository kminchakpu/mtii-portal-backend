import {
  describe,
  expect,
  it,
} from "vitest";
import {
  enforceStaffRequestOrigin,
  StaffCrossSiteRequestError,
} from "@/lib/http/staff-request-security";

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
  "staff request security enforcement",
  () => {
    it("allows a same-origin mutation", () => {
      const request = createRequest(
        "POST",
        {
          origin:
            "https://portal.example.com",
        }
      );

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).not.toThrow();
    });

    it("allows a mutation without browser origin metadata", () => {
      const request =
        createRequest("POST");

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).not.toThrow();
    });

    it("rejects a cross-origin mutation", () => {
      const request = createRequest(
        "POST",
        {
          origin:
            "https://attacker.example.com",
        }
      );

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).toThrow(
        StaffCrossSiteRequestError
      );
    });

    it("rejects a cross-site fetch metadata mutation", () => {
      const request = createRequest(
        "PATCH",
        {
          "sec-fetch-site":
            "cross-site",
        }
      );

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).toThrow(
        StaffCrossSiteRequestError
      );
    });

    it("uses a generic security error message", () => {
      const request = createRequest(
        "DELETE",
        {
          origin:
            "https://attacker.example.com",
        }
      );

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).toThrow(
        "Cross-site request forbidden."
      );
    });

    it("allows safe requests", () => {
      const request = createRequest(
        "GET",
        {
          origin:
            "https://attacker.example.com",
          "sec-fetch-site":
            "cross-site",
        }
      );

      expect(() =>
        enforceStaffRequestOrigin(
          request
        )
      ).not.toThrow();
    });
  }
);