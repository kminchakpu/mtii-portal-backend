import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getCurrentApplicant,
} = vi.hoisted(() => ({
  getCurrentApplicant:
    vi.fn(),
}));

vi.mock(
  "@/lib/applicant-auth/current-applicant",
  () => ({
    getCurrentApplicant,
  })
);

describe(
  "applicant access",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns the current authenticated applicant", async () => {
      const applicant = {
        id: 42,
        publicId:
          "11111111-1111-4111-8111-111111111111",
        firstName: "Grace",
        lastName: "Musa",
        email:
          "grace@example.com",
      };

      getCurrentApplicant
        .mockResolvedValue(
          applicant
        );

      const {
        requireCurrentApplicant,
      } = await import(
        "@/lib/applicant-ui/applicant-access"
      );

      const request =
        new Request(
          "http://localhost:3000/applicant/dashboard"
        );

      await expect(
        requireCurrentApplicant(
          request
        )
      ).resolves.toEqual(
        applicant
      );

      expect(
        getCurrentApplicant
      ).toHaveBeenCalledWith(
        request
      );
    });

    it("throws an authentication error when there is no current applicant", async () => {
      getCurrentApplicant
        .mockResolvedValue(
          null
        );

      const {
        ApplicantUnauthenticatedError,
        requireCurrentApplicant,
      } = await import(
        "@/lib/applicant-ui/applicant-access"
      );

      const request =
        new Request(
          "http://localhost:3000/applicant/dashboard"
        );

      await expect(
        requireCurrentApplicant(
          request
        )
      ).rejects.toBeInstanceOf(
        ApplicantUnauthenticatedError
      );
    });

    it("does not hide unexpected current-applicant failures", async () => {
      const databaseError =
        new Error(
          "Database unavailable"
        );

      getCurrentApplicant
        .mockRejectedValue(
          databaseError
        );

      const {
        requireCurrentApplicant,
      } = await import(
        "@/lib/applicant-ui/applicant-access"
      );

      const request =
        new Request(
          "http://localhost:3000/applicant/dashboard"
        );

      await expect(
        requireCurrentApplicant(
          request
        )
      ).rejects.toBe(
        databaseError
      );
    });
  }
);