import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "next/headers",
  () => ({
    headers: vi.fn(),
  })
);

vi.mock(
  "next/navigation",
  () => ({
    redirect: vi.fn(),
  })
);

vi.mock(
  "@/lib/applicant-ui/applicant-access",
  () => ({
    ApplicantUnauthenticatedError:
      class ApplicantUnauthenticatedError
        extends Error {},
    requireCurrentApplicant:
      vi.fn(),
  })
);

vi.mock(
  "@/components/applicant/ApplicantSignOutButton",
  () => ({
    default: () => null,
  })
);

describe(
  "protected applicant layout runtime",
  () => {
    it("allows request-time rendering for authenticated applicant routes", async () => {
      const protectedLayout =
        await import(
          "@/app/applicant/(protected)/layout"
        );

      const layoutExports =
        protectedLayout as Record<
          string,
          unknown
        >;

      expect(
        layoutExports.instant
      ).toBe(false);
    });
  }
);