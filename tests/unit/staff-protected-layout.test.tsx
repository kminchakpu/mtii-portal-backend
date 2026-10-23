import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  renderToStaticMarkup,
} from "react-dom/server";
import {
  UnauthenticatedError,
} from "@/lib/rbac/errors";

const mocks = vi.hoisted(() => ({
  createStaffServerRequest:
    vi.fn(),
  requireCurrentStaff:
    vi.fn(),
  redirect: vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-server-request",
  () => ({
    createStaffServerRequest:
      mocks.createStaffServerRequest,
  })
);

vi.mock(
  "@/lib/staff-ui/staff-access",
  () => ({
    requireCurrentStaff:
      mocks.requireCurrentStaff,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    redirect: mocks.redirect,
  })
);

vi.mock(
  "@/components/staff/StaffSignOutButton",
  () => ({
    default: () => (
      <button type="button">
        Sign Out
      </button>
    ),
  })
);

import StaffProtectedLayout from "@/app/staff/(protected)/layout";

describe(
  "StaffProtectedLayout",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks
        .createStaffServerRequest
        .mockResolvedValue(
          new Request(
            "http://localhost:3000/staff"
          )
        );

      mocks.redirect
        .mockImplementation(
          (path: string) => {
            throw new Error(
              `REDIRECT:${path}`
            );
          }
        );
    });

    it("validates the current staff session before rendering", async () => {
      const request =
        new Request(
          "http://localhost:3000/staff"
        );

      mocks
        .createStaffServerRequest
        .mockResolvedValue(
          request
        );

      mocks
        .requireCurrentStaff
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          departmentCode:
            "TRADE",
          roles: [
            "REVIEW_OFFICER",
          ],
          permissions: [
            "APPLICATION_VIEW",
          ],
        });

      await StaffProtectedLayout({
        children: (
          <p>
            Protected content
          </p>
        ),
      });

      expect(
        mocks
          .createStaffServerRequest
      ).toHaveBeenCalledWith(
        "/staff"
      );

      expect(
        mocks.requireCurrentStaff
      ).toHaveBeenCalledWith(
        request
      );
    });

    it("redirects an unauthenticated staff session to the login page", async () => {
      mocks
        .requireCurrentStaff
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      await expect(
        StaffProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        })
      ).rejects.toThrow(
        "REDIRECT:/staff/login"
      );

      expect(
        mocks.redirect
      ).toHaveBeenCalledWith(
        "/staff/login"
      );
    });

    it("does not hide unexpected server failures behind a login redirect", async () => {
      mocks
        .requireCurrentStaff
        .mockRejectedValue(
          new Error(
            "Database unavailable"
          )
        );

      await expect(
        StaffProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        })
      ).rejects.toThrow(
        "Database unavailable"
      );

      expect(
        mocks.redirect
      ).not.toHaveBeenCalled();
    });

    it("renders the authenticated staff identity and authorized navigation", async () => {
      mocks
        .requireCurrentStaff
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          departmentCode:
            "TRADE",
          roles: [
            "SUPER_ADMIN",
          ],
          permissions: [
            "DEPARTMENT_VIEW",
            "USER_VIEW",
            "AUDIT_VIEW",
          ],
        });

      const element =
        await StaffProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        });

      const html =
        renderToStaticMarkup(
          element
        );

      expect(html).toContain(
        "Amina Ibrahim"
      );

      expect(html).toContain(
        "amina@example.com"
      );

      expect(html).toContain(
        "TRADE"
      );

      expect(html).toContain(
        "Dashboard"
      );

      expect(html).toContain(
        "Departments"
      );

      expect(html).toContain(
        "Staff Users"
      );

      expect(html).toContain(
        "Audit Logs"
      );

      expect(html).toContain(
        "Protected content"
      );
    });

    it("does not render navigation links the staff member lacks permission to view", async () => {
      mocks
        .requireCurrentStaff
        .mockResolvedValue({
          publicId:
            "22222222-2222-4222-8222-222222222222",
          firstName: "Musa",
          lastName: "Adamu",
          email:
            "musa@example.com",
          departmentCode:
            "COOP",
          roles: [
            "REVIEW_OFFICER",
          ],
          permissions: [
            "APPLICATION_VIEW",
            "APPLICATION_REVIEW",
          ],
        });

      const element =
        await StaffProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        });

      const html =
        renderToStaticMarkup(
          element
        );

      expect(html).toContain(
        "Dashboard"
      );

      expect(html).not.toContain(
        "Departments"
      );

      expect(html).not.toContain(
        "Staff Users"
      );

      expect(html).not.toContain(
        "Audit Logs"
      );
    });

    it("renders the staff sign-out control", async () => {
      mocks
        .requireCurrentStaff
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          departmentCode:
            "TRADE",
          roles: [
            "SUPER_ADMIN",
          ],
          permissions: [
            "DEPARTMENT_VIEW",
            "USER_VIEW",
            "AUDIT_VIEW",
          ],
        });

      const element =
        await StaffProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        });

      const html =
        renderToStaticMarkup(
          element
        );

      expect(html).toContain(
        "Sign Out"
      );
    });
  }
);