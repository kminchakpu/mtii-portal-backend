import {
  describe,
  expect,
  it,
} from "vitest";
import {
  StaffDepartmentInactiveError,
  StaffDepartmentNotFoundError,
  StaffEmailConflictError,
  StaffUserNotFoundError,
} from "@/lib/staff/errors";
import {
  handleStaffUserDatabaseError,
} from "@/lib/staff/database-error";

describe(
  "staff user errors",
  () => {
    it("creates a staff email conflict error with the expected message", () => {
      const error =
        new StaffEmailConflictError();

      expect(error).toBeInstanceOf(
        Error
      );
      expect(error.name).toBe(
        "StaffEmailConflictError"
      );
      expect(error.message).toBe(
        "A staff account with this email address already exists."
      );
    });

    it("creates a staff user not found error with the expected message", () => {
      const error =
        new StaffUserNotFoundError();

      expect(error).toBeInstanceOf(
        Error
      );
      expect(error.name).toBe(
        "StaffUserNotFoundError"
      );
      expect(error.message).toBe(
        "Staff user not found."
      );
    });

    it("creates a department not found error with the expected message", () => {
      const error =
        new StaffDepartmentNotFoundError();

      expect(error).toBeInstanceOf(
        Error
      );
      expect(error.name).toBe(
        "StaffDepartmentNotFoundError"
      );
      expect(error.message).toBe(
        "Department not found."
      );
    });

    it("creates an inactive department error with the expected message", () => {
      const error =
        new StaffDepartmentInactiveError();

      expect(error).toBeInstanceOf(
        Error
      );
      expect(error.name).toBe(
        "StaffDepartmentInactiveError"
      );
      expect(error.message).toBe(
        "Department is inactive."
      );
    });
  }
);

describe(
  "handleStaffUserDatabaseError",
  () => {
    it("translates the users email unique constraint violation", () => {
      const databaseError = {
        code: "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'amina@example.com' for key 'uq_users_email'",
      };

      expect(() =>
        handleStaffUserDatabaseError(
          databaseError
        )
      ).toThrow(
        StaffEmailConflictError
      );
    });

    it("uses the safe staff email conflict message", () => {
      const databaseError = {
        code: "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'amina@example.com' for key 'uq_users_email'",
      };

      expect(() =>
        handleStaffUserDatabaseError(
          databaseError
        )
      ).toThrow(
        "A staff account with this email address already exists."
      );
    });

    it("rethrows duplicate errors for unrelated unique constraints", () => {
      const databaseError = {
        code: "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'value' for key 'some_other_constraint'",
      };

      let thrownError:
        unknown;

      try {
        handleStaffUserDatabaseError(
          databaseError
        );
      } catch (error) {
        thrownError = error;
      }

      expect(
        thrownError
      ).toBe(databaseError);
    });

    it("rethrows unrelated MySQL errors", () => {
      const databaseError = {
        code:
          "ER_LOCK_DEADLOCK",
        errno: 1213,
        sqlMessage:
          "Deadlock found",
      };

      let thrownError:
        unknown;

      try {
        handleStaffUserDatabaseError(
          databaseError
        );
      } catch (error) {
        thrownError = error;
      }

      expect(
        thrownError
      ).toBe(databaseError);
    });

    it("rethrows non-database errors", () => {
      const error =
        new Error(
          "Unexpected failure"
        );

      expect(() =>
        handleStaffUserDatabaseError(
          error
        )
      ).toThrow(error);
    });
  }
);