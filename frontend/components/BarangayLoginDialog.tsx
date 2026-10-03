"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roles";
import { normalizeName, type MakatiBarangay } from "@/lib/makatiBarangays";
export default function BarangayLoginDialog({
  barangay,
  onClose,
}: {
  barangay: MakatiBarangay;
  onClose: () => void;
}) {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Native <dialog>: focus trap, Esc to close and focus restore come for free.
  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Runs once the sign-in has completed and `user` is available.
  useEffect(() => {
    if (!submitted || !user) return;

    if (user.role === "barangay_rep" && normalizeName(user.barangay?.name) !== normalizeName(barangay.name)) {
      setSubmitted(false);
      setBusy(false);
      setError(
        `That account belongs to Barangay ${user.barangay?.name ?? "another barangay"}, not ${barangay.name}. ` +
          "Close this window and pick your own barangay.",
      );
      void logout();
      return;
    }

    router.replace(homeFor(user.role));
  }, [submitted, user, barangay.name, logout, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      setSubmitted(true);
    } catch (err) {
      const msg = (err as { message?: unknown } | null)?.message;
      setError(typeof msg === "string" && msg ? msg : "We couldn't sign you in. Check your email and password and try again.");
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-xl border-0 bg-[#F1F1F6] px-4 py-3 text-slate-900 outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#7B4DFF]";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close(); // click on the dimmed backdrop
      }}
      aria-labelledby={`${emailId}-title`}
      className="m-auto w-[min(92vw,26rem)] overflow-hidden rounded-[1.75rem] bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-[#140B33]/50 backdrop:backdrop-blur-sm"
    >
      <div className="bg-[#E6FBF3] px-7 pb-6 pt-7">
        <div className="flex items-start justify-between gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#06D6A0] text-xl font-semibold text-[#04281F]"
            aria-hidden="true"
          >
            {barangay.name.slice(0, 2)}
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-slate-600 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <h2 id={`${emailId}-title`} className="mt-4 text-2xl font-semibold text-[#0E2B24]">
          Barangay {barangay.name}
        </h2>
        <p className="mt-1 text-sm text-[#2C5A4D]">
          Sign in with your barangay account to open your reports.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 px-7 pb-7 pt-6" noValidate>
        <div>
          <label htmlFor={emailId} className="text-sm font-semibold text-slate-800">Email</label>
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
          <label htmlFor={passwordId} className="text-sm font-semibold text-slate-800">Password</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-[#FFF0F4] px-4 py-3 text-sm font-medium text-[#B0123F]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full rounded-full bg-[#7B4DFF] px-6 py-3 font-semibold text-white transition hover:bg-[#6A3CF0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-xs leading-5 text-slate-500">
          Accounts are issued by the DILG Makati office. Barangay representatives can only open their own barangay.
        </p>
      </form>
    </dialog>
  );
}