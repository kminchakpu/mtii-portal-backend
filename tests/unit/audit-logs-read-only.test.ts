import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/rbac/permission-guard",
  () => ({
    requirePermission:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/http/authorization-error",
  () => ({
    handleAuthorizationError:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/audit/audit-log-repository",
  () => ({
    listAuditLogs:
      vi.fn(),
  })
);

import * as auditLogRoute from "@/app/api/staff/audit-logs/route";

describe(
  "audit logs API read-only contract",
  () => {
    it("exposes GET without mutation handlers", () => {
      expect(
        auditLogRoute.GET
      ).toEqual(
        expect.any(Function)
      );

      expect(
        auditLogRoute
      ).not.toHaveProperty(
        "POST"
      );

      expect(
        auditLogRoute
      ).not.toHaveProperty(
        "PUT"
      );

      expect(
        auditLogRoute
      ).not.toHaveProperty(
        "PATCH"
      );

      expect(
        auditLogRoute
      ).not.toHaveProperty(
        "DELETE"
      );
    });
  }
);