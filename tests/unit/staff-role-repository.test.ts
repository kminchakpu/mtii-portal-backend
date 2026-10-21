import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute: mocks.execute,
    },
  })
);

import {
  findStaffRoleById,
  findStaffRoleByPublicId,
  listStaffRoles,
} from "@/lib/staff/staff-role-repository";

describe(
  "staff role repository",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("lists staff roles in name order", async () => {
      mocks.execute.mockResolvedValue([
        [
          {
            id: 2,
            public_id:
              "22222222-2222-4222-8222-222222222222",
            code:
              "REVIEW_OFFICER",
            name:
              "Review Officer",
            description:
              "Reviews applications.",
            is_active: 1,
            created_at:
              new Date(
                "2026-10-01T10:00:00.000Z"
              ),
            updated_at:
              new Date(
                "2026-10-01T10:00:00.000Z"
              ),
          },
          {
            id: 1,
            public_id:
              "11111111-1111-4111-8111-111111111111",
            code:
              "SUPER_ADMIN",
            name:
              "Super Admin",
            description:
              "System administrator.",
            is_active: 1,
            created_at:
              new Date(
                "2026-10-01T09:00:00.000Z"
              ),
            updated_at:
              new Date(
                "2026-10-01T09:00:00.000Z"
              ),
          },
        ],
        [],
      ]);

      const roles =
        await listStaffRoles();

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "FROM roles"
      );

      expect(sql).toContain(
        "ORDER BY name ASC"
      );

      expect(
        parameters
      ).toEqual([]);

      expect(roles).toEqual([
        {
          id: 2,
          publicId:
            "22222222-2222-4222-8222-222222222222",
          code:
            "REVIEW_OFFICER",
          name:
            "Review Officer",
          description:
            "Reviews applications.",
          isActive: true,
          createdAt:
            new Date(
              "2026-10-01T10:00:00.000Z"
            ),
          updatedAt:
            new Date(
              "2026-10-01T10:00:00.000Z"
            ),
        },
        {
          id: 1,
          publicId:
            "11111111-1111-4111-8111-111111111111",
          code:
            "SUPER_ADMIN",
          name:
            "Super Admin",
          description:
            "System administrator.",
          isActive: true,
          createdAt:
            new Date(
              "2026-10-01T09:00:00.000Z"
            ),
          updatedAt:
            new Date(
              "2026-10-01T09:00:00.000Z"
            ),
        },
      ]);
    });

    it("finds a staff role by public ID", async () => {
      mocks.execute.mockResolvedValue([
        [
          {
            id: 3,
            public_id:
              "33333333-3333-4333-8333-333333333333",
            code:
              "DEPARTMENT_ADMIN",
            name:
              "Department Admin",
            description: null,
            is_active: 1,
            created_at:
              new Date(
                "2026-10-01T11:00:00.000Z"
              ),
            updated_at:
              new Date(
                "2026-10-01T11:00:00.000Z"
              ),
          },
        ],
        [],
      ]);

      const role =
        await findStaffRoleByPublicId(
          "33333333-3333-4333-8333-333333333333"
        );

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "FROM roles"
      );

      expect(sql).toContain(
        "public_id = ?"
      );

      expect(
        parameters
      ).toEqual([
        "33333333-3333-4333-8333-333333333333",
      ]);

      expect(role).toEqual({
        id: 3,
        publicId:
          "33333333-3333-4333-8333-333333333333",
        code:
          "DEPARTMENT_ADMIN",
        name:
          "Department Admin",
        description: null,
        isActive: true,
        createdAt:
          new Date(
            "2026-10-01T11:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-10-01T11:00:00.000Z"
          ),
      });
    });

    it("returns null when a public ID is not found", async () => {
      mocks.execute.mockResolvedValue([
        [],
        [],
      ]);

      const role =
        await findStaffRoleByPublicId(
          "44444444-4444-4444-8444-444444444444"
        );

      expect(role).toBeNull();
    });

    it("finds a staff role by internal ID", async () => {
      mocks.execute.mockResolvedValue([
        [
          {
            id: 5,
            public_id:
              "55555555-5555-4555-8555-555555555555",
            code:
              "GRM_OFFICER",
            name:
              "GRM Officer",
            description:
              "Manages GRM cases.",
            is_active: 0,
            created_at:
              new Date(
                "2026-10-01T12:00:00.000Z"
              ),
            updated_at:
              new Date(
                "2026-10-02T12:00:00.000Z"
              ),
          },
        ],
        [],
      ]);

      const role =
        await findStaffRoleById(
          5
        );

      expect(
        mocks.execute
      ).toHaveBeenCalledTimes(1);

      const [
        sql,
        parameters,
      ] =
        mocks.execute.mock.calls[0];

      expect(sql).toContain(
        "FROM roles"
      );

      expect(sql).toContain(
        "id = ?"
      );

      expect(
        parameters
      ).toEqual([5]);

      expect(role).toEqual({
        id: 5,
        publicId:
          "55555555-5555-4555-8555-555555555555",
        code:
          "GRM_OFFICER",
        name:
          "GRM Officer",
        description:
          "Manages GRM cases.",
        isActive: false,
        createdAt:
          new Date(
            "2026-10-01T12:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-10-02T12:00:00.000Z"
          ),
      });
    });

    it("returns null when an internal ID is not found", async () => {
      mocks.execute.mockResolvedValue([
        [],
        [],
      ]);

      const role =
        await findStaffRoleById(
          999
        );

      expect(role).toBeNull();
    });
  }
);