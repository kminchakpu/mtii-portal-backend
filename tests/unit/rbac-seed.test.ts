import { describe, expect, it } from "vitest";
import {
  departments,
  permissions,
  roles,
  rolePermissions,
} from "@/database/seeds/rbac-data";

describe("MTII RBAC seed data", () => {
  it("defines the required MTII departments", () => {
    expect(departments.map((department) => department.code)).toEqual([
      "ADMIN",
      "TRADE",
      "COOP",
      "GRM",
    ]);
  });

  it("defines the required staff roles", () => {
    expect(roles.map((role) => role.code)).toEqual([
      "SUPER_ADMIN",
      "DIRECTOR",
      "DEPARTMENT_ADMIN",
      "REVIEW_OFFICER",
      "GRM_OFFICER",
      "REPORTING_OFFICER",
      "AUDITOR",
    ]);
  });

  it("defines unique permission codes", () => {
    const codes = permissions.map((permission) => permission.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it("allows review officers to review and recommend applications", () => {
    expect(rolePermissions.REVIEW_OFFICER).toContain(
      "APPLICATION_VIEW"
    );
    expect(rolePermissions.REVIEW_OFFICER).toContain(
      "APPLICATION_REVIEW"
    );
    expect(rolePermissions.REVIEW_OFFICER).toContain(
      "APPLICATION_REQUEST_INFORMATION"
    );
    expect(rolePermissions.REVIEW_OFFICER).toContain(
      "APPLICATION_RECOMMEND"
    );
  });

  it("does not allow review officers to make final decisions", () => {
    expect(rolePermissions.REVIEW_OFFICER).not.toContain(
      "APPLICATION_APPROVE"
    );
    expect(rolePermissions.REVIEW_OFFICER).not.toContain(
      "APPLICATION_REJECT"
    );
  });

  it("allows directors to make final application decisions", () => {
    expect(rolePermissions.DIRECTOR).toContain(
      "APPLICATION_APPROVE"
    );
    expect(rolePermissions.DIRECTOR).toContain(
      "APPLICATION_REJECT"
    );
  });

  it("reserves certificate permissions for the approval workflow", () => {
    const codes = permissions.map((permission) => permission.code);

    expect(codes).toContain("CERTIFICATE_GENERATE");
    expect(codes).toContain("CERTIFICATE_VIEW");
  });

  it("defines GRM and reporting permissions", () => {
    const codes = permissions.map((permission) => permission.code);

    expect(codes).toContain("GRM_VIEW");
    expect(codes).toContain("GRM_MANAGE");
    expect(codes).toContain("REPORT_VIEW");
    expect(codes).toContain("REPORT_EXPORT");
  });
});