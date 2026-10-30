"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PublicBarangay } from "@/lib/barangays";

export default function BarangayLoginDialog({
  barangay,
  onClose,
}: {
  barangay: PublicBarangay;
  onClose: () => void;
}) {
  const { login } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Native <dialog>: focus trap, Esc to close and focus restore come for free.
  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Laravel checks the account really belongs to this barangay, then login() redirects.
      await login(email.trim(), password, barangay.id);
    } catch (err) {
      const msg = (err as { message?: unknown } | null)?.message;
      setError(typeof msg === "string" && msg ? msg : "We couldn't sign you in. Check your email and password and try again.");
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-line/40 dark:border-white/10 bg-[#F1F1F6] dark:bg-black/30 px-4 py-3 text-slate-900 dark:text-white outline-none ring-1 ring-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-black/50 focus:ring-2 focus:ring-[#0039A6]";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close(); // click on the dimmed backdrop
      }}
      aria-labelledby={`${emailId}-title`}
      className="m-auto w-[min(92vw,26rem)] overflow-hidden rounded-[1.75rem] bg-white dark:bg-[#0F172A] p-0 text-slate-800 dark:text-slate-100 shadow-2xl border border-line/50 dark:border-white/10 backdrop:bg-[#140B33]/50 backdrop:backdrop-blur-sm"
    >
      <div className="bg-[#E6FBF3] dark:bg-emerald-950/40 px-5 sm:px-7 pb-5 sm:pb-6 pt-6 sm:pt-7 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-start justify-between gap-4">
          <span
            className="grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-[#06D6A0] text-lg sm:text-xl font-semibold text-[#04281F]"
            aria-hidden="true"
          >
            {barangay.name.slice(0, 2)}
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 transition hover:bg-white dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <h2 id={`${emailId}-title`} className="mt-4 text-xl sm:text-2xl font-semibold text-[#0E2B24] dark:text-emerald-100">
          Barangay {barangay.name}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#2C5A4D] dark:text-emerald-300/80">
          Sign in with your barangay account to open your reports.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 px-5 sm:px-7 pb-6 sm:pb-7 pt-5 sm:pt-6" noValidate>
        <div>
          <label htmlFor={emailId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email</label>
          <input
            id={emailId}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="name@barangay.test"
          />
        </div>
        <div>
          <label htmlFor={passwordId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">Password</label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute bottom-0 right-0 flex h-[calc(100%-0.375rem)] items-center rounded-r-xl px-3.5 text-slate-400 hover:text-[#0039A6] dark:text-slate-400 dark:hover:text-[#93C5FD] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-[#FFF0F4] dark:bg-rose-950/40 px-4 py-3 text-sm font-medium text-[#B0123F] dark:text-rose-400 border border-transparent dark:border-rose-900/40">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full rounded-full bg-[#0039A6] px-6 py-3 font-semibold text-white transition hover:bg-[#002B7F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          Accounts are issued by the DILG Makati office. Barangay representatives can only open their own barangay.
        </p>
      </form>
    </dialog>
  );
}
