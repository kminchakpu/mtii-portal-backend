import { z } from "zod";

export const assignStaffRoleSchema = z
  .object({
    rolePublicId: z
      .string()
      .uuid(
        "Role public ID must be a valid UUID."
      ),
  })
  .strict();

export type AssignStaffRoleInput =
  z.infer<
    typeof assignStaffRoleSchema
  >;