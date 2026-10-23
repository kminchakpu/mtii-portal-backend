import {
  describe,
  expect,
  it,
} from "vitest";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";
import type {
  CurrentStaff,
} from "@/lib/staff-ui/current-staff";
import {
  requireStaffPagePermission,
} from "@/lib/staff-ui/staff-page-access";

function createStaff(
  permissions: string[]
): CurrentStaff {
  return {
    publicId:
      "11111111-1111-4111-8111-111111111111",
    firstName: "Amina",
    lastName: "Ibrahim",
    email: "amina@example.com",
    departmentCode: "TRADE",
    roles: [
      "REVIEW_OFFICER",
    ],
    permissions,
  };
}

describe(
  "requireStaffPagePermission",
  () => {
    it("allows staff with the required permission", () => {
      const staff =
        createStaff([
          "DEPARTMENT_VIEW",
          "APPLICATION_VIEW",
        ]);

      expect(
        requireStaffPagePermission(
          staff,
          "DEPARTMENT_VIEW"
        )
      ).toBe(staff);
    });

    it("rejects staff without the required permission", () => {
      const staff =
        createStaff([
          "APPLICATION_VIEW",
        ]);

      expect(() =>
        requireStaffPagePermission(
          staff,
          "DEPARTMENT_VIEW"
        )
      ).toThrow(
        ForbiddenError
      );
    });

    it("does not treat another permission as equivalent", () => {
      const staff =
        createStaff([
          "DEPARTMENT_MANAGE",
        ]);

      expect(() =>
        requireStaffPagePermission(
          staff,
          "DEPARTMENT_VIEW"
        )
      ).toThrow(
        ForbiddenError
      );
    });

    it("requires an exact permission match", () => {
      const staff =
        createStaff([
          "department_view",
          "DEPARTMENT",
        ]);

      expect(() =>
        requireStaffPagePermission(
          staff,
          "DEPARTMENT_VIEW"
        )
      ).toThrow(
        ForbiddenError
      );
    });
  }
);