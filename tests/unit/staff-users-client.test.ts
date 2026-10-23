import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createStaffUser,
  getStaffUsers,
  updateStaffUser,
} from "@/lib/staff-ui/staff-users-client";

const fetchMock = vi.fn();

const staffUsers = [
  {
    publicId:
      "11111111-1111-4111-8111-111111111111",
    department: {
      publicId:
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      code: "TRADE",
      name: "Trade Department",
    },
    firstName: "Amina",
    lastName: "Ibrahim",
    email: "amina@example.com",
    isActive: true,
    lastLoginAt:
      "2026-10-20T10:00:00.000Z",
    passwordChangedAt:
      "2026-10-01T08:00:00.000Z",
    createdAt:
      "2026-09-01T08:00:00.000Z",
    updatedAt:
      "2026-10-20T10:00:00.000Z",
    roles: [
      "DEPARTMENT_ADMIN",
    ],
  },
  {
    publicId:
      "22222222-2222-4222-8222-222222222222",
    department: null,
    firstName: "Grace",
    lastName: "John",
    email: "grace@example.com",
    isActive: false,
    lastLoginAt: null,
    passwordChangedAt: null,
    createdAt:
      "2026-09-15T08:00:00.000Z",
    updatedAt:
      "2026-10-18T08:00:00.000Z",
    roles: [],
  },
];

describe(
  "staff users client",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      vi.stubGlobal(
        "fetch",
        fetchMock
      );
    });

    it("loads staff users", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            users: staffUsers,
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
        await getStaffUsers();

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/users",
        {
          method: "GET",
        }
      );

      expect(result).toEqual(
        staffUsers
      );
    });

    it("throws the API error when staff users cannot be loaded", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Forbidden.",
          }),
          {
            status: 403,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        getStaffUsers()
      ).rejects.toThrow(
        "Forbidden."
      );
    });

    it("uses a safe error when loading staff users returns invalid JSON", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          "Not JSON",
          {
            status: 500,
          }
        )
      );

      await expect(
        getStaffUsers()
      ).rejects.toThrow(
        "Unable to load staff users."
      );
    });

    it("creates a staff user", async () => {
      const input = {
        firstName: "Musa",
        lastName: "Abdullahi",
        email:
          "musa@example.com",
        password:
          "TemporaryPassword123!",
        departmentPublicId:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      };

      const createdUser = {
        ...staffUsers[0],
        publicId:
          "33333333-3333-4333-8333-333333333333",
        firstName: "Musa",
        lastName:
          "Abdullahi",
        email:
          "musa@example.com",
        lastLoginAt: null,
        roles: [],
      };

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: createdUser,
          }),
          {
            status: 201,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      const result =
        await createStaffUser(
          input
        );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/users",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            input
          ),
        }
      );

      expect(result).toEqual(
        createdUser
      );
    });

    it("supports creating an unassigned staff user", async () => {
      const input = {
        firstName: "Grace",
        lastName: "John",
        email:
          "grace@example.com",
        password:
          "TemporaryPassword123!",
        departmentPublicId:
          null,
      };

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: staffUsers[1],
          }),
          {
            status: 201,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await createStaffUser(
        input
      );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(
            input
          ),
        })
      );
    });

    it("throws the API error when staff creation fails", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Staff email already exists.",
          }),
          {
            status: 409,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        createStaffUser({
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "TemporaryPassword123!",
          departmentPublicId:
            "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        })
      ).rejects.toThrow(
        "Staff email already exists."
      );
    });

    it("uses a safe error when staff creation returns invalid JSON", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          "Internal error",
          {
            status: 500,
          }
        )
      );

      await expect(
        createStaffUser({
          firstName: "Musa",
          lastName: "Abdullahi",
          email:
            "musa@example.com",
          password:
            "TemporaryPassword123!",
          departmentPublicId:
            null,
        })
      ).rejects.toThrow(
        "Unable to create staff user."
      );
    });

    it("updates a staff user", async () => {
      const input = {
        firstName: "Amina",
        lastName:
          "Ibrahim Musa",
        email:
          "amina@example.com",
        departmentPublicId:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        isActive: false,
      };

      const updatedUser = {
        ...staffUsers[0],
        lastName:
          "Ibrahim Musa",
        isActive: false,
      };

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: updatedUser,
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
        await updateStaffUser(
          staffUsers[0].publicId,
          input
        );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        `/api/staff/users/${staffUsers[0].publicId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            input
          ),
        }
      );

      expect(result).toEqual(
        updatedUser
      );
    });

    it("supports partial staff user updates", async () => {
      const input = {
        isActive: false,
      };

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              ...staffUsers[0],
              isActive: false,
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

      await updateStaffUser(
        staffUsers[0].publicId,
        input
      );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        `/api/staff/users/${staffUsers[0].publicId}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            isActive: false,
          }),
        })
      );
    });

    it("supports removing a staff user's department assignment", async () => {
      const input = {
        departmentPublicId:
          null,
      };

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              ...staffUsers[0],
              department: null,
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

      await updateStaffUser(
        staffUsers[0].publicId,
        input
      );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        `/api/staff/users/${staffUsers[0].publicId}`,
        expect.objectContaining({
          body: JSON.stringify({
            departmentPublicId:
              null,
          }),
        })
      );
    });

    it("throws the API error when staff update fails", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Staff user not found.",
          }),
          {
            status: 404,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        updateStaffUser(
          "missing-user",
          {
            isActive: false,
          }
        )
      ).rejects.toThrow(
        "Staff user not found."
      );
    });

    it("uses a safe error when staff update returns invalid JSON", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          "Internal error",
          {
            status: 500,
          }
        )
      );

      await expect(
        updateStaffUser(
          staffUsers[0].publicId,
          {
            isActive: false,
          }
        )
      ).rejects.toThrow(
        "Unable to update staff user."
      );
    });
  }
);