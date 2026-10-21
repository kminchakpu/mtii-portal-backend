import {
  describe,
  expect,
  it,
} from "vitest";
import {
  updateStaffUserSchema,
} from "@/lib/staff/staff-user-validation";

describe("updateStaffUserSchema", () => {
  it("accepts a valid staff profile update", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "  Amina  ",
        lastName: "  Ibrahim  ",
        email:
          "  AMINA.IBRAHIM@EXAMPLE.COM  ",
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data).toEqual({
      firstName: "Amina",
      lastName: "Ibrahim",
      email:
        "amina.ibrahim@example.com",
    });
  });

  it("accepts a department change", () => {
    const departmentPublicId =
      "550e8400-e29b-41d4-a716-446655440000";

    const result =
      updateStaffUserSchema.safeParse({
        departmentPublicId,
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(
      result.data.departmentPublicId
    ).toBe(departmentPublicId);
  });

  it("allows a Super Admin operation to specify an unassigned department", () => {
    const result =
      updateStaffUserSchema.safeParse({
        departmentPublicId: null,
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(
      result.data.departmentPublicId
    ).toBeNull();
  });

  it("accepts activation status changes", () => {
    const deactivate =
      updateStaffUserSchema.safeParse({
        isActive: false,
      });

    const activate =
      updateStaffUserSchema.safeParse({
        isActive: true,
      });

    expect(
      deactivate.success
    ).toBe(true);

    expect(
      activate.success
    ).toBe(true);
  });

  it("rejects an empty update", () => {
    const result =
      updateStaffUserSchema.safeParse(
        {}
      );

    expect(result.success).toBe(false);
  });

  it("rejects a blank first name", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "   ",
      });

    expect(result.success).toBe(false);
  });

  it("rejects a blank last name", () => {
    const result =
      updateStaffUserSchema.safeParse({
        lastName: "   ",
      });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result =
      updateStaffUserSchema.safeParse({
        email: "not-an-email",
      });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid department public ID", () => {
    const result =
      updateStaffUserSchema.safeParse({
        departmentPublicId:
          "not-a-uuid",
      });

    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean activation value", () => {
    const result =
      updateStaffUserSchema.safeParse({
        isActive: "false",
      });

    expect(result.success).toBe(false);
  });

  it("rejects role assignment through the staff update endpoint", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        roles: ["DIRECTOR"],
      });

    expect(result.success).toBe(false);
  });

  it("rejects password changes through the staff update endpoint", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        password:
          "NewSecurePassword123!",
      });

    expect(result.success).toBe(false);
  });

  it("rejects passwordHash", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        passwordHash:
          "should-never-be-accepted",
      });

    expect(result.success).toBe(false);
  });

  it("rejects attempts to change the public ID", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        publicId:
          "550e8400-e29b-41d4-a716-446655440000",
      });

    expect(result.success).toBe(false);
  });

  it("rejects attempts to supply an internal department ID", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        departmentId: 2,
      });

    expect(result.success).toBe(false);
  });

  it("rejects attempts to supply an internal user ID", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        id: 25,
      });

    expect(result.success).toBe(false);
  });

  it("rejects any other unexpected field", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "Amina",
        somethingUnexpected: true,
      });

    expect(result.success).toBe(false);
  });

  it("enforces the existing first-name length limit", () => {
    const result =
      updateStaffUserSchema.safeParse({
        firstName: "A".repeat(101),
      });

    expect(result.success).toBe(false);
  });

  it("enforces the existing last-name length limit", () => {
    const result =
      updateStaffUserSchema.safeParse({
        lastName: "A".repeat(101),
      });

    expect(result.success).toBe(false);
  });

  it("enforces the existing email length limit", () => {
    const email =
      `${"a".repeat(245)}@example.com`;

    expect(email.length).toBeGreaterThan(
      255
    );

    const result =
      updateStaffUserSchema.safeParse({
        email,
      });

    expect(result.success).toBe(false);
  });
});