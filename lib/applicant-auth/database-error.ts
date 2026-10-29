import {
  ApplicantEmailConflictError,
} from "@/lib/applicant-auth/errors";

type MySqlDatabaseError = {
  code?: unknown;
  errno?: unknown;
  sqlMessage?: unknown;
};

function isMySqlDatabaseError(
  error: unknown
): error is MySqlDatabaseError {
  return (
    typeof error === "object" &&
    error !== null
  );
}

export function handleApplicantDatabaseError(
  error: unknown
): never {
  if (
    isMySqlDatabaseError(
      error
    ) &&
    error.code ===
      "ER_DUP_ENTRY" &&
    error.errno === 1062 &&
    typeof error.sqlMessage ===
      "string" &&
    error.sqlMessage.includes(
      "uq_applicants_email"
    )
  ) {
    throw new ApplicantEmailConflictError();
  }

  throw error;
}