import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentStaff:
    vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/current-staff",
  () => ({
    getCurrentStaff:
      mocks.getCurrentStaff,
  })
);

import {
  requireCurrentStaff,
} from "@/lib/staff-ui/staff-access";
import {
  UnauthenticatedError,
} from "@/lib/rbac/errors";

describe(
  "protected staff access",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns the authenticated staff member", async () => {
      const staff = {
        publicId:
          "11111111-1111-4111-8111-111111111111",
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        departmentCode:
          "TRADE",
        roles: [
          "REVIEW_OFFICER",
        ],
        permissions: [
          "APPLICATION_VIEW",
          "APPLICATION_REVIEW",
        ],
      };

      mocks.getCurrentStaff
        .mockResolvedValue(staff);

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard",
          {
            headers: {
              cookie:
                "mtii_staff_session=test-token",
            },
          }
        );

      await expect(
        requireCurrentStaff(
          request
        )
      ).resolves.toEqual(
        staff
      );

      expect(
        mocks.getCurrentStaff
      ).toHaveBeenCalledWith(
        request
      );
    });

    it("throws UnauthenticatedError when the staff profile cannot be resolved", async () => {
      mocks.getCurrentStaff
        .mockResolvedValue(null);

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard"
        );

      await expect(
        requireCurrentStaff(
          request
        )
      ).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
    });

    it("preserves authentication failures from session validation", async () => {
      const error =
        new UnauthenticatedError();

      mocks.getCurrentStaff
        .mockRejectedValue(
          error
        );

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard"
        );

      await expect(
        requireCurrentStaff(
          request
        )
      ).rejects.toBe(
        error
      );
    });

    it("does not hide unexpected server failures", async () => {
      const error =
        new Error(
          "Database unavailable"
        );

      mocks.getCurrentStaff
        .mockRejectedValue(
          error
        );

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard"
        );

      await expect(
        requireCurrentStaff(
          request
        )
      ).rejects.toBe(
        error
      );
    });
  }
);