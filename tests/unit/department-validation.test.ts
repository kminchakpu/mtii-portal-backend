import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/lib/departments/department-validation";

describe(
  "department validation",
  () => {
    describe(
      "create department",
      () => {
        it("normalizes and validates valid department input", () => {
          const result =
            createDepartmentSchema.parse({
              code: " trade ",
              name:
                " Trade Department ",
              description:
                " Handles trade services. ",
            });

          expect(
            result
          ).toEqual({
            code: "TRADE",
            name:
              "Trade Department",
            description:
              "Handles trade services.",
          });
        });

        it("accepts a department without a description", () => {
          const result =
            createDepartmentSchema.parse({
              code: "COOP",
              name:
                "Cooperative Department",
            });

          expect(
            result
          ).toEqual({
            code: "COOP",
            name:
              "Cooperative Department",
          });
        });

        it("rejects an invalid department code", () => {
          const result =
            createDepartmentSchema.safeParse({
              code: "trade department",
              name:
                "Trade Department",
            });

          expect(
            result.success
          ).toBe(false);
        });

        it("rejects an empty department name", () => {
          const result =
            createDepartmentSchema.safeParse({
              code: "TRADE",
              name: " ",
            });

          expect(
            result.success
          ).toBe(false);
        });
      }
    );

    describe(
      "update department",
      () => {
        it("accepts a partial update", () => {
          const result =
            updateDepartmentSchema.parse({
              name:
                "Trade and Commerce Department",
            });

          expect(
            result
          ).toEqual({
            name:
              "Trade and Commerce Department",
          });
        });

        it("rejects attempts to change the immutable department code", () => {
          const result =
            updateDepartmentSchema.safeParse({
              code: "COOP",
            });

          expect(
            result.success
          ).toBe(false);
        });

        it("allows a department to be deactivated", () => {
          const result =
            updateDepartmentSchema.parse({
              isActive: false,
            });

          expect(
            result
          ).toEqual({
            isActive: false,
          });
        });

        it("allows the description to be cleared", () => {
          const result =
            updateDepartmentSchema.parse({
              description: null,
            });

          expect(
            result
          ).toEqual({
            description: null,
          });
        });

        it("rejects an empty update", () => {
          const result =
            updateDepartmentSchema.safeParse(
              {}
            );

          expect(
            result.success
          ).toBe(false);
        });
      }
    );
  }
);