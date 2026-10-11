"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import type { SubmissionStatus } from "@/types";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const POINTS: { status: SubmissionStatus; text: string; tilt: string }[] = [
  { status: "compliant", text: "Barangays see their own reports and due dates.", tilt: "-rotate-1" },
  { status: "under_review", text: "The office reviews and marks each submission.", tilt: "rotate-1" },
  { status: "submitted", text: "The Talaghayan updates as soon as a status changes.", tilt: "-rotate-1" },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

const inputClass =
  "mt-1.5 w-full rounded-xl bg-white dark:bg-[#2B2542] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-out outline-none ring-1 ring-[#E3DEF5] dark:ring-[#433A66] transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF] dark:focus:ring-[#6A3CF0]";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      // AuthProvider redirects to the right dashboard; keep the button disabled meanwhile.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={`${poppins.className} min-h-screen text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out p-3 sm:p-6 lg:p-8`}>
      <div className="relative mx-auto grid min-h-screen max-w-360 overflow-hidden bg-white/40 dark:bg-[#1B142F]/40 backdrop-blur-3xl transition-colors duration-500 ease-out shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] border border-white/40 dark:border-white/10 sm:min-h-[calc(100vh-3rem)] rounded-2xl sm:rounded-[2rem] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">

        {/* ---------- Left: brand panel (same look as the home page call-to-action) ---------- */}
        <aside className="relative m-3 hidden flex-col justify-between overflow-hidden rounded-3xl bg-[#7B4DFF]/80 dark:bg-[#352D52]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none p-10 text-white lg:flex xl:p-12 transition-all duration-500 ease-out">
          <div aria-hidden="true" className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div aria-hidden="true" className="absolute -bottom-12 right-24 h-28 w-28 rounded-full bg-[#06D6A0]/40" />

          <p className="relative inline-block self-start rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            Talaghayan &middot; Barangay Report Tracker
          </p>

          <div className="relative">
            <h2 className="max-w-[14ch] text-balance text-4xl font-semibold leading-tight xl:text-5xl">
              Reports filed. Compliance tracked.
            </h2>
            <ul className="mt-8 space-y-3">
              {POINTS.map((p) => (
                <li
                  key={p.status}
                  className={`flex items-center gap-4 rounded-2xl bg-white/70 dark:bg-[#2B2542]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md border border-white/40 dark:border-white/10 p-4 text-slate-700 dark:text-slate-200 shadow-lg shadow-[#3b1a99]/20 dark:shadow-none transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl ${p.tilt}`}
                >
                  <span className="shrink-0">
                    <StatusBadge status={p.status} />
                  </span>
                  <span className="text-sm leading-6">{p.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-sm text-[#E9DFFF]">Accounts are issued by the DILG Makati office.</p>
        </aside>

        {/* ---------- Right: logo + form ---------- */}
        <section className="relative flex flex-col items-center justify-center px-4 py-8 sm:px-10">
          <Link
            href="/"
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#F1EBFF] px-3.5 py-1.5 text-xs font-semibold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out hover:bg-[#E3D5FF] dark:hover:bg-[#2B2542] sm:left-8 sm:top-8 sm:px-4 sm:py-2 sm:text-sm ${focusRing}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to home
          </Link>

          <div className="mt-10 w-full max-w-sm sm:mt-0">
            {/* Logo on top of the form, with a soft glow behind it */}
            <div className="relative mx-auto flex w-full max-w-[12rem] sm:max-w-[17rem] justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-0 scale-125 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(123,77,255,0.16) 0%, rgba(123,77,255,0) 68%)" }}
              />
              <div className="relative rounded-full dark:bg-white dark:p-3 transition-all duration-500 ease-out">
                <Image
                  src="/talaghayan-mark.png"
                  alt="Talaghayan Makati"
                  width={684}
                  height={684}
                  priority
                  className="relative h-auto w-full"
                />
              </div>
            </div>

            <h1 className="mt-6 text-center text-2xl sm:text-3xl font-semibold text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">Sign in</h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">
              Use the email and password issued by your DILG Makati office.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 transition-colors duration-500 ease-out">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="you@dilg.gov.ph"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 transition-colors duration-500 ease-out">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "login-error" : undefined}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className={`absolute bottom-0 right-0 flex h-[calc(100%-0.375rem)] items-center rounded-r-xl px-3.5 text-slate-400 hover:text-[#7B4DFF] dark:text-slate-400 dark:hover:text-[#CDBBFF] transition-colors ${focusRing}`}
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

              <div aria-live="polite">
                {error && (
                  <p id="login-error" role="alert" className="rounded-2xl bg-bad-bg dark:bg-rose-950/40 px-4 py-3 text-sm font-medium text-bad dark:text-rose-400 border border-transparent dark:border-rose-900/50">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className={`w-full rounded-full bg-[#7B4DFF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
