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

export const registerApplicantSchema = z
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
  })
  .strict();

export type RegisterApplicantInput =
  z.infer<
    typeof registerApplicantSchema
  >;