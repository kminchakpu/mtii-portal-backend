import {
  createHash,
  randomBytes,
} from "node:crypto";

const APPLICANT_VERIFICATION_TOKEN_BYTES =
  32;

export function generateApplicantVerificationToken():
string {
  return randomBytes(
    APPLICANT_VERIFICATION_TOKEN_BYTES
  ).toString(
    "base64url"
  );
}

export function hashApplicantVerificationToken(
  token: string
): string {
  return createHash(
    "sha256"
  )
    .update(token)
    .digest("hex");
}