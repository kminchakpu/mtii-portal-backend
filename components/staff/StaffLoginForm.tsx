"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  loginStaff,
} from "@/lib/staff-ui/staff-auth-client";

export default function StaffLoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

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
      await loginStaff({
        email,
        password,
      });

      setPassword("");

      router.push(
        "/staff/dashboard"
      );

      router.refresh();
    } catch (loginError) {
      if (
        loginError instanceof
        Error
      ) {
        setError(
          loginError.message
        );
      } else {
        setError(
          "Unable to sign in at this time."
        );
      }

      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="staff-email"
          className="block text-sm font-semibold text-slate-800"
        >
          Email Address
        </label>

        <input
          id="staff-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={
            isSubmitting
          }
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="staff@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="staff-password"
          className="block text-sm font-semibold text-slate-800"
        >
          Password
        </label>

        <input
          id="staff-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={
            isSubmitting
          }
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#ffb000] focus:ring-2 focus:ring-[#ffb000]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting
        }
        className="flex w-full items-center justify-center rounded-lg bg-[#071d2b] px-4 py-3 font-semibold text-white transition hover:bg-[#0b2b3f] focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting
          ? "Signing In..."
          : "Sign In"}
      </button>
    </form>
  );
}