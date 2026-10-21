import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  dbExecute: vi.fn(),
}));

vi.mock(
  "@/lib/db/pool",
  () => ({
    db: {
      execute:
        mocks.dbExecute,
    },
  })
);

import {
  writeAuditLog,
} from "@/lib/audit/logger";

describe("audit logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes an audit record with a generated public ID and serialized JSON values", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        {
          affectedRows: 1,
        },
      ]);

    await writeAuditLog(
      {
        actorUserId: 1,
        departmentId: 2,
        action:
          "STAFF_LOGIN",
        entityType: "USER",
        entityId:
          "user-public-id",
        previousValues: {
          status:
            "SIGNED_OUT",
        },
        newValues: {
          status:
            "SIGNED_IN",
        },
        metadata: {
          source:
            "staff-auth",
        },
      },
      {
        execute,
      }
    );

    expect(
      execute
    ).toHaveBeenCalledOnce();

    const [sql, parameters] =
      execute.mock.calls[0];

    expect(sql).toContain(
      "INSERT INTO audit_logs"
    );

    expect(sql).toContain(
      "public_id"
    );

    expect(
      parameters
    ).toHaveLength(9);

    expect(
      parameters[0]
    ).toEqual(
      expect.any(String)
    );

    expect(
      parameters[0]
    ).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    expect(
      parameters.slice(1)
    ).toEqual([
      1,
      2,
      "STAFF_LOGIN",
      "USER",
      "user-public-id",
      JSON.stringify({
        status:
          "SIGNED_OUT",
      }),
      JSON.stringify({
        status:
          "SIGNED_IN",
      }),
      JSON.stringify({
        source:
          "staff-auth",
      }),
    ]);
  });

  it("generates a different public ID for each audit record", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        {
          affectedRows: 1,
        },
      ]);

    await writeAuditLog(
      {
        actorUserId: 1,
        action:
          "STAFF_LOGIN",
        entityType: "USER",
      },
      {
        execute,
      }
    );

    await writeAuditLog(
      {
        actorUserId: 1,
        action:
          "STAFF_LOGOUT",
        entityType:
          "SESSION",
      },
      {
        execute,
      }
    );

    expect(
      execute
    ).toHaveBeenCalledTimes(
      2
    );

    const firstParameters =
      execute.mock.calls[0][1];

    const secondParameters =
      execute.mock.calls[1][1];

    expect(
      firstParameters[0]
    ).toEqual(
      expect.any(String)
    );

    expect(
      secondParameters[0]
    ).toEqual(
      expect.any(String)
    );

    expect(
      firstParameters[0]
    ).not.toBe(
      secondParameters[0]
    );
  });

  it("stores optional audit values as null", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        {
          affectedRows: 1,
        },
      ]);

    await writeAuditLog(
      {
        actorUserId: 1,
        action:
          "STAFF_LOGOUT",
        entityType:
          "SESSION",
      },
      {
        execute,
      }
    );

    const [, parameters] =
      execute.mock.calls[0];

    expect(
      parameters
    ).toHaveLength(9);

    expect(
      parameters[0]
    ).toEqual(
      expect.any(String)
    );

    expect(
      parameters.slice(1)
    ).toEqual([
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
    mocks.dbExecute.mockResolvedValue([
      {
        affectedRows: 1,
      },
    ]);

    await writeAuditLog({
      actorUserId: 1,
      departmentId: 1,
      action:
        "STAFF_LOGIN",
      entityType: "USER",
      entityId:
        "user-public-id",
      metadata: {
        source:
          "staff-auth",
      },
    });

    expect(
      mocks.dbExecute
    ).toHaveBeenCalledOnce();

    const [sql, parameters] =
      mocks.dbExecute.mock.calls[0];

    expect(sql).toContain(
      "INSERT INTO audit_logs"
    );

    expect(sql).toContain(
      "public_id"
    );

    expect(
      parameters
    ).toHaveLength(9);

    expect(
      parameters[0]
    ).toEqual(
      expect.any(String)
    );

    expect(
      parameters[0]
    ).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    expect(
      parameters.slice(1)
    ).toEqual([
      1,
      1,
      "STAFF_LOGIN",
      "USER",
      "user-public-id",
      null,
      null,
      JSON.stringify({
        source:
          "staff-auth",
      }),
    ]);
  });
});