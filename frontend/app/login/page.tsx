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
  "mt-1.5 w-full rounded-xl bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-[#E3DEF5] transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#7B4DFF]";

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
    <div className={`${poppins.className} min-h-screen bg-[#F4EEFE] text-slate-800 sm:p-6 lg:p-8`}>
      <div className="mx-auto grid min-h-screen max-w-360 overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] sm:min-h-[calc(100vh-3rem)] sm:rounded-[2rem] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ---------- Left: brand panel (same look as the home page call-to-action) ---------- */}
        <aside className="relative m-3 hidden flex-col justify-between overflow-hidden rounded-3xl bg-[#7B4DFF] p-10 text-white lg:flex xl:p-12">
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
                  className={`flex items-center gap-4 rounded-2xl bg-white p-4 text-slate-700 shadow-lg shadow-[#3b1a99]/20 ${p.tilt}`}
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
        <section className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
          <Link
            href="/"
            className={`absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-[#F1EBFF] px-4 py-2 text-sm font-semibold text-[#5A18C9] transition-colors hover:bg-[#E3D5FF] sm:left-8 sm:top-8 ${focusRing}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to home
          </Link>

          <div className="mt-10 w-full max-w-sm sm:mt-0">
            {/* Logo on top of the form, with a soft glow behind it */}
            <div className="relative mx-auto flex w-full max-w-[17rem] justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-0 scale-125 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(123,77,255,0.16) 0%, rgba(123,77,255,0) 68%)" }}
              />
              <Image
                src="/talaghayan-logo.png"
                alt="Talaghayan Makati"
                width={684}
                height={463}
                priority
                className="relative h-auto w-full"
              />
            </div>

            <h1 className="mt-6 text-center text-3xl font-semibold text-[#1B1235]">Sign in</h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-600">
              Use the email and password issued by your DILG Makati office.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
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
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
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
                    className={`${inputClass} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    className={`absolute bottom-0 right-0 flex h-[calc(100%-0.375rem)] items-center rounded-r-xl px-4 text-sm font-semibold text-[#5A18C9] hover:text-[#7B4DFF] ${focusRing}`}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div aria-live="polite">
                {error && (
                  <p id="login-error" role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
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