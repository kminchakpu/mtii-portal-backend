import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  ApplicantUnauthenticatedError,
  requireCurrentApplicant,
} from "@/lib/applicant-ui/applicant-access";

import {
  createApplicantServerRequest,
} from "@/lib/applicant-ui/applicant-server-request";

type ApplicantProtectedLayoutProps = {
  children: ReactNode;
};

export const instant = false;

export default async function ApplicantProtectedLayout({
  children,
}: ApplicantProtectedLayoutProps) {
  const request =
    await createApplicantServerRequest(
      "/applicant"
    );

  let applicant;

  try {
    applicant =
      await requireCurrentApplicant(
        request
      );
  } catch (error) {
    if (
      error instanceof
      ApplicantUnauthenticatedError
    ) {
      redirect(
        "/applicant/login"
      );
    }

    throw error;
  }

  const fullName =
    `${applicant.firstName} ${applicant.lastName}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col bg-[#071d2b] text-white lg:flex">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/applicant/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ffb000] text-sm font-bold text-[#071d2b]">
                MTII
              </div>

              <div>
                <p className="font-bold leading-tight">
                  Applicant Portal
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
            aria-label="Applicant navigation"
            className="flex-1 px-4"
          >
            <ul className="space-y-1">
              <li>
                <Link
                  href="/applicant/dashboard"
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">
                {fullName}
              </p>

              <p className="mt-1 break-all text-xs leading-5 text-white/60">
                {applicant.email}
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white lg:hidden">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/applicant/dashboard"
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ffb000] text-xs font-bold text-[#071d2b]">
                    MTII
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#071d2b]">
                      Applicant Portal
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      Nasarawa State
                    </p>
                  </div>
                </Link>

                <Link
                  href="/applicant/dashboard"
                  className="rounded-lg bg-[#071d2b] px-3 py-2 text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {fullName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {applicant.email}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Ministry of Trade,
                Industry and
                Investment
              </p>

              <p>
                Applicant Portal
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}