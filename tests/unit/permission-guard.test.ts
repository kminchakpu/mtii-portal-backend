import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  requireAllPermissions,
  requireAnyPermission,
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";

const reviewOfficer: AuthorizationContext = {
  userId: 10,
  publicId: "review-officer",
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

describe("permission guard", () => {
  it("allows a staff member with the required permission", () => {
    expect(() =>
      requirePermission(
        reviewOfficer,
        "APPLICATION_REVIEW"
      )
    ).not.toThrow();
  });

  it("rejects a staff member without the required permission", () => {
    expect(() =>
      requirePermission(
        reviewOfficer,
        "APPLICATION_APPROVE"
      )
    ).toThrow(ForbiddenError);
  });

  it("allows access when one of the required permissions exists", () => {
    expect(() =>
      requireAnyPermission(
        reviewOfficer,
        [
          "APPLICATION_APPROVE",
          "APPLICATION_RECOMMEND",
        ]
      )
    ).not.toThrow();
  });

  it("rejects access when none of the required permissions exist", () => {
    expect(() =>
      requireAnyPermission(
        reviewOfficer,
        [
          "APPLICATION_APPROVE",
          "APPLICATION_REJECT",
        ]
      )
    ).toThrow(ForbiddenError);
  });

  it("allows access when all required permissions exist", () => {
    expect(() =>
      requireAllPermissions(
        reviewOfficer,
        [
          "APPLICATION_VIEW",
          "APPLICATION_REVIEW",
        ]
      )
    ).not.toThrow();
  });

  it("rejects access when one required permission is missing", () => {
    expect(() =>
      requireAllPermissions(
        reviewOfficer,
        [
          "APPLICATION_REVIEW",
          "APPLICATION_APPROVE",
        ]
      )
    ).toThrow(ForbiddenError);
  });
});