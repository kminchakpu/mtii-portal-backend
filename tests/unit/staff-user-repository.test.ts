import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  execute,
} = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute,
    },
  })
);

import {
  findStaffUserByPublicId,
  listStaffUsers,
  listStaffUsersByDepartment,
} from "@/lib/staff/staff-user-repository";

const staffRows = [
  {
    id: 2,
    public_id:
      "trade-user-public-id",
    department_id: 2,
    department_public_id:
      "trade-department-public-id",
    department_code: "TRADE",
    department_name:
      "Trade Department",
    first_name: "Amina",
    last_name: "Ibrahim",
    email:
      "amina@example.com",
    is_active: 1,
    last_login_at:
      new Date(
        "2026-10-19T10:00:00.000Z"
      ),
    password_changed_at:
      new Date(
        "2026-10-01T08:00:00.000Z"
      ),
    created_at:
      new Date(
        "2026-09-01T08:00:00.000Z"
      ),
    updated_at:
      new Date(
        "2026-10-19T10:00:00.000Z"
      ),
    role_codes:
      "DEPARTMENT_ADMIN,REVIEW_OFFICER",
  },
  {
    id: 3,
    public_id:
      "coop-user-public-id",
    department_id: 3,
    department_public_id:
      "coop-department-public-id",
    department_code: "COOP",
    department_name:
      "Cooperative Department",
    first_name: "Musa",
    last_name: "Adamu",
    email:
      "musa@example.com",
    is_active: 1,
    last_login_at: null,
    password_changed_at: null,
    created_at:
      new Date(
        "2026-09-05T08:00:00.000Z"
      ),
    updated_at:
      new Date(
        "2026-09-05T08:00:00.000Z"
      ),
    role_codes:
      "REVIEW_OFFICER",
  },
];

describe(
  "staff user repository",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("lists staff users without exposing password hashes", async () => {
      execute.mockResolvedValueOnce([
        staffRows,
      ]);

      const users =
        await listStaffUsers();

      expect(
        execute
      ).toHaveBeenCalledOnce();

      const sql =
        execute.mock.calls[0][0] as string;

      expect(sql).toContain(
        "FROM users u"
      );

      expect(sql).toContain(
        "LEFT JOIN departments d"
      );

      expect(sql).toContain(
        "LEFT JOIN user_roles ur"
      );

      expect(sql).toContain(
        "LEFT JOIN roles r"
      );

      expect(sql).not.toContain(
        "password_hash"
      );

      expect(users).toEqual([
        {
          id: 2,
          publicId:
            "trade-user-public-id",
          departmentId: 2,
          departmentPublicId:
            "trade-department-public-id",
          departmentCode:
            "TRADE",
          departmentName:
            "Trade Department",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          isActive: true,
          lastLoginAt:
            staffRows[0]
              .last_login_at,
          passwordChangedAt:
            staffRows[0]
              .password_changed_at,
          createdAt:
            staffRows[0]
              .created_at,
          updatedAt:
            staffRows[0]
              .updated_at,
          roles: [
            "DEPARTMENT_ADMIN",
            "REVIEW_OFFICER",
          ],
        },
        {
          id: 3,
          publicId:
            "coop-user-public-id",
          departmentId: 3,
          departmentPublicId:
            "coop-department-public-id",
          departmentCode:
            "COOP",
          departmentName:
            "Cooperative Department",
          firstName: "Musa",
          lastName: "Adamu",
          email:
            "musa@example.com",
          isActive: true,
          lastLoginAt: null,
          passwordChangedAt: null,
          createdAt:
            staffRows[1]
              .created_at,
          updatedAt:
            staffRows[1]
              .updated_at,
          roles: [
            "REVIEW_OFFICER",
          ],
        },
      ]);
    });

    it("lists only users assigned to the requested department", async () => {
      execute.mockResolvedValueOnce([
        [staffRows[0]],
      ]);

      const users =
        await listStaffUsersByDepartment(
          2
        );

      expect(
        execute
      ).toHaveBeenCalledOnce();

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "u.department_id = ?"
        ),
        [2]
      );

      expect(users).toHaveLength(
        1
      );

      expect(
        users[0].departmentId
      ).toBe(2);

      expect(
        users[0].roles
      ).toEqual([
        "DEPARTMENT_ADMIN",
        "REVIEW_OFFICER",
      ]);
    });

    it("finds one staff user by public id", async () => {
      execute.mockResolvedValueOnce([
        [staffRows[0]],
      ]);

      const user =
        await findStaffUserByPublicId(
          "trade-user-public-id"
        );

      expect(
        execute
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "u.public_id = ?"
        ),
        [
          "trade-user-public-id",
        ]
      );

      expect(user).toEqual({
        id: 2,
        publicId:
          "trade-user-public-id",
        departmentId: 2,
        departmentPublicId:
          "trade-department-public-id",
        departmentCode:
          "TRADE",
        departmentName:
          "Trade Department",
        firstName: "Amina",
        lastName: "Ibrahim",
        email:
          "amina@example.com",
        isActive: true,
        lastLoginAt:
          staffRows[0]
            .last_login_at,
        passwordChangedAt:
          staffRows[0]
            .password_changed_at,
        createdAt:
          staffRows[0]
            .created_at,
        updatedAt:
          staffRows[0]
            .updated_at,
        roles: [
          "DEPARTMENT_ADMIN",
          "REVIEW_OFFICER",
        ],
      });
    });

    it("returns null when the staff user does not exist", async () => {
      execute.mockResolvedValueOnce([
        [],
      ]);

      const user =
        await findStaffUserByPublicId(
          "missing-user"
        );

      expect(user).toBeNull();
    });

    it("supports staff users that do not have a department or role", async () => {
      execute.mockResolvedValueOnce([
        [
          {
            id: 4,
            public_id:
              "unassigned-user",
            department_id: null,
            department_public_id:
              null,
            department_code: null,
            department_name: null,
            first_name: "John",
            last_name: "Doe",
            email:
              "john@example.com",
            is_active: 0,
            last_login_at: null,
            password_changed_at:
              null,
            created_at:
              new Date(
                "2026-10-01T08:00:00.000Z"
              ),
            updated_at:
              new Date(
                "2026-10-01T08:00:00.000Z"
              ),
            role_codes: null,
          },
        ],
      ]);

      const user =
        await findStaffUserByPublicId(
          "unassigned-user"
        );

      expect(user).toMatchObject({
        departmentId: null,
        departmentPublicId:
          null,
        departmentCode: null,
        departmentName: null,
        isActive: false,
        roles: [],
      });
    });
  }
);