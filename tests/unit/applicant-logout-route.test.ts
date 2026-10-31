import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  enforceApplicantRequestOrigin,
  revokeApplicantSession,
  getApplicantSessionConfig,
  logServerError,
} = vi.hoisted(() => ({
  enforceApplicantRequestOrigin:
    vi.fn(),
  revokeApplicantSession:
    vi.fn(),
  getApplicantSessionConfig:
    vi.fn(),
  logServerError:
    vi.fn(),
}));

class MockApplicantCrossSiteRequestError
  extends Error {
  constructor(
    message =
      "Cross-site request blocked."
  ) {
    super(message);
    this.name =
      "ApplicantCrossSiteRequestError";
  }
}

vi.mock(
  "@/lib/http/applicant-request-security",
  () => ({
    ApplicantCrossSiteRequestError:
      MockApplicantCrossSiteRequestError,
    enforceApplicantRequestOrigin,
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-repository",
  () => ({
    revokeApplicantSession,
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-config",
  () => ({
    getApplicantSessionConfig,
  })
);

vi.mock(
  "@/lib/security/server-error-logger",
  () => ({
    logServerError,
  })
);

describe(
  "applicant logout route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getApplicantSessionConfig
        .mockReturnValue({
          cookieName:
            "mtii_applicant_session",
          ttlDays: 7,
        });

      revokeApplicantSession
        .mockResolvedValue(
          true
        );
    });

    it("revokes the current applicant session and clears the applicant cookie", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "mtii_applicant_session=opaque-applicant-session-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        enforceApplicantRequestOrigin
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        enforceApplicantRequestOrigin
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledWith(
        "opaque-applicant-session-token"
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
          "Signed out successfully.",
      });

      const setCookie =
        response.headers.get(
          "set-cookie"
        );

      expect(
        setCookie
      ).not.toBeNull();

      expect(
        setCookie
      ).toContain(
        "mtii_applicant_session="
      );

      expect(
        setCookie?.toLowerCase()
      ).toContain(
        "httponly"
      );

      expect(
        setCookie?.toLowerCase()
      ).toContain(
        "samesite=lax"
      );

      expect(
        setCookie
      ).toContain(
        "Path=/"
      );

      expect(
        logServerError
      ).not.toHaveBeenCalled();
    });

    it("uses the configured applicant session cookie name", async () => {
      getApplicantSessionConfig
        .mockReturnValue({
          cookieName:
            "custom_applicant_session",
          ttlDays: 7,
        });

      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "mtii_applicant_session=wrong-token; custom_applicant_session=correct-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledWith(
        "correct-token"
      );

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "custom_applicant_session="
      );
    });

    it("succeeds and clears the applicant cookie when no applicant session exists", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        enforceApplicantRequestOrigin
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        revokeApplicantSession
      ).not.toHaveBeenCalled();

      expect(
        response.status
      ).toBe(
        200
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        message:
          "Signed out successfully.",
      });

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "mtii_applicant_session="
      );
    });

    it("does not revoke a staff session", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "mtii_staff_session=staff-session-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        revokeApplicantSession
      ).not.toHaveBeenCalled();

      expect(
        response.status
      ).toBe(
        200
      );

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toContain(
        "mtii_applicant_session="
      );
    });

    it("parses the applicant cookie correctly when multiple cookies are present", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "theme=dark; mtii_applicant_session=correct-token; locale=en",
            },
          }
        );

      await POST(
        request
      );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        revokeApplicantSession
      ).toHaveBeenCalledWith(
        "correct-token"
      );
    });

    it("does not mistake a similarly named cookie for the applicant session cookie", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "old_mtii_applicant_session=wrong-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        revokeApplicantSession
      ).not.toHaveBeenCalled();

      expect(
        response.status
      ).toBe(
        200
      );
    });

    it("rejects a cross-site logout request without revoking the session", async () => {
      enforceApplicantRequestOrigin
        .mockImplementation(
          () => {
            throw new MockApplicantCrossSiteRequestError(
              "Cross-site request blocked."
            );
          }
        );

      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "https://attacker.example",
              cookie:
                "mtii_applicant_session=applicant-session-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        enforceApplicantRequestOrigin
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        revokeApplicantSession
      ).not.toHaveBeenCalled();

      expect(
        response.status
      ).toBe(
        403
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Cross-site request blocked.",
      });

      expect(
        logServerError
      ).not.toHaveBeenCalled();
    });

    it("returns a safe server error when session revocation fails", async () => {
      const internalError =
        new Error(
          "mysql://secret-user:secret-password@database/app"
        );

      revokeApplicantSession
        .mockRejectedValue(
          internalError
        );

      const {
        POST,
      } = await import(
        "@/app/api/applicant/auth/logout/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/logout",
          {
            method: "POST",
            headers: {
              origin:
                "http://localhost",
              cookie:
                "mtii_applicant_session=applicant-session-token",
            },
          }
        );

      const response =
        await POST(
          request
        );

      expect(
        response.status
      ).toBe(
        500
      );

      const body =
        await response.json();

      expect(
        body
      ).toEqual({
        error:
          "Unable to sign out at this time.",
      });

      expect(
        JSON.stringify(
          body
        )
      ).not.toContain(
        "secret-password"
      );

      expect(
        JSON.stringify(
          body
        )
      ).not.toContain(
        "mysql://"
      );

      expect(
        logServerError
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        logServerError
      ).toHaveBeenCalledWith(
        "Applicant logout failed.",
        internalError
      );
    });
  }
);