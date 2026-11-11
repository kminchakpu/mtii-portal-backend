import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getAppUrl: vi.fn(),
}));

vi.mock(
  "next/headers",
  () => ({
    headers:
      mocks.headers,
  })
);

vi.mock(
  "@/lib/config/app-url",
  () => ({
    getAppUrl:
      mocks.getAppUrl,
  })
);

describe(
  "applicant server request",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getAppUrl
        .mockReturnValue(
          "https://portal.example.com"
        );

      mocks.headers
        .mockResolvedValue(
          new Headers({
            cookie:
              "mtii_applicant_session=applicant-token",
            "user-agent":
              "Vitest",
          })
        );
    });

    it("creates a GET request for an applicant route", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      const request =
        await createApplicantServerRequest(
          "/applicant/dashboard"
        );

      expect(
        request.method
      ).toBe("GET");

      expect(
        request.url
      ).toBe(
        "https://portal.example.com/applicant/dashboard"
      );
    });

    it("copies the incoming request headers including the applicant session cookie", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      const request =
        await createApplicantServerRequest(
          "/applicant/dashboard"
        );

      expect(
        request.headers.get(
          "cookie"
        )
      ).toBe(
        "mtii_applicant_session=applicant-token"
      );

      expect(
        request.headers.get(
          "user-agent"
        )
      ).toBe(
        "Vitest"
      );
    });

    it("uses the configured application URL as the request origin", async () => {
      mocks.getAppUrl
        .mockReturnValue(
          "https://api.mtiinasarawa.com.ng"
        );

      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      const request =
        await createApplicantServerRequest(
          "/applicant"
        );

      expect(
        request.url
      ).toBe(
        "https://api.mtiinasarawa.com.ng/applicant"
      );

      expect(
        mocks.getAppUrl
      ).toHaveBeenCalledTimes(
        1
      );
    });

    it("allows the applicant root path", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      await expect(
        createApplicantServerRequest(
          "/applicant"
        )
      ).resolves.toBeInstanceOf(
        Request
      );
    });

    it("allows nested applicant paths", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      await expect(
        createApplicantServerRequest(
          "/applicant/applications/new"
        )
      ).resolves.toBeInstanceOf(
        Request
      );
    });

    it("rejects staff paths", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      await expect(
        createApplicantServerRequest(
          "/staff/dashboard"
        )
      ).rejects.toThrow(
        "Applicant server requests must use an /applicant path."
      );

      expect(
        mocks.headers
      ).not.toHaveBeenCalled();
    });

    it("rejects paths that merely begin with the applicant text", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      await expect(
        createApplicantServerRequest(
          "/applicant-admin"
        )
      ).rejects.toThrow(
        "Applicant server requests must use an /applicant path."
      );

      expect(
        mocks.headers
      ).not.toHaveBeenCalled();
    });

    it("rejects unrelated public paths", async () => {
      const {
        createApplicantServerRequest,
      } = await import(
        "@/lib/applicant-ui/applicant-server-request"
      );

      await expect(
        createApplicantServerRequest(
          "/"
        )
      ).rejects.toThrow(
        "Applicant server requests must use an /applicant path."
      );

      expect(
        mocks.headers
      ).not.toHaveBeenCalled();
    });
  }
);