import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const role = {
  publicId:
    "11111111-1111-4111-8111-111111111111",
  code: "REVIEW_OFFICER",
  name: "Review Officer",
  description:
    "Reviews ministry applications.",
  isActive: true,
  createdAt:
    "2026-10-01T08:00:00.000Z",
  updatedAt:
    "2026-10-01T08:00:00.000Z",
};

describe(
  "staff roles client",
  () => {
    beforeEach(() => {
      vi.resetModules();

      vi.stubGlobal(
        "fetch",
        vi.fn()
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("gets available staff roles", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              roles: [role],
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

      const {
        getStaffRoles,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      const result =
        await getStaffRoles();

      expect(fetch)
        .toHaveBeenCalledWith(
          "/api/staff/roles",
          {
            method: "GET",
          }
        );

      expect(result).toEqual([
        role,
      ]);
    });

    it("throws the API error when staff roles cannot be loaded", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
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

      const {
        getStaffRoles,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        getStaffRoles()
      ).rejects.toThrow(
        "Forbidden."
      );
    });

    it("uses a safe error when loading roles fails without an API error", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({}),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

      const {
        getStaffRoles,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        getStaffRoles()
      ).rejects.toThrow(
        "Unable to load staff roles."
      );
    });

    it("assigns a role to a staff user", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              role,
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

      const {
        assignStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      const result =
        await assignStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        );

      expect(fetch)
        .toHaveBeenCalledWith(
          "/api/staff/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/roles",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              rolePublicId:
                role.publicId,
            }),
          }
        );

      expect(result).toEqual(
        role
      );
    });

    it("throws the API error when role assignment fails", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              error:
                "Staff role is already assigned.",
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

      const {
        assignStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        assignStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        )
      ).rejects.toThrow(
        "Staff role is already assigned."
      );
    });

    it("uses a safe error when role assignment fails without an API error", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({}),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

      const {
        assignStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        assignStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        )
      ).rejects.toThrow(
        "Unable to assign staff role."
      );
    });

    it("removes a role from a staff user", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              role,
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

      const {
        removeStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      const result =
        await removeStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        );

      expect(fetch)
        .toHaveBeenCalledWith(
          `/api/staff/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/roles/${role.publicId}`,
          {
            method: "DELETE",
          }
        );

      expect(result).toEqual(
        role
      );
    });

    it("throws the API error when role removal fails", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              error:
                "Staff role is not assigned.",
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

      const {
        removeStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        removeStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        )
      ).rejects.toThrow(
        "Staff role is not assigned."
      );
    });

    it("uses a safe error when role removal fails without an API error", async () => {
      vi.mocked(fetch)
        .mockResolvedValue(
          new Response(
            JSON.stringify({}),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

      const {
        removeStaffRole,
      } = await import(
        "@/lib/staff-ui/staff-roles-client"
      );

      await expect(
        removeStaffRole(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          role.publicId
        )
      ).rejects.toThrow(
        "Unable to remove staff role."
      );
    });
  }
);