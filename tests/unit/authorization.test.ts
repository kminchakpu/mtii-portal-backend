import {
  describe,
  expect,
  it,
} from "vitest";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasRole,
  type AuthorizationContext,
} from "@/lib/rbac/authorization";

const context: AuthorizationContext = {
  userId: 10,
  publicId: "staff-public-id",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: ["REVIEW_OFFICER"],
  permissions: [
    "APPLICATION_VIEW",
    "APPLICATION_REVIEW",
    "APPLICATION_REQUEST_INFORMATION",
    "APPLICATION_RECOMMEND",
  ],
};

describe("staff authorization", () => {
  it("recognizes an assigned role", () => {
    expect(
      hasRole(
        context,
        "REVIEW_OFFICER"
      )
    ).toBe(true);
  });

  it("rejects an unassigned role", () => {
    expect(
      hasRole(
        context,
        "DIRECTOR"
      )
    ).toBe(false);
  });

  it("recognizes an assigned permission", () => {
    expect(
      hasPermission(
        context,
        "APPLICATION_REVIEW"
      )
    ).toBe(true);
  });

  it("rejects an unassigned permission", () => {
    expect(
      hasPermission(
        context,
        "APPLICATION_APPROVE"
      )
    ).toBe(false);
  });

  it("allows access when any required permission exists", () => {
    expect(
      hasAnyPermission(
        context,
        [
          "APPLICATION_APPROVE",
          "APPLICATION_REVIEW",
        ]
      )
    ).toBe(true);
  });

  it("rejects access when none of the required permissions exist", () => {
    expect(
      hasAnyPermission(
        context,
        [
          "APPLICATION_APPROVE",
          "APPLICATION_REJECT",
        ]
      )
    ).toBe(false);
  });

  it("allows access when all required permissions exist", () => {
    expect(
      hasAllPermissions(
        context,
        [
          "APPLICATION_VIEW",
          "APPLICATION_REVIEW",
        ]
      )
    ).toBe(true);
  });

  it("rejects access when any required permission is missing", () => {
    expect(
      hasAllPermissions(
        context,
        [
          "APPLICATION_REVIEW",
          "APPLICATION_APPROVE",
        ]
      )
    ).toBe(false);
  });
});