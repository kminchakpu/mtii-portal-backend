import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  DepartmentCodeConflictError,
} from "@/lib/departments/errors";

const {
  execute,
  randomUUID,
} = vi.hoisted(() => ({
  execute: vi.fn(),
  randomUUID: vi.fn(),
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
  "node:crypto",
  () => ({
    randomUUID,
  })
);

import {
  createDepartment,
  findDepartmentByPublicId,
  listDepartments,
  listDepartmentsById,
  updateDepartment,
} from "@/lib/departments/department-repository";

const departmentRow = {
  id: 2,
  public_id:
    "trade-public-id",
  code: "TRADE",
  name:
    "Trade Department",
  description:
    "Handles trade services.",
  is_active: 1,
  created_at:
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
  updated_at:
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
};

describe(
  "department repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      randomUUID.mockReturnValue(
        "new-department-public-id"
      );
    });

    it("lists departments ordered by name", async () => {
      execute.mockResolvedValueOnce([
        [
          departmentRow,
          {
            ...departmentRow,
            id: 3,
            public_id:
              "coop-public-id",
            code: "COOP",
            name:
              "Cooperative Department",
          },
        ],
      ]);

      const departments =
        await listDepartments();

      expect(
        execute
      ).toHaveBeenCalledOnce();

      expect(
        execute.mock.calls[0][0]
      ).toContain(
        "ORDER BY name ASC"
      );

      expect(
        departments
      ).toHaveLength(2);

      expect(
        departments[0]
      ).toEqual({
        id: 2,
        publicId:
          "trade-public-id",
        code: "TRADE",
        name:
          "Trade Department",
        description:
          "Handles trade services.",
        isActive: true,
        createdAt:
          departmentRow.created_at,
        updatedAt:
          departmentRow.updated_at,
      });
    });

    it("lists only the requested department by internal id", async () => {
      execute.mockResolvedValueOnce([
        [departmentRow],
      ]);

      const departments =
        await listDepartmentsById(
          2
        );

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE id = ?"
        ),
        [2]
      );

      expect(
        departments
      ).toHaveLength(1);

      expect(
        departments[0].id
      ).toBe(2);
    });

    it("finds a department by public id", async () => {
      execute.mockResolvedValueOnce([
        [departmentRow],
      ]);

      const department =
        await findDepartmentByPublicId(
          "trade-public-id"
        );

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE public_id = ?"
        ),
        [
          "trade-public-id",
        ]
      );

      expect(
        department
      ).toEqual({
        id: 2,
        publicId:
          "trade-public-id",
        code: "TRADE",
        name:
          "Trade Department",
        description:
          "Handles trade services.",
        isActive: true,
        createdAt:
          departmentRow.created_at,
        updatedAt:
          departmentRow.updated_at,
      });
    });

    it("returns null when the department does not exist", async () => {
      execute.mockResolvedValueOnce([
        [],
      ]);

      const department =
        await findDepartmentByPublicId(
          "missing-public-id"
        );

      expect(
        department
      ).toBeNull();
    });

    it("creates a department using parameterized SQL", async () => {
      execute
        .mockResolvedValueOnce([
          {
            insertId: 5,
            affectedRows: 1,
          },
        ])
        .mockResolvedValueOnce([
          [
            {
              ...departmentRow,
              id: 5,
              public_id:
                "new-department-public-id",
              code: "INDUSTRY",
              name:
                "Industry Department",
              description:
                "Handles industry services.",
            },
          ],
        ]);

      const department =
        await createDepartment({
          code: "INDUSTRY",
          name:
            "Industry Department",
          description:
            "Handles industry services.",
        });

      expect(
        randomUUID
      ).toHaveBeenCalledOnce();

      expect(
        execute
      ).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          "INSERT INTO departments"
        ),
        [
          "new-department-public-id",
          "INDUSTRY",
          "Industry Department",
          "Handles industry services.",
        ]
      );

      expect(
        execute
      ).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          "WHERE id = ?"
        ),
        [5]
      );

      expect(
        department.publicId
      ).toBe(
        "new-department-public-id"
      );

      expect(
        department.code
      ).toBe("INDUSTRY");
    });

    it("updates only the supplied department fields", async () => {
      execute
        .mockResolvedValueOnce([
          {
            affectedRows: 1,
          },
        ])
        .mockResolvedValueOnce([
          [
            {
              ...departmentRow,
              name:
                "Trade and Commerce Department",
              description:
                "Updated description.",
            },
          ],
        ]);

      const department =
        await updateDepartment(
          2,
          {
            name:
              "Trade and Commerce Department",
            description:
              "Updated description.",
          }
        );

      expect(
        execute
      ).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          "UPDATE departments"
        ),
        [
          "Trade and Commerce Department",
          "Updated description.",
          2,
        ]
      );

      const updateSql =
        execute.mock.calls[0][0] as string;

      expect(
        updateSql
      ).toContain(
        "name = ?"
      );

      expect(
        updateSql
      ).toContain(
        "description = ?"
      );

      expect(
        updateSql
      ).not.toContain(
        "code = ?"
      );

      expect(
        updateSql
      ).not.toContain(
        "is_active = ?"
      );

      expect(
        department?.name
      ).toBe(
        "Trade and Commerce Department"
      );
    });

    it("returns the existing department when an update does not change any values", async () => {
      execute
        .mockResolvedValueOnce([
          {
            affectedRows: 0,
          },
        ])
        .mockResolvedValueOnce([
          [departmentRow],
        ]);

      const department =
        await updateDepartment(
          2,
          {
            name:
              "Trade Department",
          }
        );

      expect(
        execute
      ).toHaveBeenCalledTimes(
        2
      );

      expect(
        department
      ).not.toBeNull();

      expect(
        department?.id
      ).toBe(2);

      expect(
        department?.name
      ).toBe(
        "Trade Department"
      );
    });

    it("returns null when an update targets a missing department", async () => {
      execute
        .mockResolvedValueOnce([
          {
            affectedRows: 0,
          },
        ])
        .mockResolvedValueOnce([
          [],
        ]);

      const department =
        await updateDepartment(
          999,
          {
            name:
              "Missing Department",
          }
        );

      expect(
        department
      ).toBeNull();
    });

    it("rejects a duplicate department code during creation", async () => {
      const duplicateError = {
        code:
          "ER_DUP_ENTRY",
        errno: 1062,
        sqlMessage:
          "Duplicate entry 'TRADE' for key 'uq_departments_code'",
      };

      execute.mockRejectedValueOnce(
        duplicateError
      );

      await expect(
        createDepartment({
          code: "TRADE",
          name:
            "Another Trade Department",
          description: null,
        })
      ).rejects.toBeInstanceOf(
        DepartmentCodeConflictError
      );
    });
  }
);