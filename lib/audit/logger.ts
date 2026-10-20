import type {
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { db } from "@/lib/db/pool";

export type AuditLogInput = {
  actorUserId: number | null;
  departmentId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
};

type AuditExecutor = Pick<
  PoolConnection,
  "execute"
>;

export async function writeAuditLog(
  input: AuditLogInput,
  executor: AuditExecutor = db
): Promise<void> {
  await executor.execute<ResultSetHeader>(
    `
      INSERT INTO audit_logs (
        actor_user_id,
        department_id,
        action,
        entity_type,
        entity_id,
        previous_values,
        new_values,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.actorUserId,
      input.departmentId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.previousValues === undefined
        ? null
        : JSON.stringify(input.previousValues),
      input.newValues === undefined
        ? null
        : JSON.stringify(input.newValues),
      input.metadata === undefined
        ? null
        : JSON.stringify(input.metadata),
    ]
  );
}