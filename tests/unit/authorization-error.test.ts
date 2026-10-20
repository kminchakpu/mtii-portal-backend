import {
  describe,
  expect,
  it,
} from "vitest";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

describe(
  "authorization error handler",
  () => {
    it("returns 401 for unauthenticated requests", async () => {
      const response =
        handleAuthorizationError(
          new UnauthenticatedError()
        );

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);

      await expect(
        response?.json()
      ).resolves.toEqual({
        error: "Unauthenticated.",
      });
    });

    it("returns 403 for forbidden requests", async () => {
      const response =
        handleAuthorizationError(
          new ForbiddenError()
        );

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      await expect(
        response?.json()
      ).resolves.toEqual({
        error: "Forbidden.",
      });
    });

    it("returns null for unexpected errors", () => {
      const response =
        handleAuthorizationError(
          new Error(
            "Database unavailable"
          )
        );

      expect(response).toBeNull();
    });
  }
);