import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  getStaffAuditLogs,
} from "@/lib/staff-ui/staff-audit-logs-client";

const originalFetch =
  global.fetch;

const auditLog = {
  publicId:
    "audit-public-id",
  actorUserPublicId:
    "actor-public-id",
  actorFirstName:
    "Kevin",
  actorLastName:
    "Admin",
  departmentPublicId:
    "department-public-id",
  departmentCode:
    "ADMIN",
  action:
    "USER_UPDATED",
  entityType:
    "USER",
  entityId:
    "user-public-id",
  previousValues: {
    isActive: false,
  },
  newValues: {
    isActive: true,
  },
  metadata: {
    source: "staff",
  },
  ipAddress:
    "127.0.0.1",
  userAgent:
    "Vitest",
  createdAt:
    "2026-10-22T10:00:00.000Z",
};

const responseBody = {
  auditLogs: [
    auditLog,
  ],
  pagination: {
    page: 1,
    pageSize: 25,
    total: 1,
    totalPages: 1,
  },
};

describe(
  "staff audit logs client",
  () => {
    beforeEach(() => {
      global.fetch =
        vi.fn();
    });

    afterEach(() => {
      global.fetch =
        originalFetch;

      vi.restoreAllMocks();
    });

    it(
      "loads audit logs with default query parameters",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
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
          await getStaffAuditLogs();

        expect(
          global.fetch
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs",
          {
            method: "GET",
          }
        );

        expect(result).toEqual(
          responseBody
        );
      }
    );

    it(
      "adds pagination to the audit log request",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          page: 2,
          pageSize: 50,
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs?page=2&pageSize=50",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "adds action and entity type filters",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          action:
            "USER_UPDATED",
          entityType:
            "USER",
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs?action=USER_UPDATED&entityType=USER",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "adds an actor user filter",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          actorUserPublicId:
            "actor-public-id",
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs?actorUserPublicId=actor-public-id",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "adds from and to date filters",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          from:
            "2026-10-01T00:00:00.000Z",
          to:
            "2026-10-22T23:59:59.999Z",
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs?from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-22T23%3A59%3A59.999Z",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "combines supported filters in a stable order",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          page: 3,
          pageSize: 10,
          action:
            "ROLE_ASSIGNED",
          entityType:
            "USER_ROLE",
          actorUserPublicId:
            "actor-public-id",
          from:
            "2026-10-01T00:00:00.000Z",
          to:
            "2026-10-22T23:59:59.999Z",
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs?page=3&pageSize=10&action=ROLE_ASSIGNED&entityType=USER_ROLE&actorUserPublicId=actor-public-id&from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-22T23%3A59%3A59.999Z",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "omits empty optional filters",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify(
              responseBody
            ),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await getStaffAuditLogs({
          action: "",
          entityType: "",
          actorUserPublicId: "",
          from: "",
          to: "",
        });

        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/staff/audit-logs",
          {
            method: "GET",
          }
        );
      }
    );

    it(
      "throws the API error when the request fails",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            JSON.stringify({
              error:
                "Invalid audit log query.",
            }),
            {
              status: 400,
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          )
        );

        await expect(
          getStaffAuditLogs({
            page: 0,
          })
        ).rejects.toThrow(
          "Invalid audit log query."
        );
      }
    );

    it(
      "uses a safe fallback when the API error has no message",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
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

        await expect(
          getStaffAuditLogs()
        ).rejects.toThrow(
          "Unable to load audit logs."
        );
      }
    );

    it(
      "uses a safe fallback when an error response is not JSON",
      async () => {
        vi.mocked(
          global.fetch
        ).mockResolvedValue(
          new Response(
            "Internal Server Error",
            {
              status: 500,
              headers: {
                "Content-Type":
                  "text/plain",
              },
            }
          )
        );

        await expect(
          getStaffAuditLogs()
        ).rejects.toThrow(
          "Unable to load audit logs."
        );
      }
    );
  }
);