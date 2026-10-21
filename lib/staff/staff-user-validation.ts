import { z } from "zod";

const firstNameSchema = z
  .string()
  .trim()
  .min(
    1,
    "First name is required."
  )
  .max(
    100,
    "First name must not exceed 100 characters."
  );

const lastNameSchema = z
  .string()
  .trim()
  .min(
    1,
    "Last name is required."
  )
  .max(
    100,
    "Last name must not exceed 100 characters."
  );

const emailSchema = z
  .string()
  .trim()
  .email(
    "A valid email address is required."
  )
  .max(
    255,
    "Email must not exceed 255 characters."
  )
  .transform((email) =>
    email.toLowerCase()
  );

const departmentPublicIdSchema = z
  .string()
  .uuid(
    "Department public ID must be a valid UUID."
  )
  .nullable();

export const createStaffUserSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(
        12,
        "Password must be at least 12 characters."
      ),
    departmentPublicId:
      departmentPublicIdSchema,
  })
  .strict();

export const updateStaffUserSchema = z
  .object({
    firstName:
      firstNameSchema.optional(),
    lastName:
      lastNameSchema.optional(),
    email:
      emailSchema.optional(),
    departmentPublicId:
      departmentPublicIdSchema.optional(),
    isActive:
      z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one staff user field must be provided.",
    }
  );

export type CreateStaffUserInput =
  z.infer<
    typeof createStaffUserSchema
  >;

export type UpdateStaffUserInput =
  z.infer<
    typeof updateStaffUserSchema
  >;