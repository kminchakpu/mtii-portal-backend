import type {
  ReactNode,
} from "react";
import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import StaffSignOutButton from "@/components/staff/StaffSignOutButton";
import {
  UnauthenticatedError,
} from "@/lib/rbac/errors";
import {
  requireCurrentStaff,
} from "@/lib/staff-ui/staff-access";
import {
  getStaffNavigation,
} from "@/lib/staff-ui/navigation";
import {
  createStaffServerRequest,
} from "@/lib/staff-ui/staff-server-request";

type StaffProtectedLayoutProps = {
  children: ReactNode;
};

export default async function StaffProtectedLayout({
  children,
}: StaffProtectedLayoutProps) {
  const request =
    await createStaffServerRequest(
      "/staff"
    );

  let staff;

  try {
    staff =
      await requireCurrentStaff(
        request
      );
  } catch (error) {
    if (
      error instanceof
      UnauthenticatedError
    ) {
      redirect("/staff/login");
    }

    throw error;
  }

  const navigation =
    getStaffNavigation(
      staff.permissions
    );

  const fullName =
    `${staff.firstName} ${staff.lastName}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col bg-[#071d2b] text-white lg:flex">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/staff/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ffb000] text-sm font-bold text-[#071d2b]">
                MTII
              </div>

              <div>
                <p className="font-bold leading-tight">
                  Staff Portal
                </p>

                <p className="mt-1 text-xs text-white/60">
                  Nasarawa State
                </p>
              </div>
            </Link>
          </div>

          <div className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb000]">
              Ministry Portal
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Trade, Industry and
              Investment
            </p>
          </div>

          <nav
            aria-label="Staff navigation"
            className="flex-1 px-4"
          >
            <ul className="space-y-1">
              {navigation.map(
                (item) => (
                  <li
                    key={
                      item.href
                    }
                  >
                    <Link
                      href={
                        item.href
                      }
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      {
                        item.label
                      }
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-xl bg-white/[0.05] p-4">
              <p className="truncate text-sm font-semibold text-white">
                {fullName}
              </p>

              <p className="mt-1 truncate text-xs text-white/60">
                {staff.email}
              </p>

              {staff.departmentCode ? (
                <div className="mt-3">
                  <span className="inline-flex rounded-full border border-[#ffb000]/30 bg-[#ffb000]/10 px-2.5 py-1 text-xs font-semibold text-[#ffb000]">
                    {
                      staff.departmentCode
                    }
                  </span>
                </div>
              ) : null}

              <div className="mt-4">
                <StaffSignOutButton />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/staff/dashboard"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#071d2b] text-xs font-bold text-[#ffb000] lg:hidden"
                >
                  MTII
                </Link>

                <div>
                  <p className="text-sm font-semibold text-[#071d2b]">
                    MTII Staff Portal
                  </p>

                  <p className="hidden text-xs text-slate-500 sm:block">
                    Ministry of Trade,
                    Industry and
                    Investment
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {fullName}
                  </p>

                  <p className="text-xs text-slate-500">
                    {staff.departmentCode ??
                      "Administration"}
                  </p>
                </div>

                <div className="hidden sm:block lg:hidden">
                  <StaffSignOutButton />
                </div>
              </div>
            </div>

            <nav
              aria-label="Mobile staff navigation"
              className="overflow-x-auto border-t border-slate-100 px-4 lg:hidden"
            >
              <ul className="flex min-w-max gap-1 py-2">
                {navigation.map(
                  (item) => (
                    <li
                      key={
                        item.href
                      }
                    >
                      <Link
                        href={
                          item.href
                        }
                        className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#071d2b]"
                      >
                        {
                          item.label
                        }
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </nav>

            <div className="border-t border-slate-100 px-4 py-3 sm:hidden">
              <StaffSignOutButton />
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Ministry of Trade,
                Industry and
                Investment
              </p>

              <p>
                Internal Staff System
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}