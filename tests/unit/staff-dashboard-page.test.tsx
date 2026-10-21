import {
  describe,
  expect,
  it,
} from "vitest";
import {
  renderToStaticMarkup,
} from "react-dom/server";

import StaffDashboardPage, {
  metadata,
} from "@/app/staff/(protected)/dashboard/page";

describe(
  "StaffDashboardPage",
  () => {
    it("uses staff dashboard metadata", () => {
      expect(metadata.title).toBe(
        "Dashboard | MTII Staff Portal"
      );

      expect(
        metadata.description
      ).toBe(
        "MTII internal staff portal dashboard."
      );
    });

    it("renders the staff dashboard heading", () => {
      const html =
        renderToStaticMarkup(
          <StaffDashboardPage />
        );

      expect(html).toContain(
        "Staff Dashboard"
      );

      expect(html).toContain(
        "Ministry Operations"
      );
    });

    it("identifies the current Phase 1 administration areas", () => {
      const html =
        renderToStaticMarkup(
          <StaffDashboardPage />
        );

      expect(html).toContain(
        "Departments"
      );

      expect(html).toContain(
        "Staff Accounts"
      );

      expect(html).toContain(
        "Audit Logs"
      );
    });

    it("does not invent application or payment statistics", () => {
      const html =
        renderToStaticMarkup(
          <StaffDashboardPage />
        );

      expect(html).not.toContain(
        "Total Applications"
      );

      expect(html).not.toContain(
        "Total Revenue"
      );

      expect(html).not.toContain(
        "Pending Payments"
      );
    });
  }
);