export type StaffAuditLog = {
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
  createdAt: string;
};

export type StaffAuditLogPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type StaffAuditLogListResult = {
  auditLogs: StaffAuditLog[];
  pagination:
    StaffAuditLogPagination;
};

export type StaffAuditLogQuery = {
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  actorUserPublicId?: string;
  from?: string;
  to?: string;
};

type ErrorResponse = {
  error?: unknown;
};

function addStringParameter(
  searchParams:
    URLSearchParams,
  name: string,
  value:
    string | undefined
) {
  if (
    value === undefined ||
    value.trim() === ""
  ) {
    return;
  }

  searchParams.set(
    name,
    value
  );
}

function buildAuditLogUrl(
  query:
    StaffAuditLogQuery
): string {
  const searchParams =
    new URLSearchParams();

  if (
    query.page !== undefined
  ) {
    searchParams.set(
      "page",
      String(query.page)
    );
  }

  if (
    query.pageSize !==
    undefined
  ) {
    searchParams.set(
      "pageSize",
      String(
        query.pageSize
      )
    );
  }

  addStringParameter(
    searchParams,
    "action",
    query.action
  );

  addStringParameter(
    searchParams,
    "entityType",
    query.entityType
  );

  addStringParameter(
    searchParams,
    "actorUserPublicId",
    query.actorUserPublicId
  );

  addStringParameter(
    searchParams,
    "from",
    query.from
  );

  addStringParameter(
    searchParams,
    "to",
    query.to
  );

  const queryString =
    searchParams.toString();

  return queryString
    ? `/api/staff/audit-logs?${queryString}`
    : "/api/staff/audit-logs";
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const body =
      (await response.json()) as
        ErrorResponse;

    if (
      typeof body.error ===
        "string" &&
      body.error.trim() !== ""
    ) {
      return body.error;
    }
  } catch {
    return "Unable to load audit logs.";
  }

  return "Unable to load audit logs.";
}

export async function getStaffAuditLogs(
  query:
    StaffAuditLogQuery = {}
): Promise<StaffAuditLogListResult> {
  const response =
    await fetch(
      buildAuditLogUrl(
        query
      ),
      {
        method: "GET",
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  return (await response.json()) as
    StaffAuditLogListResult;
}