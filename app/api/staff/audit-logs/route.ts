import { NextResponse } from "next/server";
import {
  getRequestAuthorization,
} from "@/lib/rbac/request-authorization";
import {
  requirePermission,
} from "@/lib/rbac/permission-guard";
import {
  handleAuthorizationError,
} from "@/lib/http/authorization-error";
import {
  listAuditLogs,
  type AuditLog,
} from "@/lib/audit/audit-log-repository";
import {
  auditLogQuerySchema,
} from "@/lib/audit/audit-log-validation";

function serializeAuditLog(
  auditLog: AuditLog
) {
  return {
    publicId:
      auditLog.publicId,
    actorUserPublicId:
      auditLog.actorUserPublicId,
    actorFirstName:
      auditLog.actorFirstName,
    actorLastName:
      auditLog.actorLastName,
    departmentPublicId:
      auditLog.departmentPublicId,
    departmentCode:
      auditLog.departmentCode,
    action:
      auditLog.action,
    entityType:
      auditLog.entityType,
    entityId:
      auditLog.entityId,
    previousValues:
      auditLog.previousValues,
    newValues:
      auditLog.newValues,
    metadata:
      auditLog.metadata,
    ipAddress:
      auditLog.ipAddress,
    userAgent:
      auditLog.userAgent,
    createdAt:
      auditLog.createdAt.toISOString(),
  };
}

export async function GET(
  request: Request
) {
  try {
    const authorization =
      await getRequestAuthorization(
        request
      );

    requirePermission(
      authorization,
      "AUDIT_VIEW"
    );

    const url =
      new URL(request.url);

    const queryResult =
      auditLogQuerySchema.safeParse({
        page:
          url.searchParams.get(
            "page"
          ) ?? undefined,
        pageSize:
          url.searchParams.get(
            "pageSize"
          ) ?? undefined,
        action:
          url.searchParams.get(
            "action"
          ) ?? undefined,
        entityType:
          url.searchParams.get(
            "entityType"
          ) ?? undefined,
        actorUserPublicId:
          url.searchParams.get(
            "actorUserPublicId"
          ) ?? undefined,
        from:
          url.searchParams.get(
            "from"
          ) ?? undefined,
        to:
          url.searchParams.get(
            "to"
          ) ?? undefined,
      });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error:
            "Invalid audit log query.",
          details:
            queryResult.error
              .issues,
        },
        {
          status: 400,
        }
      );
    }

    const {
      page,
      pageSize,
      action,
      entityType,
      actorUserPublicId,
      from,
      to,
    } = queryResult.data;

    const filters = {
      page,
      pageSize,
      ...(action !== undefined
        ? { action }
        : {}),
      ...(entityType !==
      undefined
        ? { entityType }
        : {}),
      ...(actorUserPublicId !==
      undefined
        ? {
            actorUserPublicId,
          }
        : {}),
      ...(from !== undefined
        ? { from }
        : {}),
      ...(to !== undefined
        ? { to }
        : {}),
    };

    const result =
      await listAuditLogs(
        filters
      );

    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(
            result.total /
              pageSize
          );

    return NextResponse.json({
      auditLogs:
        result.logs.map(
          serializeAuditLog
        ),
      pagination: {
        page,
        pageSize,
        total:
          result.total,
        totalPages,
      },
    });
  } catch (error) {
    const authorizationResponse =
      handleAuthorizationError(
        error
      );

    if (
      authorizationResponse
    ) {
      return authorizationResponse;
    }

    throw error;
  }
}