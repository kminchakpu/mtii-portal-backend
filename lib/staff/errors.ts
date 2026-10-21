export class StaffEmailConflictError extends Error {
  constructor(
    message =
      "A staff account with this email address already exists."
  ) {
    super(message);
    this.name =
      "StaffEmailConflictError";
  }
}

export class StaffUserNotFoundError extends Error {
  constructor(
    message =
      "Staff user not found."
  ) {
    super(message);
    this.name =
      "StaffUserNotFoundError";
  }
}

export class StaffDepartmentNotFoundError extends Error {
  constructor(
    message =
      "Department not found."
  ) {
    super(message);
    this.name =
      "StaffDepartmentNotFoundError";
  }
}

export class StaffDepartmentInactiveError extends Error {
  constructor(
    message =
      "Department is inactive."
  ) {
    super(message);
    this.name =
      "StaffDepartmentInactiveError";
  }
}