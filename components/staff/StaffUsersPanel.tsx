"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  assignStaffRole,
  getStaffRoles,
  removeStaffRole,
} from "@/lib/staff-ui/staff-roles-client";
import type {
  StaffRole,
} from "@/lib/staff-ui/staff-roles-client";
import {
  createStaffUser,
  getStaffUsers,
  updateStaffUser,
} from "@/lib/staff-ui/staff-users-client";
import type {
  StaffUser,
} from "@/lib/staff-ui/staff-users-client";

type StaffUsersPanelProps = {
  canManage: boolean;
  canViewRoles: boolean;
  canAssignRoles: boolean;
};

type StaffAccountFormProps = {
  mode: "create" | "edit";
  user?: StaffUser;
  onCancel: () => void;
  onSaved: () => Promise<void>;
};

type StaffRoleManagerProps = {
  user: StaffUser;
  roles: StaffRole[];
  canAssignRoles: boolean;
  onCancel: () => void;
  onChanged: () => Promise<void>;
};

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(value)
  );
}

function StaffRoles({
  roles,
}: {
  roles: string[];
}) {
  if (roles.length === 0) {
    return (
      <span className="text-sm text-slate-500">
        No roles assigned
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map(
        (role) => (
          <span
            key={role}
            className="rounded-full bg-[#071d2b]/10 px-2.5 py-1 text-xs font-semibold text-[#071d2b]"
          >
            {role}
          </span>
        )
      )}
    </div>
  );
}

