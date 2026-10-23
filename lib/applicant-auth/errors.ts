export class ApplicantEmailConflictError extends Error {
  constructor() {
    super(
      "An applicant account with this email address already exists."
    );
    this.name =
      "ApplicantEmailConflictError";
  }
}