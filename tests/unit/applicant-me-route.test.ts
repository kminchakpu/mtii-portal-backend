import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getCurrentApplicant,
  logServerError,
} = vi.hoisted(() => ({
  getCurrentApplicant:
    vi.fn(),
  logServerError:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/current-applicant",
  () => ({
    getCurrentApplicant,
  })
);

vi.mock(
  "@/lib/security/server-error-logger",
  () => ({
    logServerError,
  })
);

describe(
  "applicant current-user route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns the authenticated applicant", async () => {
      getCurrentApplicant
        .mockResolvedValue({
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

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            method: "GET",
            headers: {
              cookie:
                "mtii_applicant_session=opaque-session-token",
            },
          }
        );

      const response =
        await GET(
          request
        );

      expect(
        getCurrentApplicant
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        getCurrentApplicant
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        response.status
      ).toBe(
        200
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        applicant: {
          publicId:
            "applicant-public-id",
          firstName:
            "Amina",
          lastName:
            "Ibrahim",
          email:
            "amina@example.com",
        },
      });

      expect(
        logServerError
      ).not.toHaveBeenCalled();
    });

    it("does not expose the internal numeric applicant id", async () => {
      getCurrentApplicant
        .mockResolvedValue({
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

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            method: "GET",
          }
        );

      const response =
        await GET(
          request
        );

      const body =
        await response.json();

      expect(
        body.applicant
      ).not.toHaveProperty(
        "id"
      );

      expect(
        JSON.stringify(
          body
        )
      ).not.toContain(
        '"id":25'
      );
    });

    it("returns 401 when there is no authenticated applicant", async () => {
      getCurrentApplicant
        .mockResolvedValue(
          null
        );

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            method: "GET",
          }
        );

      const response =
        await GET(
          request
        );

      expect(
        getCurrentApplicant
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        response.status
      ).toBe(
        401
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Authentication required.",
      });

      expect(
        logServerError
      ).not.toHaveBeenCalled();
    });

    it("returns 401 for an invalid, expired, revoked, inactive, or unverified applicant session", async () => {
      getCurrentApplicant
        .mockResolvedValue(
          null
        );

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            method: "GET",
            headers: {
              cookie:
                "mtii_applicant_session=invalid-session-token",
            },
          }
        );

      const response =
        await GET(
          request
        );

      expect(
        response.status
      ).toBe(
        401
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Authentication required.",
      });
    });

    it("does not authenticate a staff session when applicant authentication returns null", async () => {
      getCurrentApplicant
        .mockResolvedValue(
          null
        );

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
          {
            method: "GET",
            headers: {
              cookie:
                "mtii_staff_session=staff-session-token",
            },
          }
        );

      const response =
        await GET(
          request
        );

      expect(
        getCurrentApplicant
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        response.status
      ).toBe(
        401
      );

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Authentication required.",
      });
    });

    it("returns a safe server error when current-applicant lookup fails", async () => {
      const internalError =
        new Error(
          "mysql://secret-user:secret-password@database/app"
        );

      getCurrentApplicant
        .mockRejectedValue(
          internalError
        );

      const {
        GET,
      } = await import(
        "@/app/api/applicant/auth/me/route"
      );

      const request =
        new Request(
          "http://localhost/api/applicant/auth/me",
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
        500
      );

      const body =
        await response.json();

      expect(
        body
      ).toEqual({
        error:
          "Unable to retrieve the applicant account at this time.",
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
        "Applicant current-user lookup failed.",
        internalError
      );
    });
  }
);