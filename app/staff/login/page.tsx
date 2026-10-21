import type {
  Metadata,
} from "next";
import StaffLoginForm from "@/components/staff/StaffLoginForm";

export const metadata: Metadata = {
  title:
    "Staff Sign In | MTII Portal",
  description:
    "Sign in to the MTII internal staff portal.",
};

export default function StaffLoginPage() {
  return (
    <main className="min-h-screen bg-[#071d2b]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl lg:grid-cols-2">
          <section className="relative hidden bg-[#071d2b] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 bg-[#ffb000]"
            />

            <div>
              <div className="mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb000] font-bold text-[#071d2b]">
                  MTII
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffb000]">
                    Nasarawa State
                  </p>

                  <p className="mt-1 text-sm text-white/75">
                    Government of Nigeria
                  </p>
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb000]">
                Internal System
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                MTII Staff Portal
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-white/75">
                Ministry of Trade,
                Industry and
                Investment
              </p>

              <p className="mt-6 max-w-md text-sm leading-6 text-white/65">
                Secure access for
                authorized ministry
                personnel to manage
                departmental
                operations,
                applications,
                administration, and
                audit activities.
              </p>
            </div>

            <div className="mt-12 border-t border-white/10 pt-6">
              <p className="text-xs leading-5 text-white/60">
                Access to this system
                is restricted to
                authorized MTII staff.
                Activities may be
                recorded for security
                and accountability.
              </p>
            </div>
          </section>

          <section className="relative flex items-center bg-white px-6 py-10 sm:px-10 lg:px-12">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 bg-[#ffb000] lg:hidden"
            />

            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#071d2b] text-sm font-bold text-[#ffb000]">
                    MTII
                  </div>

                  <div>
                    <p className="font-bold text-[#071d2b]">
                      MTII Staff Portal
                    </p>

                    <p className="text-xs text-slate-500">
                      Nasarawa State
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b77900]">
                  Authorized Staff
                  Access
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#071d2b]">
                  Sign in to your
                  account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Enter your official
                  staff credentials to
                  continue to the MTII
                  internal portal.
                </p>
              </div>

              <StaffLoginForm />

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-center text-xs leading-5 text-slate-500">
                  Ministry of Trade,
                  Industry and
                  Investment,
                  Nasarawa State
                </p>

                <p className="mt-1 text-center text-xs text-slate-400">
                  Internal staff
                  system
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}