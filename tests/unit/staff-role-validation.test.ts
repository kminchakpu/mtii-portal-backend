import {
  describe,
  expect,
  it,
} from "vitest";
import {
  assignStaffRoleSchema,
} from "@/lib/staff/staff-role-validation";

describe(
  "staff role validation",
  () => {
    it("accepts a valid role public ID", () => {
      const result =
        assignStaffRoleSchema.safeParse({
          rolePublicId:
            "11111111-1111-4111-8111-111111111111",
        });

      expect(
        result.success
      ).toBe(true);

      if (
        result.success
      ) {
        expect(
          result.data
        ).toEqual({
          rolePublicId:
            "11111111-1111-4111-8111-111111111111",
        });
      }
    });

    it("rejects an invalid role public ID", () => {
      const result =
        assignStaffRoleSchema.safeParse({
          rolePublicId:
            "not-a-uuid",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects a missing role public ID", () => {
      const result =
        assignStaffRoleSchema.safeParse(
          {}
        );

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects a null role public ID", () => {
      const result =
        assignStaffRoleSchema.safeParse({
          rolePublicId: null,
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects additional request fields", () => {
      const result =
        assignStaffRoleSchema.safeParse({
          rolePublicId:
            "11111111-1111-4111-8111-111111111111",
          userId: 42,
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects an internal numeric role ID", () => {
      const result =
        assignStaffRoleSchema.safeParse({
          rolePublicId: 3,
        });

      expect(
        result.success
      ).toBe(false);
    });
  }
);