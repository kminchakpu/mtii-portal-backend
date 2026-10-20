import {
  getSessionConfig,
} from "@/lib/auth/session-config";
import {
  findStaffSessionByToken,
} from "@/lib/auth/session-repository";
import {
  readRequestCookie,
} from "@/lib/auth/request-cookie";
import {
  getAuthorizationContext,
} from "./authorization-repository";
import type {
  AuthorizationContext,
} from "./authorization";
import {
  UnauthenticatedError,
} from "./errors";

export async function getRequestAuthorization(
  request: Request
): Promise<AuthorizationContext> {
  const { cookieName } =
    getSessionConfig();

  const token = readRequestCookie(
    request,
    cookieName
  );

  if (!token) {
    throw new UnauthenticatedError();
  }

  const session =
    await findStaffSessionByToken(
      token
    );

  if (!session) {
    throw new UnauthenticatedError();
  }

  const context =
    await getAuthorizationContext(
      session.userId
    );

  if (!context) {
    throw new UnauthenticatedError();
  }

  return context;
}