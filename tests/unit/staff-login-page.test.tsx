import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  renderToStaticMarkup,
} from "react-dom/server";

vi.mock(
  "@/components/staff/StaffLoginForm",
  () => ({
    default: () => (
      <form data-testid="staff-login-form">
        Staff Login Form
      </form>
    ),
  })
);

import StaffLoginPage, {
  metadata,
} from "@/app/staff/login/page";

describe(
  "staff login page",
  () => {
    it("uses staff portal metadata", () => {
      expect(metadata.title).toBe(
        "Staff Sign In | MTII Portal"
      );

      expect(
        metadata.description
      ).toBe(
        "Sign in to the MTII internal staff portal."
      );
    });

    it("identifies the portal as an internal MTII staff system", () => {
      const html =
        renderToStaticMarkup(
          <StaffLoginPage />
        );

      expect(html).toContain(
        "MTII Staff Portal"
      );

      expect(html).toContain(
        "Ministry of Trade, Industry and Investment"
      );

      expect(html).toContain(
        "Authorized Staff Access"
      );
    });

    it("renders the staff login form", () => {
      const html =
        renderToStaticMarkup(
          <StaffLoginPage />
        );

      expect(html).toContain(
        "Staff Login Form"
      );
    });

    it("does not present applicant registration actions", () => {
      const html =
        renderToStaticMarkup(
          <StaffLoginPage />
        );

      expect(html).not.toContain(
        "Create Account"
      );

      expect(html).not.toContain(
        "Register Business"
      );

      expect(html).not.toContain(
        "Apply for Registration"
      );
    });
  }
);