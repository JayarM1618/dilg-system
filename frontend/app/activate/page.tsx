"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { api, ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

const ACTIVATION_BENEFITS = [
  {
    title: "Official Government Credential",
    description: "Your authorized account grants direct access to the DILG Makati reporting infrastructure and compliance repository.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Encrypted Security Credentials",
    description: "Choose a strong password to safeguard official submissions, administrative reviews, and institutional documents.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Direct Field Office Connection",
    description: "Instantly link your barangay or office terminal to real-time compliance tracking, directives, and announcement boards.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

interface Invite {
  name: string;
  email: string;
  role: string;
  barangay: string | null;
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateForm />
    </Suspense>
  );
}

function ActivateForm() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("This page needs the activation link the DILG Makati office sent to your email.");
      return;
    }
    api
      .get<Invite>(`/api/activate/${encodeURIComponent(token)}`)
      .then((res) => {
        setInvite(res);
        setState("ready");
      })
      .catch((err: unknown) => {
        setState("invalid");
        setMessage(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
      });
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await apiSend("/api/activate", "POST", { token, password, password_confirmation: confirm });
      setState("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please verify and try again.");
    } finally {
      setSaving(false);
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
              Account Provisioning &bull; Activation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`rounded-full bg-white dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] ring-1 ring-[#D7CEF2] dark:ring-white/15 hover:bg-slate-50 dark:hover:bg-white/15 ${focusRing}`}
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: System Briefing & Steps */}
          <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0D2D23] px-3.5 py-1 text-xs font-bold text-[#0E5440] dark:text-[#84DEBD] ring-1 ring-[#06D6A0]/40">
                <span className="h-2 w-2 rounded-full bg-[#06D6A0]" />
                Republic of the Philippines &bull; DILG Makati City
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Welcome to Talaghayan Official Portal
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                The DILG Makati field office has initialized your official user credentials. Set your secure password to complete your account setup and access the reporting system.
              </p>
            </div>

            {/* Benefit / Information Cards */}
            <div className="space-y-3 pt-2">
              {ACTIVATION_BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-[#181226]/80 border border-slate-200/80 dark:border-white/10 p-4 shadow-sm"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F1EBFF] text-[#7B4DFF] dark:bg-[#2C2145] dark:text-[#CDBBFF]">
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Security Advisory */}
            <div className="rounded-2xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <p className="leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Verified Provisioning:</strong> Accounts are strictly provisioned by DILG Makati administrators. Keep your password confidential.
              </p>
            </div>
          </section>

          {/* Right Column: Modern System Activation Card */}
          <section className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-purple-950/10 dark:shadow-black/60">
              
              {/* Card Header with Talaghayan Seal */}
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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activate Account</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Security Credential Setup</p>
                </div>
              </div>

              {/* State: Checking Link */}
              {state === "loading" && (
                <div className="py-12 text-center space-y-3">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-[#7B4DFF] border-r-transparent" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Validating activation link...</p>
                </div>
              )}

              {/* State: Invalid Token */}
              {state === "invalid" && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 p-4 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                    <p className="font-bold text-sm mb-1">Invalid or Expired Link</p>
                    {message}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    If your activation link has expired, request a new invite from the DILG Makati field office administrator.
                  </p>
                  <Link
                    href="/"
                    className={`mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors ${focusRing}`}
                  >
                    &larr; Return to Home
                  </Link>
                </div>
              )}

              {/* State: Activation Complete */}
              {state === "done" && (
                <div className="mt-6 space-y-4 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E6FBF3] text-[#06D6A0] dark:bg-[#0E382C] dark:text-[#84DEBD]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Activated</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Your password has been saved successfully. You may now sign in using your official email <strong>{invite?.email}</strong>.
                  </p>
                  <Link
                    href="/login"
                    className={`mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#7B4DFF] py-3 text-sm font-semibold text-white shadow-md shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
                  >
                    Proceed to Sign In &rarr;
                  </Link>
                </div>
              )}

              {/* State: Ready Form */}
              {state === "ready" && invite && (
                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                  {/* Account Badge Info */}
                  <div className="rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Account for:</p>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {invite.name}
                    </p>
                    <p className="text-xs text-[#7B4DFF] dark:text-[#CDBBFF] font-medium mt-0.5">
                      {invite.barangay ? `Barangay ${invite.barangay}` : "DILG Makati Operations Office"}
                    </p>
                  </div>

                  {/* Email field (Read-only) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                        readOnly
                        value={invite.email}
                        className="w-full rounded-xl bg-slate-100 dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-500 dark:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-white/10 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Set New Password
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="new-password"
                        required
                        minLength={8}
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full rounded-xl bg-slate-50 dark:bg-[#201833] py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF]"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="confirm-password"
                        required
                        minLength={8}
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-type your password"
                        className="w-full rounded-xl bg-slate-50 dark:bg-[#201833] py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF]"
                      />
                    </div>
                  </div>

                  {/* Show Passwords checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="show-passwords"
                      type="checkbox"
                      checked={show}
                      onChange={(e) => setShow(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#7B4DFF] focus:ring-[#7B4DFF] dark:border-white/20 dark:bg-black/30"
                    />
                    <label htmlFor="show-passwords" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                      Show passwords
                    </label>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300" role="alert">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className={`mt-2 w-full rounded-full bg-[#7B4DFF] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] transition-colors disabled:opacity-60 ${focusRing}`}
                  >
                    {saving ? "Activating Credentials..." : "Activate Account & Finish"}
                  </button>

                  <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-2">
                    Password must be at least 8 characters long with letters and numbers.
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer System Disclaimer */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-white/5">
        &copy; {new Date().getFullYear()} Republic of the Philippines &middot; Department of the Interior and Local Government &middot; Makati City Field Office
      </footer>
    </div>
  );
}

