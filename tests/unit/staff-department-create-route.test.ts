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
import {
  DepartmentCodeConflictError,
} from "@/lib/departments/errors";

const {
  getRequestAuthorization,
  requirePermission,
  createDepartment,
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
    createDepartment:
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
  "@/lib/departments/department-repository",
  () => ({
    createDepartment,
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

const createdDepartment = {
  id: 5,
  publicId:
    "industry-public-id",
  code: "INDUSTRY",
  name:
    "Industry Department",
  description:
    "Handles industry services.",
  isActive: true,
  createdAt:
    new Date(
      "2026-10-20T10:00:00.000Z"
    ),
  updatedAt:
    new Date(
      "2026-10-20T10:00:00.000Z"
    ),
};

function createRequest(
  body: unknown
) {
  return new Request(
    "http://localhost/api/staff/departments",
    {
      method: "POST",
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

function createCrossSiteRequest(
  body: unknown
) {
  return new Request(
    "http://localhost/api/staff/departments",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Origin:
          "https://attacker.example.com",
        "Sec-Fetch-Site":
          "cross-site",
      },
      body:
        JSON.stringify(
          body
        ),
    }
  );
}

describe(
  "staff department create route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      createDepartment
        .mockResolvedValue(
          createdDepartment
        );

      writeAuditLog
        .mockResolvedValue(
          undefined
        );

      withTransaction
        .mockImplementation(
          async (
            operation: (
              connection: typeof transactionConnection
            ) => Promise<unknown>
          ) => {
            return operation(
              transactionConnection
            );
          }
        );
    });

    it("creates and audits a department in the same transaction", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createRequest({
            code: "industry",
            name:
              "Industry Department",
            description:
              "Handles industry services.",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(201);

      expect(
        getRequestAuthorization
      ).toHaveBeenCalledOnce();

      expect(
        requirePermission
      ).toHaveBeenCalledWith(
        authorization,
        "DEPARTMENT_MANAGE"
      );

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        createDepartment
      ).toHaveBeenCalledWith(
        {
          code: "INDUSTRY",
          name:
            "Industry Department",
          description:
            "Handles industry services.",
        },
        transactionConnection
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        {
          actorUserId: 1,
          departmentId: 5,
          action:
            "DEPARTMENT_CREATED",
          entityType:
            "DEPARTMENT",
          entityId:
            "industry-public-id",
          newValues: {
            publicId:
              "industry-public-id",
            code: "INDUSTRY",
            name:
              "Industry Department",
            description:
              "Handles industry services.",
            isActive: true,
          },
        },
        transactionConnection
      );

      expect(body).toEqual({
        department: {
          publicId:
            "industry-public-id",
          code: "INDUSTRY",
          name:
            "Industry Department",
          description:
            "Handles industry services.",
          isActive: true,
          createdAt:
            "2026-10-20T10:00:00.000Z",
          updatedAt:
            "2026-10-20T10:00:00.000Z",
        },
      });

      expect(
        body.department.id
      ).toBeUndefined();
    });

    it("rejects a cross-site request before authentication or department creation", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createCrossSiteRequest({
            code: "INDUSTRY",
            name:
              "Industry Department",
            description:
              "Handles industry services.",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(403);

      expect(body).toEqual({
        error:
          "Cross-site request forbidden.",
      });

      expect(
        getRequestAuthorization
      ).not.toHaveBeenCalled();

      expect(
        requirePermission
      ).not.toHaveBeenCalled();

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        createDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid department data without starting a transaction", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createRequest({
            code: "",
            name: "",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(400);

      expect(body).toHaveProperty(
        "error"
      );

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        createDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("returns 409 when the department code already exists", async () => {
      createDepartment
        .mockRejectedValue(
          new DepartmentCodeConflictError()
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createRequest({
            code: "TRADE",
            name:
              "Another Trade Department",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(409);

      expect(body).toEqual({
        error:
          "A department with this code already exists.",
      });

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

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
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createRequest({
            code: "INDUSTRY",
            name:
              "Industry Department",
          })
        );

      expect(
        response.status
      ).toBe(401);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        createDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
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
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      const response =
        await POST(
          createRequest({
            code: "INDUSTRY",
            name:
              "Industry Department",
          })
        );

      expect(
        response.status
      ).toBe(403);

      expect(
        withTransaction
      ).not.toHaveBeenCalled();

      expect(
        createDepartment
      ).not.toHaveBeenCalled();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });

    it("rethrows an audit failure so the transaction can roll back", async () => {
      writeAuditLog
        .mockRejectedValue(
          new Error(
            "Audit insert failed"
          )
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      await expect(
        POST(
          createRequest({
            code: "INDUSTRY",
            name:
              "Industry Department",
          })
        )
      ).rejects.toThrow(
        "Audit insert failed"
      );

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        createDepartment
      ).toHaveBeenCalledWith(
        {
          code: "INDUSTRY",
          name:
            "Industry Department",
        },
        transactionConnection
      );

      expect(
        writeAuditLog
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          action:
            "DEPARTMENT_CREATED",
          entityId:
            "industry-public-id",
        }),
        transactionConnection
      );
    });

    it("rethrows unexpected department creation errors", async () => {
      createDepartment
        .mockRejectedValue(
          new Error(
            "Database unavailable"
          )
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/departments/route"
      );

      await expect(
        POST(
          createRequest({
            code: "INDUSTRY",
            name:
              "Industry Department",
          })
        )
      ).rejects.toThrow(
        "Database unavailable"
      );

      expect(
        withTransaction
      ).toHaveBeenCalledOnce();

      expect(
        writeAuditLog
      ).not.toHaveBeenCalled();
    });
  }
);