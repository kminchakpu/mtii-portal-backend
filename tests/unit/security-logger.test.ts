import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  logServerError,
} from "@/lib/security/server-error-logger";

describe(
  "server error logger",
  () => {
    let consoleError:
      ReturnType<
        typeof vi.spyOn
      >;

    beforeEach(() => {
      consoleError =
        vi.spyOn(
          console,
          "error"
        );

      consoleError.mockImplementation(
        () => undefined
      );
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      consoleError.mockRestore();
    });

    it(
      "does not log the raw error in production",
      () => {
        const error =
          new Error(
            "Database connection failed for secret-host.internal"
          );

        logServerError(
          "Staff login failed.",
          error,
          "production"
        );

        expect(
          consoleError
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          consoleError
        ).toHaveBeenCalledWith(
          "Staff login failed."
        );

        expect(
          consoleError
        ).not.toHaveBeenCalledWith(
          "Staff login failed.",
          error
        );
      }
    );

    it(
      "does not expose the error message in production",
      () => {
        const sensitiveMessage =
          "Access denied for DB_USER at DB_HOST";

        logServerError(
          "Current staff lookup failed.",
          new Error(
            sensitiveMessage
          ),
          "production"
        );

        const loggedValues =
          consoleError.mock.calls
            .flat()
            .map(String)
            .join(" ");

        expect(
          loggedValues
        ).not.toContain(
          sensitiveMessage
        );
      }
    );

    it(
      "logs the error object outside production for debugging",
      () => {
        const error =
          new Error(
            "Development database failure"
          );

        logServerError(
          "Staff login failed.",
          error,
          "development"
        );

        expect(
          consoleError
        ).toHaveBeenCalledWith(
          "Staff login failed.",
          error
        );
      }
    );

    it(
      "uses the current environment when none is supplied",
      () => {
        vi.stubEnv(
          "NODE_ENV",
          "production"
        );

        const error =
          new Error(
            "Sensitive production failure"
          );

        logServerError(
          "Staff logout failed.",
          error
        );

        expect(
          consoleError
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          consoleError
        ).toHaveBeenCalledWith(
          "Staff logout failed."
        );

        expect(
          consoleError
        ).not.toHaveBeenCalledWith(
          "Staff logout failed.",
          error
        );
      }
    );
  }
);