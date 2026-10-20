import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  requireDepartmentAccess,
} from "@/lib/rbac/department-guard";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";

const tradeOfficer: AuthorizationContext = {
  userId: 10,
  publicId: "trade-officer",
  departmentId: 2,
  departmentCode: "TRADE",
  roles: ["REVIEW_OFFICER"],
  permissions: [
    "APPLICATION_VIEW",
    "APPLICATION_REVIEW",
  ],
};

const superAdmin: AuthorizationContext = {
  userId: 1,
  publicId: "super-admin",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: ["SUPER_ADMIN"],
  permissions: [],
};

describe("department guard", () => {
  it("allows staff to access their own department", () => {
    expect(() =>
      requireDepartmentAccess(
        tradeOfficer,
        2
      )
    ).not.toThrow();
  });

  it("rejects staff accessing another department", () => {
    expect(() =>
      requireDepartmentAccess(
        tradeOfficer,
        3
      )
    ).toThrow(ForbiddenError);
  });

  it("allows Super Admin to access another department", () => {
    expect(() =>
      requireDepartmentAccess(
        superAdmin,
        3
      )
    ).not.toThrow();
  });

  it("rejects staff without a department", () => {
    const noDepartment: AuthorizationContext = {
      ...tradeOfficer,
      departmentId: null,
      departmentCode: null,
    };

    expect(() =>
      requireDepartmentAccess(
        noDepartment,
        2
      )
    ).toThrow(ForbiddenError);
  });
});