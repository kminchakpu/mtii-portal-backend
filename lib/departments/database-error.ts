import {
  DepartmentCodeConflictError,
} from "@/lib/departments/errors";

type MySqlError = {
  code?: string;
  errno?: number;
  sqlState?: string;
  message?: string;
};

function isMySqlError(
  error: unknown
): error is MySqlError {
  return (
    typeof error ===
      "object" &&
    error !== null
  );
}

export function handleDepartmentDatabaseError(
  error: unknown
): never {
  if (
    isMySqlError(error) &&
    (
      error.code ===
        "ER_DUP_ENTRY" ||
      error.errno === 1062
    )
  ) {
    throw new DepartmentCodeConflictError();
  }

  throw error;
}