import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

export function handleAuthorizationError(
  error: unknown
): NextResponse | null {
  if (
    error instanceof
    UnauthenticatedError
  ) {
    return NextResponse.json(
      {
        error: "Unauthenticated.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    error instanceof ForbiddenError
  ) {
    return NextResponse.json(
      {
        error: "Forbidden.",
      },
      {
        status: 403,
      }
    );
  }

  return null;
}