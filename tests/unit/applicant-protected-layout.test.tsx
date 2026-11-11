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

const mocks = vi.hoisted(() => {
  class ApplicantUnauthenticatedError
    extends Error {
    constructor() {
      super(
        "Applicant authentication required."
      );

      this.name =
        "ApplicantUnauthenticatedError";
    }
  }

  return {
    ApplicantUnauthenticatedError,
    createApplicantServerRequest:
      vi.fn(),
    requireCurrentApplicant:
      vi.fn(),
    redirect:
      vi.fn(),
  };
});

vi.mock(
  "@/lib/applicant-ui/applicant-server-request",
  () => ({
    createApplicantServerRequest:
      mocks.createApplicantServerRequest,
  })
);

vi.mock(
  "@/lib/applicant-ui/applicant-access",
  () => ({
    ApplicantUnauthenticatedError:
      mocks.ApplicantUnauthenticatedError,
    requireCurrentApplicant:
      mocks.requireCurrentApplicant,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    redirect:
      mocks.redirect,
  })
);

vi.mock(
  "@/components/applicant/ApplicantSignOutButton",
  () => ({
    default: () => (
      <button type="button">
        Sign Out
      </button>
    ),
  })
);

import ApplicantProtectedLayout from "@/app/applicant/(protected)/layout";

const applicant = {
  id: 42,
  publicId:
    "11111111-1111-4111-8111-111111111111",
  firstName: "Grace",
  lastName: "Musa",
  email:
    "grace@example.com",
};

describe(
  "ApplicantProtectedLayout",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks
        .createApplicantServerRequest
        .mockResolvedValue(
          new Request(
            "http://localhost:3000/applicant"
          )
        );

      mocks
        .requireCurrentApplicant
        .mockResolvedValue(
          applicant
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

    it("creates an applicant server request before rendering", async () => {
      const request =
        new Request(
          "http://localhost:3000/applicant"
        );

      mocks
        .createApplicantServerRequest
        .mockResolvedValue(
          request
        );

      await ApplicantProtectedLayout({
        children: (
          <p>
            Protected content
          </p>
        ),
      });

      expect(
        mocks
          .createApplicantServerRequest
      ).toHaveBeenCalledWith(
        "/applicant"
      );

      expect(
        mocks.requireCurrentApplicant
      ).toHaveBeenCalledWith(
        request
      );
    });

    it("redirects an unauthenticated applicant to the applicant login page", async () => {
      mocks
        .requireCurrentApplicant
        .mockRejectedValue(
          new mocks
            .ApplicantUnauthenticatedError()
        );

      await expect(
        ApplicantProtectedLayout({
          children: (
            <p>
              Protected content
            </p>
          ),
        })
      ).rejects.toThrow(
        "REDIRECT:/applicant/login"
      );

      expect(
        mocks.redirect
      ).toHaveBeenCalledWith(
        "/applicant/login"
      );
    });

    it("does not hide unexpected server failures behind a login redirect", async () => {
      mocks
        .requireCurrentApplicant
        .mockRejectedValue(
          new Error(
            "Database unavailable"
          )
        );

      await expect(
        ApplicantProtectedLayout({
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

    it("renders the authenticated applicant identity", async () => {
      const element =
        await ApplicantProtectedLayout({
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

      expect(
        html
      ).toContain(
        "Grace Musa"
      );

      expect(
        html
      ).toContain(
        "grace@example.com"
      );
    });

    it("renders applicant portal navigation", async () => {
      const element =
        await ApplicantProtectedLayout({
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

      expect(
        html
      ).toContain(
        "Dashboard"
      );

      expect(
        html
      ).toContain(
        "Applicant Portal"
      );
    });

    it("renders protected child content", async () => {
      const element =
        await ApplicantProtectedLayout({
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

      expect(
        html
      ).toContain(
        "Protected content"
      );
    });

    it("renders the applicant sign-out control", async () => {
      const element =
        await ApplicantProtectedLayout({
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

      expect(
        html
      ).toContain(
        "Sign Out"
      );
    });
  }
);