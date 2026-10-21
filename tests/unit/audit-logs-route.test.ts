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

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  requirePermission:
    vi.fn(),
  listAuditLogs:
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
  "@/lib/rbac/permission-guard",
  () => ({
    requirePermission:
      mocks.requirePermission,
  })
);

vi.mock(
  "@/lib/audit/audit-log-repository",
  () => ({
    listAuditLogs:
      mocks.listAuditLogs,
  })
);

import {
  GET,
} from "@/app/api/staff/audit-logs/route";

const authorization = {
  userId: 1,
  publicId:
    "11111111-1111-4111-8111-111111111111",
  departmentId: null,
  departmentCode: null,
  roles: ["AUDITOR"],
  permissions: ["AUDIT_VIEW"],
};

function createRequest(
  query = ""
): Request {
  return new Request(
    `http://localhost/api/staff/audit-logs${query}`
  );
}

describe(
  "GET /api/staff/audit-logs",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks
        .getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks
        .requirePermission
        .mockReturnValue(
          undefined
        );

      mocks
        .listAuditLogs
        .mockResolvedValue({
          logs: [],
          total: 0,
        });
    });

    it("requires AUDIT_VIEW permission", async () => {
      const request =
        createRequest();

      await GET(request);

      expect(
        mocks.requirePermission
      ).toHaveBeenCalledWith(
        authorization,
        "AUDIT_VIEW"
      );
    });

    it("returns 401 when the request is unauthenticated", async () => {
      mocks
        .getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(401);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Unauthenticated.",
      });

      expect(
        mocks.listAuditLogs
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when the user lacks AUDIT_VIEW", async () => {
      mocks
        .requirePermission
        .mockImplementation(
          () => {
            throw new ForbiddenError();
          }
        );

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error: "Forbidden.",
      });

      expect(
        mocks.listAuditLogs
      ).not.toHaveBeenCalled();
    });

    it("uses default pagination when query parameters are omitted", async () => {
      await GET(
        createRequest()
      );

      expect(
        mocks.listAuditLogs
      ).toHaveBeenCalledWith({
        page: 1,
        pageSize: 25,
      });
    });

    it("passes validated filters to the repository", async () => {
      const request =
        createRequest(
          "?page=2" +
            "&pageSize=50" +
            "&action=STAFF_ROLE_ASSIGNED" +
            "&entityType=STAFF_USER_ROLE" +
            "&actorUserPublicId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" +
            "&from=2026-10-01T00%3A00%3A00.000Z" +
            "&to=2026-10-21T23%3A59%3A59.999Z"
        );

      await GET(request);

      expect(
        mocks.listAuditLogs
      ).toHaveBeenCalledWith({
        page: 2,
        pageSize: 50,
        action:
          "STAFF_ROLE_ASSIGNED",
        entityType:
          "STAFF_USER_ROLE",
        actorUserPublicId:
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        from:
          new Date(
            "2026-10-01T00:00:00.000Z"
          ),
        to:
          new Date(
            "2026-10-21T23:59:59.999Z"
          ),
      });
    });

    it("returns 400 for invalid query parameters", async () => {
      const response =
        await GET(
          createRequest(
            "?page=0&pageSize=101"
          )
        );

      expect(
        response.status
      ).toBe(400);

      const body =
        await response.json();

      expect(
        body.error
      ).toBe(
        "Invalid audit log query."
      );

      expect(
        body.details
      ).toBeDefined();

      expect(
        mocks.listAuditLogs
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when from is after to", async () => {
      const response =
        await GET(
          createRequest(
            "?from=2026-10-22T00%3A00%3A00.000Z" +
              "&to=2026-10-21T00%3A00%3A00.000Z"
          )
        );

      expect(
        response.status
      ).toBe(400);

      const body =
        await response.json();

      expect(
        body.error
      ).toBe(
        "Invalid audit log query."
      );

      expect(
        mocks.listAuditLogs
      ).not.toHaveBeenCalled();
    });

    it("serializes audit logs without exposing internal numeric IDs", async () => {
      const createdAt =
        new Date(
          "2026-10-21T14:30:00.000Z"
        );

      mocks
        .listAuditLogs
        .mockResolvedValue({
          total: 1,
          logs: [
            {
              publicId:
                "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              actorUserPublicId:
                "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              actorFirstName:
                "Kevin",
              actorLastName:
                "Cross",
              departmentPublicId:
                "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              departmentCode:
                "TRADE",
              action:
                "STAFF_ROLE_ASSIGNED",
              entityType:
                "STAFF_USER_ROLE",
              entityId:
                "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
              previousValues:
                null,
              newValues: {
                roleCode:
                  "REVIEW_OFFICER",
              },
              metadata: {
                source:
                  "staff-api",
              },
              ipAddress:
                "127.0.0.1",
              userAgent:
                "Vitest",
              createdAt,
            },
          ],
        });

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(200);

      const body =
        await response.json();

      expect(
        body
      ).toEqual({
        auditLogs: [
          {
            publicId:
              "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            actorUserPublicId:
              "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            actorFirstName:
              "Kevin",
            actorLastName:
              "Cross",
            departmentPublicId:
              "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            departmentCode:
              "TRADE",
            action:
              "STAFF_ROLE_ASSIGNED",
            entityType:
              "STAFF_USER_ROLE",
            entityId:
              "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            previousValues:
              null,
            newValues: {
              roleCode:
                "REVIEW_OFFICER",
            },
            metadata: {
              source:
                "staff-api",
            },
            ipAddress:
              "127.0.0.1",
            userAgent:
              "Vitest",
            createdAt:
              "2026-10-21T14:30:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 25,
          total: 1,
          totalPages: 1,
        },
      });

      expect(
        body.auditLogs[0].id
      ).toBeUndefined();

      expect(
        body.auditLogs[0]
          .actorUserId
      ).toBeUndefined();

      expect(
        body.auditLogs[0]
          .departmentId
      ).toBeUndefined();
    });

    it("returns correct pagination metadata", async () => {
      mocks
        .listAuditLogs
        .mockResolvedValue({
          logs: [],
          total: 126,
        });

      const response =
        await GET(
          createRequest(
            "?page=3&pageSize=25"
          )
        );

      expect(
        response.status
      ).toBe(200);

      await expect(
        response.json()
      ).resolves.toEqual({
        auditLogs: [],
        pagination: {
          page: 3,
          pageSize: 25,
          total: 126,
          totalPages: 6,
        },
      });
    });

    it("returns zero total pages when there are no audit logs", async () => {
      mocks
        .listAuditLogs
        .mockResolvedValue({
          logs: [],
          total: 0,
        });

      const response =
        await GET(
          createRequest()
        );

      await expect(
        response.json()
      ).resolves.toEqual({
        auditLogs: [],
        pagination: {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("rethrows unexpected errors", async () => {
      const databaseError =
        new Error(
          "Database unavailable"
        );

      mocks
        .listAuditLogs
        .mockRejectedValue(
          databaseError
        );

      await expect(
        GET(
          createRequest()
        )
      ).rejects.toBe(
        databaseError
      );
    });
  }
);