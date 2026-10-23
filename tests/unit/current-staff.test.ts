import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  dbExecute:
    vi.fn(),
}));

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization:
      mocks.getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute:
        mocks.dbExecute,
    },
  })
);

import {
  getCurrentStaff,
} from "@/lib/staff-ui/current-staff";

describe(
  "current staff resolver",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns the authenticated staff profile and authorization context", async () => {
      mocks.getRequestAuthorization
        .mockResolvedValue({
          userId: 7,
          publicId:
            "11111111-1111-4111-8111-111111111111",
          departmentId: 2,
          departmentCode:
            "TRADE",
          roles: [
            "REVIEW_OFFICER",
          ],
          permissions: [
            "APPLICATION_VIEW",
            "APPLICATION_REVIEW",
          ],
        });

      mocks.dbExecute
        .mockResolvedValue([
          [
            {
              first_name:
                "Amina",
              last_name:
                "Ibrahim",
              email:
                "amina@example.com",
            },
          ],
          [],
        ]);

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

      const staff =
        await getCurrentStaff(
          request
        );

      expect(
        mocks.getRequestAuthorization
      ).toHaveBeenCalledWith(
        request
      );

      expect(
        mocks.dbExecute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "FROM users"
        ),
        [7]
      );

      expect(staff).toEqual({
        publicId:
          "11111111-1111-4111-8111-111111111111",
        firstName:
          "Amina",
        lastName:
          "Ibrahim",
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
      });
    });

    it("returns null when the authenticated user profile no longer exists", async () => {
      mocks.getRequestAuthorization
        .mockResolvedValue({
          userId: 7,
          publicId:
            "11111111-1111-4111-8111-111111111111",
          departmentId: 2,
          departmentCode:
            "TRADE",
          roles: [
            "REVIEW_OFFICER",
          ],
          permissions: [
            "APPLICATION_VIEW",
          ],
        });

      mocks.dbExecute
        .mockResolvedValue([
          [],
          [],
        ]);

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard"
        );

      const staff =
        await getCurrentStaff(
          request
        );

      expect(staff).toBeNull();
    });

    it("does not hide authentication failures", async () => {
      const authenticationError =
        new Error(
          "Unauthenticated."
        );

      mocks.getRequestAuthorization
        .mockRejectedValue(
          authenticationError
        );

      const request =
        new Request(
          "https://portal.example.com/staff/dashboard"
        );

      await expect(
        getCurrentStaff(request)
      ).rejects.toBe(
        authenticationError
      );

      expect(
        mocks.dbExecute
      ).not.toHaveBeenCalled();
    });
  }
);