import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  StaffLoginError,
  loginStaff,
  logoutStaff,
} from "@/lib/staff-ui/staff-auth-client";

describe(
  "staff auth client",
  () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        fetchMock
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it("submits staff credentials to the login endpoint", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
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
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      const result =
        await loginStaff({
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        });

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
          }),
        }
      );

      expect(result).toEqual({
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
      });
    });

    it("throws the API error message when login fails", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Invalid email or password.",
          }),
          {
            status: 401,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        loginStaff({
          email:
            "amina@example.com",
          password: "wrong",
        })
      ).rejects.toEqual(
        new StaffLoginError(
          "Invalid email or password.",
          401
        )
      );
    });

    it("uses a safe fallback when the login error response is not valid JSON", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          "Service unavailable",
          {
            status: 503,
          }
        )
      );

      await expect(
        loginStaff({
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        })
      ).rejects.toEqual(
        new StaffLoginError(
          "Unable to sign in at this time.",
          503
        )
      );
    });

    it("posts to the logout endpoint", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await logoutStaff();

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/auth/logout",
        {
          method: "POST",
        }
      );
    });

    it("throws when logout fails", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Unable to sign out at this time.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        logoutStaff()
      ).rejects.toThrow(
        "Unable to sign out at this time."
      );
    });
  }
);