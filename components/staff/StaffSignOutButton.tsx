"use client";

import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  logoutStaff,
} from "@/lib/staff-ui/staff-auth-client";

export default function StaffSignOutButton() {
  const router = useRouter();

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

  async function handleSignOut() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await logoutStaff();

      router.replace(
        "/staff/login"
      );

      router.refresh();
    } catch (logoutError) {
      if (
        logoutError instanceof
        Error
      ) {
        setError(
          logoutError.message
        );
      } else {
        setError(
          "Unable to sign out at this time."
        );
      }

      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="text-xs leading-5 text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={
          handleSignOut
        }
        disabled={
          isSubmitting
        }
        className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-[#ffb000]/50 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ffb000] focus:ring-offset-2 focus:ring-offset-[#071d2b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Signing Out..."
          : "Sign Out"}
      </button>
    </div>
  );
}