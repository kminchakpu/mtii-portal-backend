import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  canAccessDepartment,
  isSuperAdmin,
} from "@/lib/rbac/department-scope";

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

describe("department authorization scope", () => {
  it("allows staff to access their own department", () => {
    expect(
      canAccessDepartment(
        tradeOfficer,
        2
      )
    ).toBe(true);
  });

  it("prevents staff from accessing another department", () => {
    expect(
      canAccessDepartment(
        tradeOfficer,
        3
      )
    ).toBe(false);
  });

  it("allows a Super Admin to access another department", () => {
    expect(
      canAccessDepartment(
        superAdmin,
        3
      )
    ).toBe(true);
  });

  it("identifies a Super Admin", () => {
    expect(
      isSuperAdmin(superAdmin)
    ).toBe(true);
  });

  it("does not identify an ordinary officer as Super Admin", () => {
    expect(
      isSuperAdmin(tradeOfficer)
    ).toBe(false);
  });

  it("denies department access when staff has no department", () => {
    const staffWithoutDepartment: AuthorizationContext = {
      ...tradeOfficer,
      departmentId: null,
      departmentCode: null,
    };

    expect(
      canAccessDepartment(
        staffWithoutDepartment,
        2
      )
    ).toBe(false);
  });
});