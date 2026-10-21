import type {
  ExecuteValues,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";

type AuditLogRow =
  RowDataPacket & {
    public_id: string;
    actor_user_public_id:
      string | null;
    actor_first_name:
      string | null;
    actor_last_name:
      string | null;
    department_public_id:
      string | null;
    department_code:
      string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    previous_values: unknown;
    new_values: unknown;
    metadata: unknown;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
  };

type AuditLogCountRow =
  RowDataPacket & {
    total: number;
  };

export type AuditLog = {
  publicId: string;
  actorUserPublicId:
    string | null;
  actorFirstName:
    string | null;
  actorLastName:
    string | null;
  departmentPublicId:
    string | null;
  departmentCode:
    string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  previousValues: unknown;
  newValues: unknown;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type AuditLogFilters = {
  page: number;
  pageSize: number;
  action?: string;
  entityType?: string;
  actorUserPublicId?: string;
  from?: Date;
  to?: Date;
};

export type AuditLogListResult = {
  logs: AuditLog[];
  total: number;
};

type AuditFilterValue =
  | string
  | number
  | Date
  | null;

function parseJsonValue(
  value: unknown
): unknown {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "string"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapAuditLog(
  row: AuditLogRow
): AuditLog {
  return {
    publicId:
      row.public_id,
    actorUserPublicId:
      row.actor_user_public_id,
    actorFirstName:
      row.actor_first_name,
    actorLastName:
      row.actor_last_name,
    departmentPublicId:
      row.department_public_id,
    departmentCode:
      row.department_code,
    action:
      row.action,
    entityType:
      row.entity_type,
    entityId:
      row.entity_id,
    previousValues:
      parseJsonValue(
        row.previous_values
      ),
    newValues:
      parseJsonValue(
        row.new_values
      ),
    metadata:
      parseJsonValue(
        row.metadata
      ),
    ipAddress:
      row.ip_address,
    userAgent:
      row.user_agent,
    createdAt:
      row.created_at,
  };
}

function buildAuditLogFilters(
  filters: AuditLogFilters
): {
  whereClause: string;
  values: AuditFilterValue[];
} {
  const conditions:
    string[] = [];

  const values:
    AuditFilterValue[] = [];

  if (filters.action) {
    conditions.push(
      "al.action = ?"
    );
    values.push(
      filters.action
    );
  }

  if (filters.entityType) {
    conditions.push(
      "al.entity_type = ?"
    );
    values.push(
      filters.entityType
    );
  }

  if (
    filters.actorUserPublicId
  ) {
    conditions.push(
      "actor.public_id = ?"
    );
    values.push(
      filters.actorUserPublicId
    );
  }

  if (filters.from) {
    conditions.push(
      "al.created_at >= ?"
    );
    values.push(
      filters.from
    );
  }

  if (filters.to) {
    conditions.push(
      "al.created_at <= ?"
    );
    values.push(
      filters.to
    );
  }

  return {
    whereClause:
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "",
    values,
  };
}

export async function listAuditLogs(
  filters: AuditLogFilters
): Promise<AuditLogListResult> {
  const {
    whereClause,
    values,
  } =
    buildAuditLogFilters(
      filters
    );

  const countValues:
    ExecuteValues =
      values;

  const [countRows] =
    await db.execute<
      AuditLogCountRow[]
    >(
      `
        SELECT
          COUNT(*) AS total
        FROM audit_logs al
        LEFT JOIN users actor
          ON actor.id =
            al.actor_user_id
        ${whereClause}
      `,
      countValues
    );

  const total =
    Number(
      countRows[0]?.total ??
        0
    );

  const offset =
    (filters.page - 1) *
    filters.pageSize;

  const listValues:
    ExecuteValues = [
      ...values,
      filters.pageSize,
      offset,
    ];

  const [rows] =
    await db.execute<
      AuditLogRow[]
    >(
      `
        SELECT
          al.public_id,
          actor.public_id
            AS actor_user_public_id,
          actor.first_name
            AS actor_first_name,
          actor.last_name
            AS actor_last_name,
          department.public_id
            AS department_public_id,
          department.code
            AS department_code,
          al.action,
          al.entity_type,
          al.entity_id,
          al.previous_values,
          al.new_values,
          al.metadata,
          al.ip_address,
          al.user_agent,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users actor
          ON actor.id =
            al.actor_user_id
        LEFT JOIN departments
          department
          ON department.id =
            al.department_id
        ${whereClause}
        ORDER BY
          al.created_at DESC,
          al.id DESC
        LIMIT ? OFFSET ?
      `,
      listValues
    );

  return {
    logs:
      rows.map(
        mapAuditLog
      ),
    total,
  };
}