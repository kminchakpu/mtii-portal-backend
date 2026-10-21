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
  listAuditLogs,
} from "@/lib/audit/audit-log-repository";

describe(
  "audit log repository",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("lists audit logs with actor and department details", async () => {
      const createdAt =
        new Date(
          "2026-10-21T10:00:00.000Z"
        );

      mocks.execute
        .mockResolvedValueOnce([
          [
            {
              total: 1,
            },
          ],
          [],
        ])
        .mockResolvedValueOnce([
          [
            {
              public_id:
                "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              actor_user_public_id:
                "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              actor_first_name:
                "Kevin",
              actor_last_name:
                "Cross",
              department_public_id:
                "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              department_code:
                "TRADE",
              action:
                "STAFF_ROLE_ASSIGNED",
              entity_type:
                "STAFF_USER_ROLE",
              entity_id:
                "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
              previous_values:
                null,
              new_values:
                JSON.stringify({
                  roleCode:
                    "REVIEW_OFFICER",
                }),
              metadata:
                JSON.stringify({
                  source:
                    "staff-api",
                }),
              ip_address:
                "127.0.0.1",
              user_agent:
                "Vitest",
              created_at:
                createdAt,
            },
          ],
          [],
        ]);

      const result =
        await listAuditLogs({
          page: 1,
          pageSize: 25,
        });

      expect(
        result.total
      ).toBe(1);

      expect(
        result.logs
      ).toEqual([
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
      ]);
    });

    it("uses LIMIT and OFFSET for pagination", async () => {
      mocks.execute
        .mockResolvedValueOnce([
          [
            {
              total: 0,
            },
          ],
          [],
        ])
        .mockResolvedValueOnce([
          [],
          [],
        ]);

      await listAuditLogs({
        page: 3,
        pageSize: 25,
      });

      const listCall =
        mocks.execute.mock
          .calls[1];

      expect(
        listCall[0]
      ).toContain(
        "LIMIT ? OFFSET ?"
      );

      expect(
        listCall[1]
      ).toEqual([
        25,
        50,
      ]);
    });

    it("filters by action using a parameterized value", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      await listAuditLogs({
        page: 1,
        pageSize: 25,
        action:
          "STAFF_ROLE_ASSIGNED",
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[0]
      ).toContain(
        "al.action = ?"
      );

      expect(
        countCall[1]
      ).toContain(
        "STAFF_ROLE_ASSIGNED"
      );

      expect(
        countCall[0]
      ).not.toContain(
        "STAFF_ROLE_ASSIGNED"
      );
    });

    it("filters by entity type using a parameterized value", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      await listAuditLogs({
        page: 1,
        pageSize: 25,
        entityType:
          "STAFF_USER_ROLE",
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[0]
      ).toContain(
        "al.entity_type = ?"
      );

      expect(
        countCall[1]
      ).toContain(
        "STAFF_USER_ROLE"
      );
    });

    it("filters by actor public ID using a parameterized value", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      const actorUserPublicId =
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

      await listAuditLogs({
        page: 1,
        pageSize: 25,
        actorUserPublicId,
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[0]
      ).toContain(
        "actor.public_id = ?"
      );

      expect(
        countCall[1]
      ).toContain(
        actorUserPublicId
      );

      expect(
        countCall[0]
      ).not.toContain(
        actorUserPublicId
      );
    });

    it("filters by start date using a parameterized value", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      const from =
        new Date(
          "2026-10-01T00:00:00.000Z"
        );

      await listAuditLogs({
        page: 1,
        pageSize: 25,
        from,
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[0]
      ).toContain(
        "al.created_at >= ?"
      );

      expect(
        countCall[1]
      ).toContain(
        from
      );
    });

    it("filters by end date using a parameterized value", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      const to =
        new Date(
          "2026-10-21T23:59:59.999Z"
        );

      await listAuditLogs({
        page: 1,
        pageSize: 25,
        to,
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[0]
      ).toContain(
        "al.created_at <= ?"
      );

      expect(
        countCall[1]
      ).toContain(
        to
      );
    });

    it("combines filters in a stable parameter order", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      const from =
        new Date(
          "2026-10-01T00:00:00.000Z"
        );

      const to =
        new Date(
          "2026-10-21T23:59:59.999Z"
        );

      await listAuditLogs({
        page: 2,
        pageSize: 10,
        action:
          "STAFF_USER_UPDATED",
        entityType:
          "STAFF_USER",
        actorUserPublicId:
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        from,
        to,
      });

      const countCall =
        mocks.execute.mock
          .calls[0];

      expect(
        countCall[1]
      ).toEqual([
        "STAFF_USER_UPDATED",
        "STAFF_USER",
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        from,
        to,
      ]);

      const listCall =
        mocks.execute.mock
          .calls[1];

      expect(
        listCall[1]
      ).toEqual([
        "STAFF_USER_UPDATED",
        "STAFF_USER",
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        from,
        to,
        10,
        10,
      ]);
    });

    it("orders audit logs newest first", async () => {
      mocks.execute
        .mockResolvedValue([
          [],
          [],
        ]);

      await listAuditLogs({
        page: 1,
        pageSize: 25,
      });

      const listCall =
        mocks.execute.mock
          .calls[1];

      const normalizedSql =
        String(listCall[0])
          .replace(/\s+/g, " ")
          .trim();

      expect(
        normalizedSql
      ).toContain(
        "ORDER BY al.created_at DESC, al.id DESC"
      );
    });

    it("supports audit records without an actor or department", async () => {
      const createdAt =
        new Date(
          "2026-10-21T12:00:00.000Z"
        );

      mocks.execute
        .mockResolvedValueOnce([
          [
            {
              total: 1,
            },
          ],
          [],
        ])
        .mockResolvedValueOnce([
          [
            {
              public_id:
                "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
              actor_user_public_id:
                null,
              actor_first_name:
                null,
              actor_last_name:
                null,
              department_public_id:
                null,
              department_code:
                null,
              action:
                "LOGIN_FAILED",
              entity_type:
                "STAFF_AUTH",
              entity_id:
                null,
              previous_values:
                null,
              new_values:
                null,
              metadata:
                null,
              ip_address:
                null,
              user_agent:
                null,
              created_at:
                createdAt,
            },
          ],
          [],
        ]);

      const result =
        await listAuditLogs({
          page: 1,
          pageSize: 25,
        });

      expect(
        result.logs[0]
      ).toEqual({
        publicId:
          "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        actorUserPublicId:
          null,
        actorFirstName:
          null,
        actorLastName:
          null,
        departmentPublicId:
          null,
        departmentCode:
          null,
        action:
          "LOGIN_FAILED",
        entityType:
          "STAFF_AUTH",
        entityId:
          null,
        previousValues:
          null,
        newValues:
          null,
        metadata:
          null,
        ipAddress:
          null,
        userAgent:
          null,
        createdAt,
      });
    });
  }
);