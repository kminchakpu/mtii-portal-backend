import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  execute,
  getApplicantSessionConfig,
  hashApplicantSessionToken,
} = vi.hoisted(() => ({
  execute: vi.fn(),
  getApplicantSessionConfig:
    vi.fn(),
  hashApplicantSessionToken:
    vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute,
    },
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-config",
  () => ({
    getApplicantSessionConfig,
  })
);

vi.mock(
  "@/lib/applicant-auth/applicant-session-token",
  () => ({
    hashApplicantSessionToken,
  })
);

describe(
  "current applicant authentication",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getApplicantSessionConfig
        .mockReturnValue({
          cookieName:
            "mtii_applicant_session",
          ttlDays: 7,
        });

      hashApplicantSessionToken
        .mockReturnValue(
          "hashed-applicant-session-token"
        );
    });

    it("returns the authenticated applicant for a valid applicant session", async () => {
      execute.mockResolvedValue([
        [
          {
            id: 25,
            public_id:
              "applicant-public-id",
            first_name:
              "Amina",
            last_name:
              "Ibrahim",
            email:
              "amina@example.com",
          },
        ],
      ]);

      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_applicant_session=opaque-applicant-session-token",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        getApplicantSessionConfig
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        hashApplicantSessionToken
      ).toHaveBeenCalledWith(
        "opaque-applicant-session-token"
      );

      expect(
        execute
      ).toHaveBeenCalledTimes(
        1
      );

      const [
        sql,
        parameters,
      ] = execute.mock.calls[0];

      expect(sql).toContain(
        "FROM applicant_sessions"
      );

      expect(sql).toContain(
        "INNER JOIN applicants"
      );

      expect(sql).toContain(
        "s.token_hash = ?"
      );

      expect(sql).toContain(
        "s.revoked_at IS NULL"
      );

      expect(sql).toContain(
        "s.expires_at > NOW()"
      );

      expect(sql).toContain(
        "a.is_active = TRUE"
      );

      expect(sql).toContain(
        "a.email_verified_at IS NOT NULL"
      );

      expect(sql).not.toContain(
        "password_hash"
      );

      expect(
        parameters
      ).toEqual([
        "hashed-applicant-session-token",
      ]);

      expect(
        applicant
      ).toEqual({
        id: 25,
        publicId:
          "applicant-public-id",
        firstName:
          "Amina",
        lastName:
          "Ibrahim",
        email:
          "amina@example.com",
      });

      expect(
        applicant
      ).not.toHaveProperty(
        "passwordHash"
      );
    });

    it("returns null when the applicant session cookie is missing", async () => {
      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me"
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        applicant
      ).toBeNull();

      expect(
        hashApplicantSessionToken
      ).not.toHaveBeenCalled();

      expect(
        execute
      ).not.toHaveBeenCalled();
    });

    it("returns null when the configured applicant session cookie is blank", async () => {
      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_applicant_session=",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        applicant
      ).toBeNull();

      expect(
        hashApplicantSessionToken
      ).not.toHaveBeenCalled();

      expect(
        execute
      ).not.toHaveBeenCalled();
    });

    it("uses the configured applicant cookie name", async () => {
      getApplicantSessionConfig
        .mockReturnValue({
          cookieName:
            "custom_applicant_cookie",
          ttlDays: 7,
        });

      execute.mockResolvedValue([
        [
          {
            id: 25,
            public_id:
              "applicant-public-id",
            first_name:
              "Amina",
            last_name:
              "Ibrahim",
            email:
              "amina@example.com",
          },
        ],
      ]);

      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_applicant_session=wrong-token; custom_applicant_cookie=correct-token",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        hashApplicantSessionToken
      ).toHaveBeenCalledWith(
        "correct-token"
      );

      expect(
        applicant
      ).not.toBeNull();
    });

    it("does not accept the staff session cookie as applicant authentication", async () => {
      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_staff_session=staff-session-token",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        applicant
      ).toBeNull();

      expect(
        hashApplicantSessionToken
      ).not.toHaveBeenCalled();

      expect(
        execute
      ).not.toHaveBeenCalled();
    });

    it("returns null when the applicant session is invalid, expired, revoked, inactive, or unverified", async () => {
      execute.mockResolvedValue([
        [],
      ]);

      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_applicant_session=invalid-session-token",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        hashApplicantSessionToken
      ).toHaveBeenCalledWith(
        "invalid-session-token"
      );

      expect(
        applicant
      ).toBeNull();
    });

    it("selects from applicant_sessions rather than the staff sessions table", async () => {
      execute.mockResolvedValue([
        [],
      ]);

      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "mtii_applicant_session=applicant-token",
            },
          }
        );

      await getCurrentApplicant(
        request
      );

      const [
        sql,
      ] = execute.mock.calls[0];

      expect(sql).toContain(
        "FROM applicant_sessions"
      );

      expect(sql).not.toMatch(
        /\bFROM\s+sessions\b/i
      );
    });

    it("parses the applicant cookie correctly when multiple cookies are present", async () => {
      execute.mockResolvedValue([
        [
          {
            id: 25,
            public_id:
              "applicant-public-id",
            first_name:
              "Amina",
            last_name:
              "Ibrahim",
            email:
              "amina@example.com",
          },
        ],
      ]);

      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "theme=dark; mtii_applicant_session=correct-token; locale=en",
            },
          }
        );

      await getCurrentApplicant(
        request
      );

      expect(
        hashApplicantSessionToken
      ).toHaveBeenCalledWith(
        "correct-token"
      );
    });

    it("does not mistake a similarly named cookie for the applicant session cookie", async () => {
      const {
        getCurrentApplicant,
      } = await import(
        "@/lib/applicant-auth/current-applicant"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            headers: {
              cookie:
                "old_mtii_applicant_session=wrong-token",
            },
          }
        );

      const applicant =
        await getCurrentApplicant(
          request
        );

      expect(
        applicant
      ).toBeNull();

      expect(
        hashApplicantSessionToken
      ).not.toHaveBeenCalled();

      expect(
        execute
      ).not.toHaveBeenCalled();
    });
  }
);