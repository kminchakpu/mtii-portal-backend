"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  createStaffDepartment,
  getStaffDepartments,
  updateStaffDepartment,
} from "@/lib/staff-ui/staff-departments-client";
import type {
  StaffDepartment,
} from "@/lib/staff-ui/staff-departments-client";

type StaffDepartmentsPanelProps = {
  canManage: boolean;
};

type DepartmentFormMode =
  | "create"
  | "edit";

type DepartmentFormState = {
  mode: DepartmentFormMode;
  department: StaffDepartment | null;
};

export default function StaffDepartmentsPanel({
  canManage,
}: StaffDepartmentsPanelProps) {
  const [
    departments,
    setDepartments,
  ] = useState<
    StaffDepartment[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<string | null>(
    null
  );

  const [
    formState,
    setFormState,
  ] = useState<DepartmentFormState | null>(
    null
  );

  const loadDepartments =
    useCallback(async () => {
      const result =
        await getStaffDepartments();

      setDepartments(
        result
      );
    }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result =
          await getStaffDepartments();

        if (!isMounted) {
          return;
        }

        setDepartments(
          result
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          getErrorMessage(
            error,
            "Unable to load departments."
          )
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateForm() {
    setFormState({
      mode: "create",
      department: null,
    });
  }

  function openEditForm(
    department: StaffDepartment
  ) {
    setFormState({
      mode: "edit",
      department,
    });
  }

  function closeForm() {
    setFormState(null);
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Loading departments...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-5"
      >
        <p className="font-semibold text-red-800">
          Unable to load
          departments
        </p>

        <p className="mt-1 text-sm text-red-700">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {formState &&
      canManage ? (
        <DepartmentForm
          mode={
            formState.mode
          }
          department={
            formState.department
          }
          onCancel={
            closeForm
          }
          onSaved={
            async () => {
              await loadDepartments();
              closeForm();
            }
          }
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#071d2b]">
                Ministry Departments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  departments.length
                }{" "}
                {departments.length ===
                1
                  ? "department"
                  : "departments"}
              </p>
            </div>

            {canManage ? (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="inline-flex items-center justify-center rounded-lg bg-[#071d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2b40] focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2"
              >
                Add Department
              </button>
            ) : null}
          </div>
        </div>

        {departments.length ===
        0 ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-[#071d2b]">
              No departments found.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              There are currently
              no departments
              available to display.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Code
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    {canManage ? (
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {departments.map(
                    (
                      department
                    ) => (
                      <tr
                        key={
                          department.publicId
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <DepartmentCode
                            code={
                              department.code
                            }
                          />
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {
                              department.name
                            }
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <DepartmentStatus
                            isActive={
                              department.isActive
                            }
                          />
                        </td>

                        {canManage ? (
                          <td className="px-6 py-4 text-right">
                            <EditDepartmentButton
                              department={
                                department
                              }
                              onEdit={
                                openEditForm
                              }
                            />
                          </td>
                        ) : null}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {departments.map(
                (
                  department
                ) => (
                  <article
                    key={
                      department.publicId
                    }
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <DepartmentCode
                          code={
                            department.code
                          }
                        />

                        <h3 className="mt-3 font-semibold text-slate-800">
                          {
                            department.name
                          }
                        </h3>
                      </div>

                      <DepartmentStatus
                        isActive={
                          department.isActive
                        }
                      />
                    </div>

                    {canManage ? (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <EditDepartmentButton
                          department={
                            department
                          }
                          onEdit={
                            openEditForm
                          }
                        />
                      </div>
                    ) : null}
                  </article>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type DepartmentFormProps = {
  mode: DepartmentFormMode;
  department: StaffDepartment | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
};

function DepartmentForm({
  mode,
  department,
  onCancel,
  onSaved,
}: DepartmentFormProps) {
  const isEditing =
    mode === "edit";

  const [
    code,
    setCode,
  ] = useState(
    department?.code ?? ""
  );

  const [
    name,
    setName,
  ] = useState(
    department?.name ?? ""
  );

  const [
    isActive,
    setIsActive,
  ] = useState(
    department?.isActive ??
      true
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (
        isEditing &&
        department
      ) {
        await updateStaffDepartment(
          department.publicId,
          {
            name,
            isActive,
          }
        );
      } else {
        await createStaffDepartment({
          code,
          name,
        });
      }

      await onSaved();
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          isEditing
            ? "Unable to update department."
            : "Unable to create department."
        )
      );

      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#ffb000]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b77900]">
            Department
            Administration
          </p>

          <h2 className="mt-1 text-xl font-bold text-[#071d2b]">
            {isEditing
              ? "Edit Department"
              : "Create Department"}
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onCancel
          }
          disabled={
            isSubmitting
          }
          className="self-start text-sm font-semibold text-slate-500 transition hover:text-[#071d2b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-6 grid gap-5 md:grid-cols-2"
      >
        <div>
          <label
            htmlFor="department-code"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Department Code
          </label>

          <input
            id="department-code"
            type="text"
            value={code}
            onChange={(
              event
            ) =>
              setCode(
                event.target
                  .value
              )
            }
            disabled={
              isEditing ||
              isSubmitting
            }
            required
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />

          {isEditing ? (
            <p className="mt-2 text-xs text-slate-500">
              Department codes
              cannot be changed
              after creation.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="department-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Department Name
          </label>

          <input
            id="department-name"
            type="text"
            value={name}
            onChange={(
              event
            ) =>
              setName(
                event.target
                  .value
              )
            }
            disabled={
              isSubmitting
            }
            required
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        {isEditing ? (
          <div className="md:col-span-2">
            <label className="inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                aria-label="Department Active"
                checked={
                  isActive
                }
                onChange={(
                  event
                ) =>
                  setIsActive(
                    event.target
                      .checked
                  )
                }
                disabled={
                  isSubmitting
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm font-semibold text-slate-700">
                Department Active
              </span>
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Inactive departments
              remain in the system
              but are unavailable
              for active
              departmental use.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="inline-flex items-center justify-center rounded-lg bg-[#071d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2b40] focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Department"}
          </button>

          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              isSubmitting
            }
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

type DepartmentCodeProps = {
  code: string;
};

function DepartmentCode({
  code,
}: DepartmentCodeProps) {
  return (
    <span className="inline-flex rounded-md bg-[#071d2b]/5 px-2.5 py-1 text-xs font-bold text-[#071d2b]">
      {code}
    </span>
  );
}

type DepartmentStatusProps = {
  isActive: boolean;
};

function DepartmentStatus({
  isActive,
}: DepartmentStatusProps) {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
      }
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

type EditDepartmentButtonProps = {
  department: StaffDepartment;
  onEdit: (
    department: StaffDepartment
  ) => void;
};

function EditDepartmentButton({
  department,
  onEdit,
}: EditDepartmentButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Edit ${department.name}`}
      onClick={() =>
        onEdit(
          department
        )
      }
      className="text-sm font-semibold text-[#8a5c00] transition hover:text-[#071d2b] focus:outline-none focus:underline"
    >
      Edit
    </button>
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}