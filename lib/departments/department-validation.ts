import { z } from "zod";

const departmentCodeSchema = z
  .string()
  .trim()
  .min(
    2,
    "Department code must be at least 2 characters."
  )
  .max(
    50,
    "Department code must not exceed 50 characters."
  )
  .regex(
    /^[A-Z0-9_]+$/,
    "Department code may contain only uppercase letters, numbers, and underscores."
  );

const departmentNameSchema = z
  .string()
  .trim()
  .min(
    2,
    "Department name must be at least 2 characters."
  )
  .max(
    150,
    "Department name must not exceed 150 characters."
  );

const departmentDescriptionSchema =
  z
    .string()
    .trim()
    .max(
      2000,
      "Department description must not exceed 2000 characters."
    )
    .nullable()
    .optional();

export const createDepartmentSchema =
  z.object({
    code: z
      .string()
      .trim()
      .transform(
        (value) =>
          value.toUpperCase()
      )
      .pipe(
        departmentCodeSchema
      ),
    name:
      departmentNameSchema,
    description:
      departmentDescriptionSchema,
  });

export const updateDepartmentSchema =
  z
    .object({
      name:
        departmentNameSchema
          .optional(),
      description:
        departmentDescriptionSchema,
      isActive:
        z.boolean().optional(),
    })
    .strict()
    .refine(
      (value) =>
        Object.keys(value)
          .length > 0,
      {
        message:
          "At least one department field must be provided.",
      }
    );

export type CreateDepartmentInput =
  z.infer<
    typeof createDepartmentSchema
  >;

export type UpdateDepartmentInput =
  z.infer<
    typeof updateDepartmentSchema
  >;