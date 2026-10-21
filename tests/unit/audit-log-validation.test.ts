import {
  describe,
  expect,
  it,
} from "vitest";

import {
  auditLogQuerySchema,
} from "@/lib/audit/audit-log-validation";

describe(
  "audit log query validation",
  () => {
    it("uses default pagination when page and pageSize are omitted", () => {
      const result =
        auditLogQuerySchema.parse({});

      expect(
        result.page
      ).toBe(1);

      expect(
        result.pageSize
      ).toBe(25);
    });

    it("converts page and pageSize query strings to numbers", () => {
      const result =
        auditLogQuerySchema.parse({
          page: "3",
          pageSize: "50",
        });

      expect(
        result.page
      ).toBe(3);

      expect(
        result.pageSize
      ).toBe(50);
    });

    it("rejects page less than 1", () => {
      const result =
        auditLogQuerySchema.safeParse({
          page: "0",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects pageSize less than 1", () => {
      const result =
        auditLogQuerySchema.safeParse({
          pageSize: "0",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects pageSize greater than 100", () => {
      const result =
        auditLogQuerySchema.safeParse({
          pageSize: "101",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("rejects non-integer pagination values", () => {
      const pageResult =
        auditLogQuerySchema.safeParse({
          page: "1.5",
        });

      const pageSizeResult =
        auditLogQuerySchema.safeParse({
          pageSize: "25.5",
        });

      expect(
        pageResult.success
      ).toBe(false);

      expect(
        pageSizeResult.success
      ).toBe(false);
    });

    it("rejects non-numeric pagination values", () => {
      const result =
        auditLogQuerySchema.safeParse({
          page: "abc",
          pageSize: "xyz",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("accepts action and entity type filters", () => {
      const result =
        auditLogQuerySchema.parse({
          action:
            "STAFF_ROLE_ASSIGNED",
          entityType:
            "STAFF_USER_ROLE",
        });

      expect(
        result.action
      ).toBe(
        "STAFF_ROLE_ASSIGNED"
      );

      expect(
        result.entityType
      ).toBe(
        "STAFF_USER_ROLE"
      );
    });

    it("trims action and entity type filters", () => {
      const result =
        auditLogQuerySchema.parse({
          action:
            "  STAFF_USER_UPDATED  ",
          entityType:
            "  STAFF_USER  ",
        });

      expect(
        result.action
      ).toBe(
        "STAFF_USER_UPDATED"
      );

      expect(
        result.entityType
      ).toBe(
        "STAFF_USER"
      );
    });

    it("rejects empty action and entity type filters", () => {
      const actionResult =
        auditLogQuerySchema.safeParse({
          action: "   ",
        });

      const entityResult =
        auditLogQuerySchema.safeParse({
          entityType: "   ",
        });

      expect(
        actionResult.success
      ).toBe(false);

      expect(
        entityResult.success
      ).toBe(false);
    });

    it("accepts a valid actor user public ID", () => {
      const actorUserPublicId =
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

      const result =
        auditLogQuerySchema.parse({
          actorUserPublicId,
        });

      expect(
        result.actorUserPublicId
      ).toBe(
        actorUserPublicId
      );
    });

    it("rejects an invalid actor user public ID", () => {
      const result =
        auditLogQuerySchema.safeParse({
          actorUserPublicId:
            "not-a-uuid",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("converts valid from and to values to Date objects", () => {
      const result =
        auditLogQuerySchema.parse({
          from:
            "2026-10-01T00:00:00.000Z",
          to:
            "2026-10-21T23:59:59.999Z",
        });

      expect(
        result.from
      ).toEqual(
        new Date(
          "2026-10-01T00:00:00.000Z"
        )
      );

      expect(
        result.to
      ).toEqual(
        new Date(
          "2026-10-21T23:59:59.999Z"
        )
      );
    });

    it("rejects invalid date filters", () => {
      const fromResult =
        auditLogQuerySchema.safeParse({
          from: "not-a-date",
        });

      const toResult =
        auditLogQuerySchema.safeParse({
          to: "also-not-a-date",
        });

      expect(
        fromResult.success
      ).toBe(false);

      expect(
        toResult.success
      ).toBe(false);
    });

    it("rejects a date range where from is after to", () => {
      const result =
        auditLogQuerySchema.safeParse({
          from:
            "2026-10-22T00:00:00.000Z",
          to:
            "2026-10-21T00:00:00.000Z",
        });

      expect(
        result.success
      ).toBe(false);
    });

    it("accepts all supported filters together", () => {
      const result =
        auditLogQuerySchema.parse({
          page: "2",
          pageSize: "50",
          action:
            "STAFF_ROLE_ASSIGNED",
          entityType:
            "STAFF_USER_ROLE",
          actorUserPublicId:
            "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          from:
            "2026-10-01T00:00:00.000Z",
          to:
            "2026-10-21T23:59:59.999Z",
        });

      expect(
        result
      ).toEqual({
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
  }
);