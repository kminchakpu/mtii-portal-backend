import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

const {
  getRequestAuthorization,
  requirePermission,
  requireDepartmentAccess,
  findDepartmentByPublicId,
  updateDepartment,
  revokeSessionsForDepartment,
  writeAuditLog,
  withTransaction,
  transactionConnection,
} = vi.hoisted(() => {
  const transactionConnection = {
    execute: vi.fn(),
  };

  return {
    getRequestAuthorization:
      vi.fn(),
    requirePermission:
      vi.fn(),
    requireDepartmentAccess:
      vi.fn(),
    findDepartmentByPublicId:
      vi.fn(),
    updateDepartment:
      vi.fn(),
    revokeSessionsForDepartment:
      vi.fn(),
    writeAuditLog:
      vi.fn(),
    withTransaction:
      vi.fn(),
    transactionConnection,
  };
});

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/rbac/permission-guard",
  () => ({
    requirePermission,
  })
);

vi.mock(
  "@/lib/rbac/department-guard",
  () => ({
    requireDepartmentAccess,
  })
);

vi.mock(
  "@/lib/departments/department-repository",
  () => ({
    findDepartmentByPublicId,
    updateDepartment,
  })
);

vi.mock(
  "@/lib/auth/session-repository",
  () => ({
    revokeSessionsForDepartment,
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

const authorization = {
  userId: 1,
  publicId:
    "super-admin-public-id",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: [
    "SUPER_ADMIN",
  ],
  permissions: [
    "DEPARTMENT_VIEW",
    "DEPARTMENT_MANAGE",
  ],
};

const existingDepartment = {
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
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
  updatedAt:
    new Date(
      "2026-10-01T10:00:00.000Z"
    ),
};

const updatedDepartment = {
  ...existingDepartment,
  name:
    "Trade and Commerce Department",
  description:
    "Updated department description.",
  updatedAt:
    new Date(
      "2026-10-20T20:00:00.000Z"
    ),
};

function createRequest(
  body: unknown
) {
  return new Request(
    "http://localhost/api/staff/departments/trade-public-id",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        JSON.stringify(
          body
        ),
    }
  );
}

function createContext() {
  return {
    params:
      Promise.resolve({
        publicId:
          "trade-public-id",
      }),
  };
}

describe(
  "staff department update route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      requirePermission
        .mockImplementation(
          () => undefined
        );

      requireDepartmentAccess
        .mockImplementation(
          () => undefined
        );

      findDepartmentByPublicId
        .mockResolvedValue(
          existingDepartment
        );

      updateDepartment
        .mockResolvedValue(
          updatedDepartment
        );

      revokeSessionsForDepartment
        .mockResolvedValue(0);

      writeAuditLog
        .mockResolvedValue(
          undefined
        );

      withTransaction
        .mockImplementation(
          async (
            operation: (
              connection:
                typeof transactionConnection
            ) => Promise<unknown>
          ) => {
            return operation(
              transactionConnection
            );
          }
        );
    });

    it("updates and audits a department in the same transaction", async () => {
      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "Trade and Commerce Department",
            description:
              "Updated department description.",
          }),
          createContext()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(200);

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        authorization,
        "DEPARTMENT_MANAGE"
      );

      expect(
        findDepartmentByPublicId
      ).toHaveBeenCalledWith(
        "trade-public-id",
        transactionConnection
      );

      expect(
        requireDepartmentAccess
      ).toHaveBeenCalledWith(
        authorization,
        2
      );

      expect(
        updateDepartment
      ).toHaveBeenCalledWith(
        2,
        {
          name:
            "Trade and Commerce Department",
          description:
            "Updated department description.",
        },
        transactionConnection
      );

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        {
          actorUserId: 1,
          departmentId: 2,
          action:
            "DEPARTMENT_UPDATED",
          entityType:
            "DEPARTMENT",
          entityId:
            "trade-public-id",
          previousValues: {
            publicId:
              "trade-public-id",
            code: "TRADE",
            name:
              "Trade Department",
            description:
              "Handles trade services.",
            isActive: true,
          },
          newValues: {
            publicId:
              "trade-public-id",
            code: "TRADE",
            name:
              "Trade and Commerce Department",
            description:
              "Updated department description.",
            isActive: true,
          },
        },
        transactionConnection
      );

      expect(
        body.department
      ).toEqual({
        publicId:
          "trade-public-id",
        code: "TRADE",
        name:
          "Trade and Commerce Department",
        description:
          "Updated department description.",
        isActive: true,
        createdAt:
          "2026-10-01T10:00:00.000Z",
        updatedAt:
          "2026-10-20T20:00:00.000Z",
      });

      expect(
        body.department.id
      ).toBeUndefined();
    });

    it("revokes department staff sessions when an active department is deactivated", async () => {
      const deactivatedDepartment = {
        ...existingDepartment,
        isActive: false,
        updatedAt:
          new Date(
            "2026-10-20T20:00:00.000Z"
          ),
      };

      updateDepartment
        .mockResolvedValue(
          deactivatedDepartment
        );

      revokeSessionsForDepartment
        .mockResolvedValue(3);

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            isActive: false,
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        updateDepartment
      ).toHaveBeenCalledWith(
        2,
        {
          isActive: false,
        },
        transactionConnection
      );

      expect(
        revokeSessionsForDepartment
      ).toHaveBeenCalledOnce();

      expect(
        revokeSessionsForDepartment
      ).toHaveBeenCalledWith(
        2,
        transactionConnection
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        {
          actorUserId: 1,
          departmentId: 2,
          action:
            "DEPARTMENT_UPDATED",
          entityType:
            "DEPARTMENT",
          entityId:
            "trade-public-id",
          previousValues: {
            publicId:
              "trade-public-id",
            code: "TRADE",
            name:
              "Trade Department",
            description:
              "Handles trade services.",
            isActive: true,
          },
          newValues: {
            publicId:
              "trade-public-id",
            code: "TRADE",
            name:
              "Trade Department",
            description:
              "Handles trade services.",
            isActive: false,
          },
        },
        transactionConnection
      );
    });

    it("does not revoke sessions when the department remains active", async () => {
      updateDepartment
        .mockResolvedValue({
          ...existingDepartment,
          name:
            "Trade and Commerce Department",
        });

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "Trade and Commerce Department",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();
    });

    it("does not revoke sessions when an inactive department is reactivated", async () => {
      const inactiveDepartment = {
        ...existingDepartment,
        isActive: false,
      };

      const reactivatedDepartment = {
        ...inactiveDepartment,
        isActive: true,
        updatedAt:
          new Date(
            "2026-10-20T20:00:00.000Z"
          ),
      };

      findDepartmentByPublicId
        .mockResolvedValue(
          inactiveDepartment
        );

      updateDepartment
        .mockResolvedValue(
          reactivatedDepartment
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            isActive: true,
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();
    });

    it("does not revoke sessions when an inactive department remains inactive", async () => {
      const inactiveDepartment = {
        ...existingDepartment,
        isActive: false,
      };

      findDepartmentByPublicId
        .mockResolvedValue(
          inactiveDepartment
        );

      updateDepartment
        .mockResolvedValue({
          ...inactiveDepartment,
          description:
            "Updated while inactive.",
        });

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            description:
              "Updated while inactive.",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(200);

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();
    });

    it("rethrows a session revocation failure so the transaction rolls back", async () => {
      updateDepartment
        .mockResolvedValue({
          ...existingDepartment,
          isActive: false,
        });

      revokeSessionsForDepartment
        .mockRejectedValue(
          new Error(
            "Session revocation failed"
          )
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      await expect(
        PATCH(
          createRequest({
            isActive: false,
          }),
          createContext()
        )
      ).rejects.toThrow(
        "Session revocation failed"
      );

      expect(
        updateDepartment
      ).toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).toHaveBeenCalledWith(
        2,
        transactionConnection
      );

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("rejects attempts to change the immutable department code", async () => {
      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            code: "COMMERCE",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        updateDepartment
      ).not.toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("rejects an empty update", async () => {
      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({}),
          createContext()
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        updateDepartment
      ).not.toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();
    });

    it("returns 404 when the department does not exist", async () => {
      findDepartmentByPublicId
        .mockResolvedValue(
          null
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "New Department Name",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(404);

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        updateDepartment
      ).not.toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("returns 401 when the request is unauthenticated", async () => {
      getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "New Department Name",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(401);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff lacks DEPARTMENT_MANAGE", async () => {
      requirePermission
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "New Department Name",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff cannot access the target department", async () => {
      requireDepartmentAccess
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      const response =
        await PATCH(
          createRequest({
            name:
              "New Department Name",
          }),
          createContext()
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        updateDepartment
      ).not.toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("rethrows an audit failure so the transaction rolls back", async () => {
      writeAuditLog
        .mockRejectedValue(
          new Error(
            "Audit insert failed"
          )
        );

      const {
        PATCH,
      } = await import(
        "@/app/api/staff/departments/[publicId]/route"
      );

      await expect(
        PATCH(
          createRequest({
            name:
              "Trade and Commerce Department",
          }),
          createContext()
        )
      ).rejects.toThrow(
        "Audit insert failed"
      );

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        updateDepartment
      ).toHaveBeenCalled();

      expect(
        revokeSessionsForDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).toHaveBeenCalled();
    });
  }
);