import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  ForbiddenError,
} from "@/lib/rbac/errors";

const {
  randomUUID,
  hashPassword,
  findDepartmentByPublicId,
  createStaffUser,
  writeAuditLog,
  withTransaction,
  revokeAllStaffSessions,
} = vi.hoisted(() => ({
  randomUUID: vi.fn(),
  hashPassword: vi.fn(),
  findDepartmentByPublicId:
    vi.fn(),
  createStaffUser: vi.fn(),
  writeAuditLog: vi.fn(),
  withTransaction: vi.fn(),
  revokeAllStaffSessions:
    vi.fn(),
}));

vi.mock("node:crypto", () => ({
  randomUUID,
}));

vi.mock(
  "@/lib/auth/password",
  () => ({
    hashPassword,
  })
);

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    revokeAllStaffSessions,
  })
);

vi.mock(
  "@/lib/departments/department-repository",
  () => ({
    findDepartmentByPublicId,
  })
);

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    createStaffUser,
  })
);

vi.mock(
  "@/lib/audit/logger",
  () => ({
    writeAuditLog,
  })
);

vi.mock(
  "@/lib/db/transaction",
  () => ({
    withTransaction,
  })
);

import {
  createStaffAccount,
} from "@/lib/staff/staff-user-service";

const superAdmin:
  AuthorizationContext = {
    userId: 1,
    publicId:
      "super-admin-public-id",
    departmentId: 1,
    departmentCode: "ADMIN",
    roles: ["SUPER_ADMIN"],
    permissions: [
      "USER_VIEW",
      "USER_MANAGE",
      "ROLE_VIEW",
      "ROLE_ASSIGN",
    ],
  };

const departmentManager:
  AuthorizationContext = {
    userId: 10,
    publicId:
      "department-manager-public-id",
    departmentId: 2,
    departmentCode: "TRADE",
    roles: [
      "DEPARTMENT_ADMIN",
    ],
    permissions: [
      "USER_VIEW",
      "USER_MANAGE",
    ],
  };

const tradeDepartment = {
  id: 2,
  publicId:
    "11111111-1111-4111-8111-111111111111",
  code: "TRADE",
  name: "Trade Department",
  description: null,
  isActive: true,
  createdAt: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
};

const cooperativeDepartment = {
  ...tradeDepartment,
  id: 3,
  publicId:
    "22222222-2222-4222-8222-222222222222",
  code: "COOP",
  name:
    "Cooperative Department",
};

const createdUser = {
  id: 25,
  publicId:
    "33333333-3333-4333-8333-333333333333",
  departmentId: 2,
  departmentPublicId:
    tradeDepartment.publicId,
  departmentCode: "TRADE",
  departmentName:
    "Trade Department",
  firstName: "Amina",
  lastName: "Ibrahim",
  email:
    "amina@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-20T10:00:00.000Z"
  ),
  roles: [],
};

