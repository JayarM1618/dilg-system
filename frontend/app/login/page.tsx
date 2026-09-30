"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { StatusMark } from "@/components/StatusMark";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { homeFor } from "@/lib/format";

// Demo logins created by `php artisan migrate:fresh --seed` (local only).
const DEMO_ACCOUNTS = [
  { label: "Super admin", email: "admin@dilg.test" },
  { label: "Office supervisor", email: "supervisor@dilg.test" },
  { label: "Barangay representative", email: "barangay@dilg.test" },
];
const DEMO_PASSWORD = "password";

const SHOW_DEMO =
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS
    ? process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true"
    : process.env.NODE_ENV !== "production";

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
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ---------- Left: brand panel ---------- */}
      <aside className="hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex xl:p-14">
        <BrandMark />

        <div>
          <p className="max-w-[14ch] font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Reports filed. Compliance tracked.
          </p>
          <ul className="mt-8 space-y-3 text-navy-100">
            <li className="flex items-center gap-3">
              <StatusMark status="compliant" size={20} /> Barangays see their own reports and due dates
            </li>
            <li className="flex items-center gap-3">
              <StatusMark status="under_review" size={20} /> The office reviews and marks each submission
            </li>
            <li className="flex items-center gap-3">
              <StatusMark status="submitted" size={20} /> The Talaghayan updates as soon as status changes
            </li>
          </ul>
        </div>

        <p className="text-sm text-navy-100/70">Accounts are issued by the DILG Makati office.</p>
      </aside>

      {/* ---------- Right: form ---------- */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <BrandMark tone="dark" />
          </div>
          <Link href="/" className="text-sm font-medium text-navy-700 underline-offset-4 hover:underline">
            Back to home page
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold text-navy-900">Sign in</h1>
          <p className="mt-2 text-muted">Use the email and password issued by your DILG Makati office.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
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
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/25"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative mt-1.5">
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
                  className="w-full rounded-md border border-line bg-white py-2.5 pl-3.5 pr-16 text-base outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 px-3.5 text-sm font-medium text-navy-700 hover:text-navy-900"
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
                  className="rounded-md bg-bad-bg px-3.5 py-2.5 text-sm font-medium text-bad"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-md bg-navy-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {SHOW_DEMO && (
            <div className="mt-10 rounded-md border border-dashed border-line bg-paper p-4">
              <p className="text-sm font-semibold">Demo accounts (development only)</p>
              <p className="mt-1 text-xs text-muted">
                Created by the database seeder. Password for all: <code className="font-semibold">{DEMO_PASSWORD}</code>
              </p>
              <ul className="mt-3 space-y-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.email}>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(a.email);
                        setPassword(DEMO_PASSWORD);
                        setError(null);
                      }}
                      className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-white"
                    >
                      <span className="font-medium">{a.label}</span>
                      <span className="text-xs text-muted">{a.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
