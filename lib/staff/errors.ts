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

export class StaffRoleNotFoundError extends Error {
  constructor(
    message =
      "Staff role not found."
  ) {
    super(message);
    this.name =
      "StaffRoleNotFoundError";
  }
}

export class StaffRoleInactiveError extends Error {
  constructor(
    message =
      "Staff role is inactive."
  ) {
    super(message);
    this.name =
      "StaffRoleInactiveError";
  }
}

export class StaffRoleAlreadyAssignedError extends Error {
  constructor(
    message =
      "Staff role is already assigned to this user."
  ) {
    super(message);
    this.name =
      "StaffRoleAlreadyAssignedError";
  }
}

export class StaffRoleNotAssignedError extends Error {
  constructor(
    message =
      "Staff role is not assigned to this user."
  ) {
    super(message);
    this.name =
      "StaffRoleNotAssignedError";
  }
}