function AccountStatus({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
          : "inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
      }
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function DepartmentDetails({
  user,
}: {
  user: StaffUser;
}) {
  if (!user.department) {
    return (
      <span className="text-sm text-slate-500">
        Unassigned
      </span>
    );
  }

  return (
    <div>
      <p className="font-medium text-slate-900">
        {user.department.name}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {user.department.code}
      </p>
    </div>
  );
}

function StaffAccountForm({
  mode,
  user,
  onCancel,
  onSaved,
}: StaffAccountFormProps) {
  const isCreate =
    mode === "create";

  const [
    firstName,
    setFirstName,
  ] = useState(
    user?.firstName ?? ""
  );

  const [
    lastName,
    setLastName,
  ] = useState(
    user?.lastName ?? ""
  );

  const [
    email,
    setEmail,
  ] = useState(
    user?.email ?? ""
  );

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    departmentPublicId,
    setDepartmentPublicId,
  ] = useState(
    user?.department
      ?.publicId ?? ""
  );

  const [
    isActive,
    setIsActive,
  ] = useState(
    user?.isActive ?? true
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedDepartment =
        departmentPublicId.trim() ||
        null;

      if (isCreate) {
        await createStaffUser({
          firstName,
          lastName,
          email,
          password,
          departmentPublicId:
            normalizedDepartment,
        });
      } else if (user) {
        await updateStaffUser(
          user.publicId,
          {
            firstName,
            lastName,
            email,
            departmentPublicId:
              normalizedDepartment,
            isActive,
          }
        );
      }

      await onSaved();
    } catch (
      submitError
    ) {
      if (
        submitError instanceof
        Error
      ) {
        setError(
          submitError.message
        );
      } else {
        setError(
          isCreate
            ? "Unable to create staff account."
            : "Unable to update staff account."
        );
      }

      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b87d00]">
            Staff Administration
          </p>
          <h3 className="font-play mt-2 text-xl font-bold text-[#071d2b]">
            {isCreate
              ? "Add Staff Account"
              : "Edit Staff Account"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isCreate
              ? "Create a ministry staff account and assign its department."
              : "Update permitted staff account details, department assignment, and account status."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={
            isSubmitting
          }
          className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-5 space-y-5"
      >
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="staff-first-name"
              className="block text-sm font-semibold text-[#071d2b]"
            >
              First Name
            </label>
            <input
              id="staff-first-name"
              type="text"
              value={
                firstName
              }
              onChange={(
                event
              ) =>
                setFirstName(
                  event.target
                    .value
                )
              }
              required
              disabled={
                isSubmitting
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="staff-last-name"
              className="block text-sm font-semibold text-[#071d2b]"
            >
              Last Name
            </label>
            <input
              id="staff-last-name"
              type="text"
              value={
                lastName
              }
              onChange={(
                event
              ) =>
                setLastName(
                  event.target
                    .value
                )
              }
              required
              disabled={
                isSubmitting
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="staff-email"
              className="block text-sm font-semibold text-[#071d2b]"
            >
              Email Address
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              required
              disabled={
                isSubmitting
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:bg-slate-100"
            />
          </div>

          {isCreate ? (
            <div>
              <label
                htmlFor="staff-password"
                className="block text-sm font-semibold text-[#071d2b]"
              >
                Temporary Password
              </label>
              <input
                id="staff-password"
                type="password"
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                required
                disabled={
                  isSubmitting
                }
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:bg-slate-100"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="staff-department-public-id"
              className="block text-sm font-semibold text-[#071d2b]"
            >
              Department Public ID
            </label>
            <input
              id="staff-department-public-id"
              type="text"
              value={
                departmentPublicId
              }
              onChange={(
                event
              ) =>
                setDepartmentPublicId(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:bg-slate-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Leave blank for an unassigned account.
            </p>
          </div>

          {!isCreate ? (
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
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
                  className="h-4 w-4 rounded border-slate-300 text-[#071d2b] focus:ring-[#ffb000]"
                />
                <span className="text-sm font-semibold text-[#071d2b]">
                  Account Active
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              isSubmitting
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="rounded-lg bg-[#071d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2a3d] focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isCreate
                ? "Creating..."
                : "Saving..."
              : isCreate
                ? "Create Staff Account"
                : "Save Staff Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StaffRoleManager({
  user,
  roles,
  canAssignRoles,
  onCancel,
  onChanged,
}: StaffRoleManagerProps) {
  const [
    pendingRolePublicId,
    setPendingRolePublicId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const assignedRoleCodes =
    new Set(user.roles);

  async function handleAssign(
    role: StaffRole
  ) {
    if (
      !canAssignRoles ||
      pendingRolePublicId
    ) {
      return;
    }

    setError(null);
    setPendingRolePublicId(
      role.publicId
    );

    try {
      await assignStaffRole(
        user.publicId,
        role.publicId
      );

      await onChanged();
    } catch (
      assignmentError
    ) {
      if (
        assignmentError instanceof
        Error
      ) {
        setError(
          assignmentError.message
        );
      } else {
        setError(
          "Unable to assign staff role."
        );
      }
    } finally {
      setPendingRolePublicId(
        null
      );
    }
  }

  async function handleRemove(
    role: StaffRole
  ) {
    if (
      !canAssignRoles ||
      pendingRolePublicId
    ) {
      return;
    }

    setError(null);
    setPendingRolePublicId(
      role.publicId
    );

    try {
      await removeStaffRole(
        user.publicId,
        role.publicId
      );

      await onChanged();
    } catch (
      removalError
    ) {
      if (
        removalError instanceof
        Error
      ) {
        setError(
          removalError.message
        );
      } else {
        setError(
          "Unable to remove staff role."
        );
      }
    } finally {
      setPendingRolePublicId(
        null
      );
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b87d00]">
            Role Administration
          </p>

          <h3 className="font-play mt-2 text-xl font-bold text-[#071d2b]">
            Roles for{" "}
            {user.firstName}{" "}
            {user.lastName}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {canAssignRoles
              ? "Review assigned roles and manage permitted role assignments."
              : "Review the roles available to this staff account. Role changes require additional permission."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={
            pendingRolePublicId !==
            null
          }
          className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Close
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {roles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No roles are available.
          </div>
        ) : (
          roles.map(
            (role) => {
              const isAssigned =
                assignedRoleCodes.has(
                  role.code
                );

              const isSuperAdmin =
                role.code ===
                "SUPER_ADMIN";

              const isPending =
                pendingRolePublicId ===
                role.publicId;

              const canMutateRole =
                canAssignRoles &&
                !isSuperAdmin;

              return (
                <div
                  key={
                    role.publicId
                  }
                  className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#071d2b]">
                        {role.name}
                      </p>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {role.code}
                      </span>

                      {isAssigned ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          Assigned
                        </span>
                      ) : null}

                      {!role.isActive ? (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Inactive
                        </span>
                      ) : null}
                    </div>

                    {role.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {role.description}
                      </p>
                    ) : null}

                    {isSuperAdmin ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Super Administrator assignments cannot be changed through this interface.
                      </p>
                    ) : null}
                  </div>

                  {canMutateRole ? (
                    isAssigned ? (
                      <button
                        type="button"
                        aria-label={`Remove ${role.name}`}
                        onClick={() =>
                          void handleRemove(
                            role
                          )
                        }
                        disabled={
                          pendingRolePublicId !==
                          null
                        }
                        className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                      >
                        {isPending
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Assign ${role.name}`}
                        onClick={() =>
                          void handleAssign(
                            role
                          )
                        }
                        disabled={
                          pendingRolePublicId !==
                            null ||
                          !role.isActive
                        }
                        className="self-start rounded-lg bg-[#071d2b] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b2a3d] disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                      >
                        {isPending
                          ? "Assigning..."
                          : "Assign"}
                      </button>
                    )
                  ) : null}
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

function StaffUserCard({
  user,
  canManage,
  canViewRoles,
  onEdit,
  onManageRoles,
}: {
  user: StaffUser;
  canManage: boolean;
  canViewRoles: boolean;
  onEdit: (
    user: StaffUser
  ) => void;
  onManageRoles: (
    user: StaffUser
  ) => void;
}) {
  const hasActions =
    canManage ||
    canViewRoles;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-play text-lg font-bold text-[#071d2b]">
            {user.firstName}{" "}
            {user.lastName}
          </h3>
          <p className="mt-1 break-all text-sm text-slate-600">
            {user.email}
          </p>
        </div>

        <AccountStatus
          isActive={
            user.isActive
          }
        />
      </div>

      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Department
          </dt>
          <dd className="mt-1">
            <DepartmentDetails
              user={user}
            />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Roles
          </dt>
          <dd className="mt-2">
            <StaffRoles
              roles={
                user.roles
              }
            />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Last Login
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            {formatDate(
              user.lastLoginAt
            )}
          </dd>
        </div>
      </dl>

      {hasActions ? (
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4">
          {canManage ? (
            <button
              type="button"
              aria-label={`Edit ${user.firstName} ${user.lastName}`}
              onClick={() =>
                onEdit(user)
              }
              className="w-full rounded-lg border border-[#071d2b]/20 px-3 py-2 text-sm font-semibold text-[#071d2b] transition hover:border-[#ffb000] hover:bg-[#ffb000]/10"
            >
              Edit Account
            </button>
          ) : null}

          {canViewRoles ? (
            <button
              type="button"
              aria-label={`Manage roles for ${user.firstName} ${user.lastName}`}
              onClick={() =>
                onManageRoles(
                  user
                )
              }
              className="w-full rounded-lg border border-[#071d2b]/20 px-3 py-2 text-sm font-semibold text-[#071d2b] transition hover:border-[#ffb000] hover:bg-[#ffb000]/10"
            >
              Manage Roles
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function StaffUsersPanel({
  canManage,
  canViewRoles,
  canAssignRoles,
}: StaffUsersPanelProps) {
  const [
    users,
    setUsers,
  ] = useState<
    StaffUser[]
  >([]);

  const [
    roles,
    setRoles,
  ] = useState<
    StaffRole[]
  >([]);

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
    roleLoadError,
    setRoleLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    formMode,
    setFormMode,
  ] = useState<
    "create" | "edit" | null
  >(null);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<
    StaffUser | undefined
  >(undefined);

  const [
    roleUser,
    setRoleUser,
  ] = useState<
    StaffUser | undefined
  >(undefined);

  const loadUsers =
    useCallback(
      async () => {
        const result =
          await getStaffUsers();

        setUsers(result);

        if (roleUser) {
          const refreshedRoleUser =
            result.find(
              (user) =>
                user.publicId ===
                roleUser.publicId
            );

          if (
            refreshedRoleUser
          ) {
            setRoleUser(
              refreshedRoleUser
            );
          }
        }
      },
      [roleUser]
    );

  useEffect(() => {
    let isMounted =
      true;

    async function loadInitialUsers() {
      try {
        const result =
          await getStaffUsers();

        if (!isMounted) {
          return;
        }

        setUsers(
          result
        );
        setError(null);
      } catch (
        loadError
      ) {
        if (!isMounted) {
          return;
        }

        if (
          loadError instanceof
          Error
        ) {
          setError(
            loadError.message
          );
        } else {
          setError(
            "Unable to load staff users."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(
            false
          );
        }
      }
    }

    void loadInitialUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!canViewRoles) {
      return;
    }

    let isMounted =
      true;

    async function loadRoles() {
      try {
        const result =
          await getStaffRoles();

        if (!isMounted) {
          return;
        }

        setRoles(result);
        setRoleLoadError(
          null
        );
      } catch (
        loadError
      ) {
        if (!isMounted) {
          return;
        }

        if (
          loadError instanceof
          Error
        ) {
          setRoleLoadError(
            loadError.message
          );
        } else {
          setRoleLoadError(
            "Unable to load staff roles."
          );
        }
      }
    }

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, [canViewRoles]);

  function openCreateForm() {
    setRoleUser(
      undefined
    );
    setSelectedUser(
      undefined
    );
    setFormMode(
      "create"
    );
  }

  function openEditForm(
    user: StaffUser
  ) {
    setRoleUser(
      undefined
    );
    setSelectedUser(
      user
    );
    setFormMode(
      "edit"
    );
  }

  function closeForm() {
    setFormMode(null);
    setSelectedUser(
      undefined
    );
  }

  function openRoleManager(
    user: StaffUser
  ) {
    setFormMode(null);
    setSelectedUser(
      undefined
    );
    setRoleUser(
      user
    );
  }

  function closeRoleManager() {
    setRoleUser(
      undefined
    );
  }

  async function handleSaved() {
    await loadUsers();
    closeForm();
  }

  async function handleRoleChanged() {
    const result =
      await getStaffUsers();

    setUsers(result);

    if (roleUser) {
      const refreshedRoleUser =
        result.find(
          (user) =>
            user.publicId ===
            roleUser.publicId
        );

      if (
        refreshedRoleUser
      ) {
        setRoleUser(
          refreshedRoleUser
        );
      }
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Loading staff accounts...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm"
      >
        {error}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b87d00]">
              Staff Administration
            </p>
            <h2 className="font-play mt-2 text-2xl font-bold text-[#071d2b]">
              Staff Accounts
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              View ministry staff accounts, department assignments, account status, roles, and recent login activity.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="self-start rounded-lg bg-[#071d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2a3d] focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2"
            >
              Add Staff Account
            </button>
          ) : null}
        </div>
      </div>

      {roleLoadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm"
        >
          {roleLoadError}
        </div>
      ) : null}

      {canManage &&
      formMode ? (
        <StaffAccountForm
          key={
            formMode ===
              "edit" &&
            selectedUser
              ? `edit-${selectedUser.publicId}`
              : "create"
          }
          mode={formMode}
          user={
            selectedUser
          }
          onCancel={
            closeForm
          }
          onSaved={
            handleSaved
          }
        />
      ) : null}

      {canViewRoles &&
      roleUser ? (
        <StaffRoleManager
          key={
            roleUser.publicId
          }
          user={
            roleUser
          }
          roles={
            roles
          }
          canAssignRoles={
            canAssignRoles
          }
          onCancel={
            closeRoleManager
          }
          onChanged={
            handleRoleChanged
          }
        />
      ) : null}

      {users.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            No staff accounts found.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Staff Member
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Roles
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Last Login
                    </th>

                    {canManage ||
                    canViewRoles ? (
                      <th
                        scope="col"
                        className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map(
                    (user) => (
                      <tr
                        key={
                          user.publicId
                        }
                        className="align-top"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#071d2b]">
                            {
                              user.firstName
                            }{" "}
                            {
                              user.lastName
                            }
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {
                              user.email
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <DepartmentDetails
                            user={
                              user
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StaffRoles
                            roles={
                              user.roles
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <AccountStatus
                            isActive={
                              user.isActive
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {formatDate(
                            user.lastLoginAt
                          )}
                        </td>

                        {canManage ||
                        canViewRoles ? (
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              {canManage ? (
                                <button
                                  type="button"
                                  aria-label={`Edit ${user.firstName} ${user.lastName}`}
                                  onClick={() =>
                                    openEditForm(
                                      user
                                    )
                                  }
                                  className="rounded-lg border border-[#071d2b]/20 px-3 py-2 text-sm font-semibold text-[#071d2b] transition hover:border-[#ffb000] hover:bg-[#ffb000]/10"
                                >
                                  Edit
                                </button>
                              ) : null}

                              {canViewRoles ? (
                                <button
                                  type="button"
                                  aria-label={`Manage roles for ${user.firstName} ${user.lastName}`}
                                  onClick={() =>
                                    openRoleManager(
                                      user
                                    )
                                  }
                                  className="rounded-lg border border-[#071d2b]/20 px-3 py-2 text-sm font-semibold text-[#071d2b] transition hover:border-[#ffb000] hover:bg-[#ffb000]/10"
                                >
                                  Manage Roles
                                </button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {users.map(
              (user) => (
                <StaffUserCard
                  key={
                    user.publicId
                  }
                  user={
                    user
                  }
                  canManage={
                    canManage
                  }
                  canViewRoles={
                    canViewRoles
                  }
                  onEdit={
                    openEditForm
                  }
                  onManageRoles={
                    openRoleManager
                  }
                />
              )
            )}
          </div>
        </>
      )}
    </section>
  );
}