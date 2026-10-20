import {
  describe,
  expect,
  it,
} from "vitest";
import {
  handleDepartmentDatabaseError,
} from "@/lib/departments/database-error";
import {
  DepartmentCodeConflictError,
} from "@/lib/departments/errors";

describe(
  "department database errors",
  () => {
    it("converts MySQL duplicate entry errors into department conflicts", () => {
      expect(() =>
        handleDepartmentDatabaseError(
          {
            code:
              "ER_DUP_ENTRY",
            errno: 1062,
          }
        )
      ).toThrow(
        DepartmentCodeConflictError
      );
    });

    it("rethrows unrelated database errors", () => {
      const error =
        new Error(
          "Database unavailable"
        );

      expect(() =>
        handleDepartmentDatabaseError(
          error
        )
      ).toThrow(error);
    });
  }
);