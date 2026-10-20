import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const dbExecute = vi.fn();

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute: dbExecute,
    },
  })
);

describe("audit logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes an audit record with serialized JSON values", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        {
          affectedRows: 1,
        },
      ]);

    const { writeAuditLog } =
      await import(
        "@/lib/audit/logger"
      );

    await writeAuditLog(
      {
        actorUserId: 1,
        departmentId: 2,
        action: "STAFF_LOGIN",
        entityType: "USER",
        entityId: "user-public-id",
        previousValues: {
          status: "SIGNED_OUT",
        },
        newValues: {
          status: "SIGNED_IN",
        },
        metadata: {
          source: "staff-auth",
        },
      },
      {
        execute,
      }
    );

    expect(execute).toHaveBeenCalledOnce();

    const [sql, parameters] =
      execute.mock.calls[0];

    expect(sql).toContain(
      "INSERT INTO audit_logs"
    );

    expect(parameters).toEqual([
      1,
      2,
      "STAFF_LOGIN",
      "USER",
      "user-public-id",
      JSON.stringify({
        status: "SIGNED_OUT",
      }),
      JSON.stringify({
        status: "SIGNED_IN",
      }),
      JSON.stringify({
        source: "staff-auth",
      }),
    ]);
  });

  it("stores optional audit values as null", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        {
          affectedRows: 1,
        },
      ]);

    const { writeAuditLog } =
      await import(
        "@/lib/audit/logger"
      );

    await writeAuditLog(
      {
        actorUserId: 1,
        action: "STAFF_LOGOUT",
        entityType: "SESSION",
      },
      {
        execute,
      }
    );

    const [, parameters] =
      execute.mock.calls[0];

    expect(parameters).toEqual([
      1,
      null,
      "STAFF_LOGOUT",
      "SESSION",
      null,
      null,
      null,
      null,
    ]);
  });

  it("uses the application database when no executor is provided", async () => {
    dbExecute.mockResolvedValue([
      {
        affectedRows: 1,
      },
    ]);

    const { writeAuditLog } =
      await import(
        "@/lib/audit/logger"
      );

    await writeAuditLog({
      actorUserId: 1,
      departmentId: 1,
      action: "STAFF_LOGIN",
      entityType: "USER",
      entityId: "user-public-id",
      metadata: {
        source: "staff-auth",
      },
    });

    expect(
      dbExecute
    ).toHaveBeenCalledOnce();

    const [, parameters] =
      dbExecute.mock.calls[0];

    expect(parameters).toEqual([
      1,
      1,
      "STAFF_LOGIN",
      "USER",
      "user-public-id",
      null,
      null,
      JSON.stringify({
        source: "staff-auth",
      }),
    ]);
  });
});