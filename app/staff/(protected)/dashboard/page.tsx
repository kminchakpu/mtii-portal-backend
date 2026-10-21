import type {
  Metadata,
} from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Dashboard | MTII Staff Portal",
  description:
    "MTII internal staff portal dashboard.",
};

const administrationAreas = [
  {
    title: "Departments",
    description:
      "View and manage ministry departments and their operational status.",
    href: "/staff/departments",
  },
  {
    title: "Staff Accounts",
    description:
      "Manage authorized staff accounts, access, roles, and departmental assignments.",
    href: "/staff/users",
  },
  {
    title: "Audit Logs",
    description:
      "Review recorded administrative and security activities across the staff system.",
    href: "/staff/audit-logs",
  },
];

export default function StaffDashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b77900]">
          Ministry Operations
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071d2b]">
          Staff Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Access the internal
          administration areas
          available to your staff
          account. The options shown
          in the portal navigation
          depend on your assigned
          permissions.
        </p>
      </section>

      <section
        aria-labelledby="administration-heading"
        className="space-y-4"
      >
        <div>
          <h2
            id="administration-heading"
            className="text-xl font-bold text-[#071d2b]"
          >
            Phase 1 Administration
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Core administrative
            tools currently available
            in the MTII staff portal.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {administrationAreas.map(
            (area) => (
              <article
                key={
                  area.href
                }
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#071d2b] text-sm font-bold text-[#ffb000]">
                  MTII
                </div>

                <h3 className="text-lg font-bold text-[#071d2b]">
                  {area.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {
                    area.description
                  }
                </p>

                <Link
                  href={
                    area.href
                  }
                  className="mt-6 inline-flex items-center font-semibold text-[#8a5c00] transition hover:text-[#071d2b]"
                >
                  Open{" "}
                  {area.title}
                  <span
                    aria-hidden="true"
                    className="ml-2"
                  >
                    →
                  </span>
                </Link>
              </article>
            )
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#ffb000]/30 bg-[#ffb000]/10 p-5">
        <h2 className="font-bold text-[#071d2b]">
          Registration Services
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
          Business Premises, CBO,
          FBO, NGO and Cooperative
          Society application
          workflows will be added as
          the corresponding
          application, payment and
          review modules are
          implemented.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-[#071d2b]">
          Security Notice
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          This is an internal
          ministry system. Access is
          restricted to authorized
          staff, and administrative
          activities may be recorded
          for security,
          accountability, and audit
          purposes.
        </p>
      </section>
    </div>
  );
}