"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import type { SubmissionStatus } from "@/types";

const POINTS: { status: SubmissionStatus; text: string; tilt: string }[] = [
  { status: "compliant", text: "Barangays see their own reports and due dates.", tilt: "-rotate-1" },
  { status: "under_review", text: "The office reviews and marks each submission.", tilt: "rotate-1" },
  { status: "submitted", text: "The Talaghayan updates as soon as a status changes.", tilt: "-rotate-1" },
];

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-indigo-100 bg-[#f4f3ff]/60 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/25";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const wrap = "w-full px-3 sm:px-6 lg:px-10 xl:px-16";

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
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f3ff] text-slate-800">
      {/* ---------- Floating nav ---------- */}
      <header className={`${wrap} pt-3 sm:pt-4`}>
        <div className="flex items-center justify-between gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-indigo-100 sm:px-5">
          <div className="min-w-0">
            <BrandMark tone="dark" />
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className={`${wrap} mt-3 flex-1 pb-6 sm:mt-4 sm:pb-8`}>
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
          {/* ---------- Left: brand panel ---------- */}
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-500 p-10 text-white lg:flex xl:p-14">
            <div aria-hidden="true" className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
            <div aria-hidden="true" className="absolute -bottom-16 right-24 h-36 w-36 rounded-full bg-teal-300/30" />

            <p className="relative inline-block self-start rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
              DILG Makati &middot; Barangay Report Tracker
            </p>

            <div className="relative">
              <h2 className="max-w-[14ch] text-balance text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
                Reports filed. Compliance tracked.
              </h2>
              <ul className="mt-8 space-y-3">
                {POINTS.map((p) => (
                  <li
                    key={p.status}
                    className={`flex items-center gap-4 rounded-2xl bg-white p-4 text-slate-700 shadow-lg shadow-indigo-900/10 ${p.tilt}`}
                  >
                    <span className="shrink-0">
                      <StatusBadge status={p.status} />
                    </span>
                    <span className="text-sm leading-6">{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative text-sm text-indigo-100/80">Accounts are issued by the DILG Makati office.</p>
          </aside>

          {/* ---------- Right: form ---------- */}
          <section className="flex items-center justify-center rounded-[1.5rem] bg-white px-5 py-10 shadow-sm ring-1 ring-indigo-100 sm:rounded-[2rem] sm:px-10 lg:py-16">
            <div className="w-full max-w-sm">
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Sign in</h1>
              <p className="mt-2 text-slate-600">
                Use the email and password issued by your DILG Makati office.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-900">
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
                  <label htmlFor="password" className="block text-sm font-bold text-slate-900">
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
                      className="absolute bottom-0 right-0 flex h-[calc(100%-0.375rem)] items-center px-4 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div aria-live="polite">
                  {error && (
                    <p
                      id="login-error"
                      role="alert"
                      className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}