"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { apiUrl } from "@/lib/http";
import { homeFor } from "@/lib/roles";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

const SYSTEM_MODULES = [
  {
    title: "Mandatory Report Monitoring",
    description: "Period-based compliance tracking across quarterly, semestral, and annual DILG submission cycles.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "DILG Review & Validation",
    description: "Direct administrative evaluation with immediate status verification, feedback, and corrective remarks.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Real-time Citywide Analytics",
    description: "Instant data aggregation and compliance rate tallying for all 24 Makati barangays without spreadsheets.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // "Continue with Google" is shown only when the Laravel server has it set up.
  const [googleReady, setGoogleReady] = useState(false);
  useEffect(() => {
    api.get<{ google: boolean }>("/api/auth/providers").then((r) => setGoogleReady(!!r.google)).catch(() => undefined);
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("error");
    if (msg) setError(msg);
    const prefillEmail = params.get("email");
    if (prefillEmail) setEmail(prefillEmail);
  }, []);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid credentials. Please verify and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      {/* Static Atmospheric Glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/40 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Full-width System Navigation Header */}
      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] hover:bg-[#E3D5FF] dark:bg-[#2C2344] dark:text-[#CDBBFF] ${focusRing}`} aria-label="Go back to home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
              System Authentication
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/citizens"
              className={`rounded-full bg-white dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] ring-1 ring-[#D7CEF2] dark:ring-white/15 hover:bg-slate-50 dark:hover:bg-white/15 ${focusRing}`}
            >
              Citizens View &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication System Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: System Briefing & Modules (System aesthetic) */}
          <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0D2D23] px-3.5 py-1 text-xs font-bold text-[#0E5440] dark:text-[#84DEBD] ring-1 ring-[#06D6A0]/40">
                <span className="h-2 w-2 rounded-full bg-[#06D6A0]" />
                Republic of the Philippines &bull; DILG Makati City
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Talaghayan Report Tracking &amp; Compliance System
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                The centralized digital infrastructure for official report submissions, compliance verification,
                and governance performance monitoring across all 24 barangays in the City of Makati.
              </p>
            </div>

            {/* System Modules (Clean, structured, NO TILT / NO HOVER SCALE) */}
            <div className="space-y-3 pt-2">
              {SYSTEM_MODULES.map((mod) => (
                <div
                  key={mod.title}
                  className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-[#181226]/80 border border-slate-200/80 dark:border-white/10 p-4 shadow-sm"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F1EBFF] text-[#7B4DFF] dark:bg-[#2C2145] dark:text-[#CDBBFF]">
                    {mod.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Security Advisory */}
            <div className="rounded-2xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <p className="leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Restricted Access:</strong> This portal is for accredited Makati Barangay representatives and DILG operations officers only.
              </p>
            </div>
          </section>

          {/* Right Column: Modern System Login Card */}
          <section className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-purple-950/10 dark:shadow-black/60">
              {/* Header */}
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-white/10">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-slate-200 dark:ring-white/10 shadow-sm">
                  <Image
                    src="/talaghayan-mark.png"
                    alt="Talaghayan Seal"
                    width={96}
                    height={96}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Sign In</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Portal Security &amp; Access Control</p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Official Email Address
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rep.bangkal@makati.gov.ph"
                      className={`w-full rounded-xl bg-slate-50 dark:bg-[#201833] py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF]`}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full rounded-xl bg-slate-50 dark:bg-[#201833] py-3 pl-10 pr-11 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message */}
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className={`mt-2 w-full rounded-xl bg-[#7B4DFF] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] active:bg-[#5A18C9] disabled:cursor-not-allowed disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${focusRing}`}
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Authenticating credentials...
                    </>
                  ) : (
                    <>
                      Authorize &amp; Sign In &rarr;
                    </>
                  )}
                </button>
              </form>

              {/* Google SSO if enabled */}
              {googleReady && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10">
                  <a
                    href={apiUrl("/auth/google/redirect")}
                    className={`flex w-full items-center justify-center gap-2.5 rounded-xl bg-slate-50 dark:bg-[#201833] py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-white/10 hover:bg-slate-100 dark:hover:bg-[#2A2042] transition-colors ${focusRing}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                    </svg>
                    Continue with Google Workspace
                  </a>
                </div>
              )}

              {/* Support footnote */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 text-center text-[11px] text-slate-500 dark:text-slate-400">
                Accounts are managed by the DILG Makati ICT Division.
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* System Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200 dark:border-white/10 py-4 text-center text-xs text-slate-500 dark:text-[#7C6FA3]">
        Talaghayan Portal v2.4 &middot; Department of the Interior and Local Government &middot; Makati City
      </footer>
    </div>
  );
}
