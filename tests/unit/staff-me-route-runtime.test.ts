import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute: vi.fn(),
    },
  })
);

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization:
      vi.fn(),
  })
);

describe(
  "staff current-user route runtime",
  () => {
    it("allows request-time rendering because authentication depends on request headers", async () => {
      const route =
        await import(
          "@/app/api/staff/auth/me/route"
        );

      const routeExports =
        route as Record<
          string,
          unknown
        >;

      expect(
        routeExports.instant
      ).toBe(false);
    });
  }
);