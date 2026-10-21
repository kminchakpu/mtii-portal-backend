import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createStaffUserSchema,
} from "@/lib/staff/staff-user-validation";

describe(
  "staff user validation",
  () => {
    it("accepts and normalizes a valid staff user", () => {
      const result =
        createStaffUserSchema.parse({
          firstName: "  Amina  ",
          lastName: "  Ibrahim  ",
          email:
            "  AMINA@EXAMPLE.COM  ",
          password:
            "StrongPassword123!",
          departmentPublicId:
            "11111111-1111-4111-8111-111111111111",
        });

      expect(result).toEqual({
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        password:
          "StrongPassword123!",
        departmentPublicId:
          "11111111-1111-4111-8111-111111111111",
      });
    });

    it("allows a null department", () => {
      const result =
        createStaffUserSchema.parse({
          firstName: "Musa",
          lastName: "Adamu",
          email:
            "musa@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId: null,
        });

      expect(
        result.departmentPublicId
      ).toBeNull();
    });

    it("rejects an invalid email", () => {
      expect(() =>
        createStaffUserSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email: "not-an-email",
          password:
            "StrongPassword123!",
          departmentPublicId: null,
        })
      ).toThrow();
    });

    it("rejects a password shorter than 12 characters", () => {
      expect(() =>
        createStaffUserSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password: "Short1!",
          departmentPublicId: null,
        })
      ).toThrow();
    });

    it("rejects blank names", () => {
      expect(() =>
        createStaffUserSchema.parse({
          firstName: "   ",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId: null,
        })
      ).toThrow();
    });

    it("rejects an invalid department public ID", () => {
      expect(() =>
        createStaffUserSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId:
            "not-a-uuid",
        })
      ).toThrow();
    });

    it("rejects unexpected fields such as roles", () => {
      expect(() =>
        createStaffUserSchema.parse({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId: null,
          roles: ["SUPER_ADMIN"],
        })
      ).toThrow();
    });
  }
);