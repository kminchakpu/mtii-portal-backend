export class ApplicantEmailConflictError extends Error {
  constructor() {
    super(
      "An applicant account with this email address already exists."
    );
    this.name =
      "ApplicantEmailConflictError";
  }
}

export class ApplicantVerificationError extends Error {
  constructor() {
    super(
      "Invalid or expired applicant verification token."
    );
    this.name =
      "ApplicantVerificationError";
  }
}