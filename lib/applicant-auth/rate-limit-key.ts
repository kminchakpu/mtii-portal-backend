import {
  createHash,
} from "node:crypto";

const UNKNOWN_CLIENT_IP =
  "unknown";

function hashRateLimitIdentity(
  namespace: "ip" | "email",
  value: string
): string {
  return createHash(
    "sha256"
  )
    .update(
      `${namespace}|${value}`
    )
    .digest(
      "hex"
    );
}

export function getApplicantAuthClientIp(
  request: Request
): string {
  const realIp =
    request.headers.get(
      "x-real-ip"
    );

  if (!realIp) {
    return UNKNOWN_CLIENT_IP;
  }

  const normalizedIp =
    realIp.trim();

  if (!normalizedIp) {
    return UNKNOWN_CLIENT_IP;
  }

  return normalizedIp;
}

export function createApplicantAuthIpRateLimitKey(
  request: Request
): string {
  const clientIp =
    getApplicantAuthClientIp(
      request
    );

  return hashRateLimitIdentity(
    "ip",
    clientIp
  );
}

export function createApplicantAuthEmailRateLimitKey(
  email: string
): string {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  return hashRateLimitIdentity(
    "email",
    normalizedEmail
  );
}