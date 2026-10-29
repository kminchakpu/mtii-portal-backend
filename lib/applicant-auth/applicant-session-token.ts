import {
  createHash,
  randomBytes,
} from "node:crypto";

const APPLICANT_SESSION_TOKEN_BYTES = 32;

export function generateApplicantSessionToken(): string {
  return randomBytes(
    APPLICANT_SESSION_TOKEN_BYTES
  ).toString(
    "base64url"
  );
}

export function hashApplicantSessionToken(
  token: string
): string {
  return createHash(
    "sha256"
  )
    .update(token)
    .digest("hex");
}