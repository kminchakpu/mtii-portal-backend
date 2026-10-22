"use client";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  getStaffAuditLogs,
  type StaffAuditLog,
  type StaffAuditLogQuery,
  type StaffAuditLogPagination,
} from "@/lib/staff-ui/staff-audit-logs-client";

const PAGE_SIZE = 25;

type StaffAuditLogsPanelProps = {
  initialPage?: number;
};

type FilterValues = {
  action: string;
  entityType: string;
  actorUserPublicId: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: FilterValues = {
  action: "",
  entityType: "",
  actorUserPublicId: "",
  from: "",
  to: "",
};

function createInitialPagination(
  page: number
): StaffAuditLogPagination {
  return {
    page,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
}

function getActorName(
  auditLog: StaffAuditLog
): string {
  const name = [
    auditLog.actorFirstName,
    auditLog.actorLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "System";
}

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function formatJson(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "None";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

function startOfDayIso(
  value: string
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T00:00:00.000Z`
  ).toISOString();
}

function endOfDayIso(
  value: string
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T23:59:59.999Z`
  ).toISOString();
}

function buildQuery(
  page: number,
  filters: FilterValues
): StaffAuditLogQuery {
  const query:
    StaffAuditLogQuery = {
      page,
      pageSize: PAGE_SIZE,
    };

  const action =
    filters.action.trim();

  const entityType =
    filters.entityType.trim();

  const actorUserPublicId =
    filters.actorUserPublicId.trim();

  if (action) {
    query.action =
      action;
  }

  if (entityType) {
    query.entityType =
      entityType;
  }

  if (
    actorUserPublicId
  ) {
    query.actorUserPublicId =
      actorUserPublicId;
  }

  const from =
    startOfDayIso(
      filters.from
    );

  const to =
    endOfDayIso(
      filters.to
    );

  if (from) {
    query.from = from;
  }

  if (to) {
    query.to = to;
  }

  return query;
}

export function StaffAuditLogsPanel({
  initialPage = 1,
}: StaffAuditLogsPanelProps) {
  const [
    auditLogs,
    setAuditLogs,
  ] = useState<
    StaffAuditLog[]
  >([]);

  const [
    pagination,
    setPagination,
  ] = useState<
    StaffAuditLogPagination
  >(
    createInitialPagination(
      initialPage
    )
  );

  const [
    draftFilters,
    setDraftFilters,
  ] = useState<FilterValues>(
    EMPTY_FILTERS
  );

  const [
    activeFilters,
    setActiveFilters,
  ] = useState<FilterValues>(
    EMPTY_FILTERS
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(
    initialPage
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    selectedAuditLog,
    setSelectedAuditLog,
  ] = useState<
    StaffAuditLog | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditLogs() {
      try {
        const result =
          await getStaffAuditLogs(
            buildQuery(
              currentPage,
              activeFilters
            )
          );

        if (!isMounted) {
          return;
        }

        setAuditLogs(
          result.auditLogs
        );

        setPagination(
          result.pagination
        );

        setError(null);
      } catch (
        loadError
      ) {
        if (!isMounted) {
          return;
        }

        setAuditLogs([]);

        if (
          loadError instanceof
          Error
        ) {
          setError(
            loadError.message
          );
        } else {
          setError(
            "Unable to load audit logs."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      isMounted = false;
    };
  }, [
    activeFilters,
    currentPage,
  ]);

  function updateDraftFilter(
    field:
      keyof FilterValues,
    value: string
  ) {
    setDraftFilters(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function handleApplyFilters(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    setActiveFilters({
      ...draftFilters,
    });
  }

  function handleClearFilters() {
    const clearedFilters = {
      ...EMPTY_FILTERS,
    };

    setIsLoading(true);
    setError(null);

    setDraftFilters(
      clearedFilters
    );

    setCurrentPage(1);

    setActiveFilters(
      clearedFilters
    );
  }

  function handlePrevious() {
    if (
      currentPage <= 1 ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    setCurrentPage(
      (page) =>
        Math.max(
          1,
          page - 1
        )
    );
  }

  function handleNext() {
    if (
      isLoading ||
      pagination.totalPages ===
        0 ||
      currentPage >=
        pagination.totalPages
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    setCurrentPage(
      (page) =>
        page + 1
    );
  }

  const displayTotalPages =
    pagination.totalPages ===
    0
      ? 0
      : pagination.totalPages;

  return (
    <section
      aria-labelledby="audit-logs-heading"
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffb000]">
          Security & Administration
        </p>
        <h1
          id="audit-logs-heading"
          className="mt-2 text-2xl font-bold text-white sm:text-3xl"
        >
          Audit Logs
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
          Review read-only
          records of staff
          authentication and
          administrative
          activity.
        </p>
      </div>

      <form
        onSubmit={
          handleApplyFilters
        }
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label
              htmlFor="audit-action"
              className="mb-2 block text-sm font-semibold text-white"
            >
              Action
            </label>
            <input
              id="audit-action"
              type="text"
              value={
                draftFilters.action
              }
              onChange={(
                event
              ) =>
                updateDraftFilter(
                  "action",
                  event.target
                    .value
                )
              }
              placeholder="USER_UPDATED"
              className="w-full rounded-lg border border-white/10 bg-[#071d2b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ffb000]"
            />
          </div>

          <div>
            <label
              htmlFor="audit-entity-type"
              className="mb-2 block text-sm font-semibold text-white"
            >
              Entity type
            </label>
            <input
              id="audit-entity-type"
              type="text"
              value={
                draftFilters.entityType
              }
              onChange={(
                event
              ) =>
                updateDraftFilter(
                  "entityType",
                  event.target
                    .value
                )
              }
              placeholder="USER"
              className="w-full rounded-lg border border-white/10 bg-[#071d2b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ffb000]"
            />
          </div>

          <div>
            <label
              htmlFor="audit-actor"
              className="mb-2 block text-sm font-semibold text-white"
            >
              Actor user public ID
            </label>
            <input
              id="audit-actor"
              type="text"
              value={
                draftFilters.actorUserPublicId
              }
              onChange={(
                event
              ) =>
                updateDraftFilter(
                  "actorUserPublicId",
                  event.target
                    .value
                )
              }
              placeholder="User public ID"
              className="w-full rounded-lg border border-white/10 bg-[#071d2b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ffb000]"
            />
          </div>

          <div>
            <label
              htmlFor="audit-from"
              className="mb-2 block text-sm font-semibold text-white"
            >
              From
            </label>
            <input
              id="audit-from"
              type="date"
              value={
                draftFilters.from
              }
              onChange={(
                event
              ) =>
                updateDraftFilter(
                  "from",
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border border-white/10 bg-[#071d2b] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#ffb000]"
            />
          </div>

          <div>
            <label
              htmlFor="audit-to"
              className="mb-2 block text-sm font-semibold text-white"
            >
              To
            </label>
            <input
              id="audit-to"
              type="date"
              value={
                draftFilters.to
              }
              onChange={(
                event
              ) =>
                updateDraftFilter(
                  "to",
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border border-white/10 bg-[#071d2b] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#ffb000]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={
              isLoading
            }
            className="rounded-lg bg-[#ffb000] px-4 py-2.5 text-sm font-bold text-[#071d2b] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={
              handleClearFilters
            }
            disabled={
              isLoading
            }
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Filters
          </button>
        </div>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div
          role="status"
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70"
        >
          Loading audit
          logs...
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      auditLogs.length ===
        0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
          No audit logs
          found.
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      auditLogs.length >
        0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/[0.04]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/60">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/60">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/60">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/60">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/60">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-white/60">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 bg-white/[0.02]">
                  {auditLogs.map(
                    (
                      auditLog
                    ) => (
                      <tr
                        key={
                          auditLog.publicId
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-white/70">
                          {formatDate(
                            auditLog.createdAt
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-white">
                          {getActorName(
                            auditLog
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-white/70">
                          {auditLog.departmentCode ??
                            "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-[#ffb000]/30 bg-[#ffb000]/10 px-2.5 py-1 text-xs font-bold text-[#ffb000]">
                            {
                              auditLog.action
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/70">
                          <div>
                            <span className="font-semibold text-white">
                              {
                                auditLog.entityType
                              }
                            </span>

                            {auditLog.entityId ? (
                              <p className="mt-1 max-w-48 truncate text-xs text-white/50">
                                {
                                  auditLog.entityId
                                }
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAuditLog(
                                auditLog
                              )
                            }
                            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000]"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:hidden">
            {auditLogs.map(
              (
                auditLog
              ) => (
                <article
                  key={
                    auditLog.publicId
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-[#ffb000]/30 bg-[#ffb000]/10 px-2.5 py-1 text-xs font-bold text-[#ffb000]">
                        {
                          auditLog.action
                        }
                      </span>

                      <p className="mt-3 text-sm font-semibold text-white">
                        {getActorName(
                          auditLog
                        )}
                      </p>

                      <p className="mt-1 text-xs text-white/55">
                        {formatDate(
                          auditLog.createdAt
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAuditLog(
                          auditLog
                        )
                      }
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000]"
                    >
                      View Details
                    </button>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/45">
                        Department
                      </dt>
                      <dd className="mt-1 text-white/80">
                        {auditLog.departmentCode ??
                          "—"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/45">
                        Entity
                      </dt>
                      <dd className="mt-1 text-white/80">
                        {
                          auditLog.entityType
                        }
                      </dd>
                    </div>
                  </dl>
                </article>
              )
            )}
          </div>
        </>
      ) : null}

      {!isLoading &&
      !error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Page{" "}
              {
                pagination.page
              }{" "}
              of{" "}
              {
                displayTotalPages
              }
            </p>

            <p className="mt-1 text-xs text-white/55">
              {
                pagination.total
              }{" "}
              total records
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                handlePrevious
              }
              disabled={
                isLoading ||
                currentPage <=
                  1
              }
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={
                handleNext
              }
              disabled={
                isLoading ||
                pagination.totalPages ===
                  0 ||
                currentPage >=
                  pagination.totalPages
              }
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selectedAuditLog ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-log-details-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#071d2b] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb000]">
                  Read-only record
                </p>

                <h2
                  id="audit-log-details-heading"
                  className="mt-2 text-xl font-bold text-white"
                >
                  Audit Log Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAuditLog(
                    null
                  )
                }
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#ffb000] hover:text-[#ffb000]"
              >
                Close Details
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Action
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {
                      selectedAuditLog.action
                    }
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Entity type
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {
                      selectedAuditLog.entityType
                    }
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Actor
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {getActorName(
                      selectedAuditLog
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Department
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {selectedAuditLog.departmentCode ??
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Entity ID
                  </dt>
                  <dd className="mt-1 break-all text-sm text-white">
                    {selectedAuditLog.entityId ??
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {formatDate(
                      selectedAuditLog.createdAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    IP address
                  </dt>
                  <dd className="mt-1 text-sm text-white">
                    {selectedAuditLog.ipAddress ??
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-white/45">
                    User agent
                  </dt>
                  <dd className="mt-1 break-words text-sm text-white">
                    {selectedAuditLog.userAgent ??
                      "—"}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Previous Values
                </h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/75">
                  {formatJson(
                    selectedAuditLog.previousValues
                  )}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  New Values
                </h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/75">
                  {formatJson(
                    selectedAuditLog.newValues
                  )}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Metadata
                </h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/75">
                  {formatJson(
                    selectedAuditLog.metadata
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}