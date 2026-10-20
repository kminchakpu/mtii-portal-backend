import { z } from "zod";

const staffLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) =>
      value.toLowerCase()
    ),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type StaffLoginInput = z.infer<
  typeof staffLoginSchema
>;

export function parseStaffLoginInput(
  input: unknown
): StaffLoginInput {
  return staffLoginSchema.parse(input);
}