describe(
  "staff user creation service",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      randomUUID.mockReturnValue(
        "33333333-3333-4333-8333-333333333333"
      );

      hashPassword.mockResolvedValue(
        "$2b$12$hashed-password"
      );

      withTransaction.mockImplementation(
        async (operation) => {
          const connection = {
            execute: vi.fn(),
          };

          return operation(
            connection
          );
        }
      );

      createStaffUser.mockResolvedValue(
        createdUser
      );

      writeAuditLog.mockResolvedValue(
        undefined
      );

      revokeAllStaffSessions.mockResolvedValue(
        0
      );
    });

    it("creates a staff account in the actor's department", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        tradeDepartment
      );

      const user =
        await createStaffAccount(
          departmentManager,
          {
            firstName: "Amina",
            lastName: "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              tradeDepartment.publicId,
          }
        );

      expect(
        findDepartmentByPublicId
      ).toHaveBeenCalledWith(
        tradeDepartment.publicId
      );

      expect(
        hashPassword
      ).toHaveBeenCalledWith(
        "StrongPassword123!"
      );

      expect(
        randomUUID
      ).toHaveBeenCalledTimes(1);

      expect(
        withTransaction
      ).toHaveBeenCalledTimes(1);

      expect(
        createStaffUser
      ).toHaveBeenCalledWith(
        {
          publicId:
            "33333333-3333-4333-8333-333333333333",
          departmentId: 2,
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          passwordHash:
            "$2b$12$hashed-password",
        },
        expect.anything()
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        {
          actorUserId: 10,
          departmentId: 2,
          action:
            "STAFF_USER_CREATED",
          entityType:
            "STAFF_USER",
          entityId:
            createdUser.publicId,
          newValues: {
            publicId:
              createdUser.publicId,
            departmentPublicId:
              tradeDepartment.publicId,
            firstName: "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            isActive: true,
          },
        },
        expect.anything()
      );

      expect(user).toEqual(
        createdUser
      );
    });

    it("allows a Super Admin to create a user in another department", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        cooperativeDepartment
      );

      createStaffUser.mockResolvedValue({
        ...createdUser,
        departmentId: 3,
        departmentPublicId:
          cooperativeDepartment.publicId,
        departmentCode:
          "COOP",
        departmentName:
          "Cooperative Department",
      });

      await expect(
        createStaffAccount(
          superAdmin,
          {
            firstName: "Musa",
            lastName: "Adamu",
            email:
              "musa@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              cooperativeDepartment.publicId,
          }
        )
      ).resolves.toBeDefined();

      expect(
        createStaffUser
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: 3,
        }),
        expect.anything()
      );
    });

    it("rejects creation in another department for non-Super Admin staff", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        cooperativeDepartment
      );

      await expect(
        createStaffAccount(
          departmentManager,
          {
            firstName: "Musa",
            lastName: "Adamu",
            email:
              "musa@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              cooperativeDepartment.publicId,
          }
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        hashPassword
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        createStaffUser
      ).not.toHaveBeenCalled();
    });

    it("allows only a Super Admin to create an unassigned user", async () => {
      createStaffUser.mockResolvedValue({
        ...createdUser,
        departmentId: null,
        departmentPublicId:
          null,
        departmentCode: null,
        departmentName: null,
      });

      await expect(
        createStaffAccount(
          superAdmin,
          {
            firstName: "Grace",
            lastName: "John",
            email:
              "grace@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              null,
          }
        )
      ).resolves.toBeDefined();

      expect(
        findDepartmentByPublicId
      ).not.toHaveBeenCalled();

      expect(
        createStaffUser
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: null,
        }),
        expect.anything()
      );
    });

    it("rejects an unassigned user for a non-Super Admin", async () => {
      await expect(
        createStaffAccount(
          departmentManager,
          {
            firstName: "Grace",
            lastName: "John",
            email:
              "grace@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              null,
          }
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        hashPassword
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("rejects an unknown department", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        null
      );

      await expect(
        createStaffAccount(
          superAdmin,
          {
            firstName: "Amina",
            lastName: "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              tradeDepartment.publicId,
          }
        )
      ).rejects.toThrow(
        "Department not found."
      );

      expect(
        hashPassword
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("rejects an inactive department", async () => {
      findDepartmentByPublicId.mockResolvedValue({
        ...tradeDepartment,
        isActive: false,
      });

      await expect(
        createStaffAccount(
          superAdmin,
          {
            firstName: "Amina",
            lastName: "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              tradeDepartment.publicId,
          }
        )
      ).rejects.toThrow(
        "Department is inactive."
      );

      expect(
        hashPassword
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("requires USER_MANAGE permission", async () => {
      const unauthorizedActor = {
        ...departmentManager,
        permissions: [
          "USER_VIEW",
        ],
      };

      await expect(
        createStaffAccount(
          unauthorizedActor,
          {
            firstName: "Amina",
            lastName: "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              tradeDepartment.publicId,
          }
        )
      ).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(
        findDepartmentByPublicId
      ).not.toHaveBeenCalled();

      expect(
        hashPassword
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("uses the same transaction executor for user creation and audit logging", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        tradeDepartment
      );

      const connection = {
        execute: vi.fn(),
      };

      withTransaction.mockImplementation(
        async (operation) =>
          operation(connection)
      );

      await createStaffAccount(
        superAdmin,
        {
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId:
            tradeDepartment.publicId,
        }
      );

      expect(
        createStaffUser
      ).toHaveBeenCalledWith(
        expect.anything(),
        connection
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        expect.anything(),
        connection
      );
    });

    it("never writes the plaintext password to the audit log", async () => {
      findDepartmentByPublicId.mockResolvedValue(
        tradeDepartment
      );

      await createStaffAccount(
        superAdmin,
        {
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId:
            tradeDepartment.publicId,
        }
      );

      const auditInput =
        writeAuditLog.mock
          .calls[0][0];

      expect(
        JSON.stringify(
          auditInput
        )
      ).not.toContain(
        "StrongPassword123!"
      );

      expect(
        JSON.stringify(
          auditInput
        )
      ).not.toContain(
        "$2b$12$hashed-password"
      );
    });
  }
);