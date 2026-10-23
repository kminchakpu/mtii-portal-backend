import {
  createHash,
} from "node:crypto";

const UNKNOWN_CLIENT_IP =
  "unknown";

export function getStaffLoginClientIp(
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

export function createStaffLoginRateLimitKey(
  request: Request,
  email: string
): string {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const clientIp =
    getStaffLoginClientIp(
      request
    );

  return createHash("sha256")
    .update(
      `${normalizedEmail}|${clientIp}`
    )
    .digest("hex");
}