"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";

export default function ForcePasswordPage() {
  const { user, loading, logout, refetch } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ new_password: ["Passwords do not match."] });
      return;
    }

    if (newPassword.length < 8) {
      setFieldErrors({ new_password: ["Password must be at least 8 characters."] });
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/api/password/force-change", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setSuccess(true);
      await refetch();

      // Redirect after a brief delay
      setTimeout(() => {
        if (user) router.push(homeFor(user.role));
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          setFieldErrors(err.errors);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0E0A17]`}>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-blue-50/20 blur-3xl dark:bg-[#0039A6]/15" />
        <div className="absolute right-0 bottom-0 h-[40rem] w-[40rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-700/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Password Change Required
            </span>
          </div>
          <button
            onClick={() => void logout()}
            className={`rounded-full border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition ${focusRing}`}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-purple-950/10 dark:shadow-black/60">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Changed</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your password has been updated. Your next password change will be in 7 days.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Redirecting...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Password Expired
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Your password has expired per the 7-day security rotation policy.
                  Please create a new password to continue.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 p-3 mb-6 text-xs text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> Your new password cannot be the same as any of your last 5 passwords.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Current password */}
                <div>
                  <label htmlFor="current" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="current"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] py-3 px-4 pr-11 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition focus:ring-2 focus:ring-[#0039A6]"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      aria-label={showCurrent ? "Hide" : "Show"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showCurrent ? (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.current_password && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.current_password[0]}</p>
                  )}
                </div>

                {/* New password */}
                <div>
                  <label htmlFor="new" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="new"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] py-3 px-4 pr-11 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition focus:ring-2 focus:ring-[#0039A6]"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      aria-label={showNew ? "Hide" : "Show"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showNew ? (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.new_password && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.new_password[0]}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] py-3 px-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition focus:ring-2 focus:ring-[#0039A6]"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-xl bg-[#0039A6] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-sm hover:bg-[#002B7F] active:bg-[#002B7F] disabled:cursor-not-allowed disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${focusRing}`}
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Change Password & Continue"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-slate-200 dark:border-white/10 py-4 text-center text-xs text-slate-500 dark:text-[#7C6FA3]">
        Talaghayan Portal v2.4 &middot; Department of the Interior and Local Government &middot; Makati City
      </footer>
    </div>
  );
}
