export class DepartmentCodeConflictError extends Error {
  constructor(
    message = "A department with this code already exists."
  ) {
    super(message);
    this.name =
      "DepartmentCodeConflictError";
  }
}