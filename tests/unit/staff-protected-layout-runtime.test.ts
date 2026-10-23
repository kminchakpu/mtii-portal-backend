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
  "@/lib/staff-ui/staff-access",
  () => ({
    requireCurrentStaff:
      vi.fn(),
  })
);

describe(
  "protected staff layout runtime",
  () => {
    it("allows request-time rendering for authenticated staff routes", async () => {
      const protectedLayout =
        await import(
          "@/app/staff/(protected)/layout"
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