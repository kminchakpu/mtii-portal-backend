import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(
  () => ({
    verifyApplicantEmail:
      vi.fn(),
    logServerError:
      vi.fn(),
  })
);

vi.mock(
  "@/lib/applicant-auth/verification-service",
  () => ({
    verifyApplicantEmail:
      mocks.verifyApplicantEmail,
  })
);

vi.mock(
  "@/lib/security/server-error-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  })
);

import {
  ApplicantVerificationError,
} from "@/lib/applicant-auth/errors";
import {
  GET,
} from "@/app/api/applicant/auth/verify-email/route";

function createRequest(
  token?: string
): Request {
  const url =
    new URL(
      "http://localhost:3000/api/applicant/auth/verify-email"
    );

  if (token !== undefined) {
    url.searchParams.set(
      "token",
      token
    );
  }

  return new Request(
    url,
    {
      method: "GET",
    }
  );
}

describe(
  "GET /api/applicant/auth/verify-email",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it(
      "verifies the applicant email and returns a success response",
      async () => {
        mocks.verifyApplicantEmail.mockResolvedValue(
          undefined
        );

        const response =
          await GET(
            createRequest(
              "valid-verification-token"
            )
          );

        expect(
          response.status
        ).toBe(
          200
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          message:
            "Email verified successfully. You can now sign in.",
        });

        expect(
          mocks.verifyApplicantEmail
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.verifyApplicantEmail
        ).toHaveBeenCalledWith(
          "valid-verification-token"
        );
      }
    );

    it(
      "rejects a request without a verification token",
      async () => {
        const response =
          await GET(
            createRequest()
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid or expired verification link.",
        });

        expect(
          mocks.verifyApplicantEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an empty verification token",
      async () => {
        const request =
          new Request(
            "http://localhost:3000/api/applicant/auth/verify-email?token=",
            {
              method: "GET",
            }
          );

        const response =
          await GET(
            request
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid or expired verification link.",
        });

        expect(
          mocks.verifyApplicantEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a whitespace-only verification token",
      async () => {
        const response =
          await GET(
            createRequest(
              "   "
            )
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid or expired verification link.",
        });

        expect(
          mocks.verifyApplicantEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns a safe error for an invalid or expired verification token",
      async () => {
        mocks.verifyApplicantEmail.mockRejectedValue(
          new ApplicantVerificationError()
        );

        const response =
          await GET(
            createRequest(
              "invalid-token"
            )
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid or expired verification link.",
        });

        expect(
          mocks.logServerError
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns the same safe error for an already consumed verification token",
      async () => {
        mocks.verifyApplicantEmail.mockRejectedValue(
          new ApplicantVerificationError()
        );

        const response =
          await GET(
            createRequest(
              "consumed-token"
            )
          );

        expect(
          response.status
        ).toBe(
          400
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Invalid or expired verification link.",
        });

        expect(
          mocks.logServerError
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "does not expose the verification token in the success response",
      async () => {
        const token =
          "secret-verification-token";

        mocks.verifyApplicantEmail.mockResolvedValue(
          undefined
        );

        const response =
          await GET(
            createRequest(
              token
            )
          );

        const body =
          await response.text();

        expect(
          body
        ).not.toContain(
          token
        );
      }
    );

    it(
      "logs unexpected failures safely and returns a generic server error",
      async () => {
        const error =
          new Error(
            "database connection failed"
          );

        mocks.verifyApplicantEmail.mockRejectedValue(
          error
        );

        const response =
          await GET(
            createRequest(
              "verification-token"
            )
          );

        expect(
          response.status
        ).toBe(
          500
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          error:
            "Unable to verify email at this time.",
        });

        expect(
          mocks.logServerError
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.logServerError
        ).toHaveBeenCalledWith(
          "Applicant email verification failed.",
          error
        );
      }
    );

    it(
      "does not expose internal error details",
      async () => {
        mocks.verifyApplicantEmail.mockRejectedValue(
          new Error(
            "SQL connection refused for applicant 123"
          )
        );

        const response =
          await GET(
            createRequest(
              "verification-token"
            )
          );

        const body =
          await response.text();

        expect(
          response.status
        ).toBe(
          500
        );

        expect(
          body
        ).not.toContain(
          "SQL connection refused"
        );

        expect(
          body
        ).not.toContain(
          "applicant 123"
        );
      }
    );
  }
);