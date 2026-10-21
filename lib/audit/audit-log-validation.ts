import { z } from "zod";

const paginationNumberSchema = (
  defaultValue: number,
  maximum?: number
) =>
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return defaultValue;
      }

      if (
        typeof value === "string"
      ) {
        return Number(value);
      }

      return value;
    },
    maximum === undefined
      ? z
          .number()
          .int()
          .min(1)
      : z
          .number()
          .int()
          .min(1)
          .max(maximum)
  );

const optionalTrimmedStringSchema =
  z
    .string()
    .trim()
    .min(1)
    .optional();

const optionalDateSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return undefined;
      }

      if (
        value instanceof Date
      ) {
        return value;
      }

      if (
        typeof value === "string"
      ) {
        return new Date(value);
      }

      return value;
    },
    z
      .date()
      .refine(
        (value) =>
          !Number.isNaN(
            value.getTime()
          ),
        {
          message:
            "Invalid date.",
        }
      )
      .optional()
  );

export const auditLogQuerySchema =
  z
    .object({
      page:
        paginationNumberSchema(
          1
        ),
      pageSize:
        paginationNumberSchema(
          25,
          100
        ),
      action:
        optionalTrimmedStringSchema,
      entityType:
        optionalTrimmedStringSchema,
      actorUserPublicId:
        z
          .string()
          .uuid()
          .optional(),
      from:
        optionalDateSchema,
      to:
        optionalDateSchema,
    })
    .refine(
      (data) => {
        if (
          !data.from ||
          !data.to
        ) {
          return true;
        }

        return (
          data.from.getTime() <=
          data.to.getTime()
        );
      },
      {
        message:
          "The from date must not be after the to date.",
        path: ["from"],
      }
    );

export type AuditLogQuery =
  z.infer<
    typeof auditLogQuerySchema
  >;