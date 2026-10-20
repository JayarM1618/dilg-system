"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roles";
import { useBarangays } from "@/hooks/useBarangays";
import type { Paginated, Submission, SubmissionStatus } from "@/types";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";
import NotificationBell from "@/components/NotificationBell";
import RealtimeComplianceChart from "@/components/RealtimeComplianceChart";
import RealtimePeriodTally from "@/components/RealtimePeriodTally";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import {
  getSavedAccounts,
  removeSavedAccount,
  saveAccount,
  type SavedAccount,
} from "@/lib/accountStorage";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

/* ---------- Data for the barangay landing content ---------- */

const STEPS = [
  { title: "Office opens a period", body: "Each barangay gets the report, its period and a due date.", color: "#7B4DFF" },
  { title: "Barangay files it", body: "The representative uploads the finished report before the deadline.", color: "#06D6A0" },
  { title: "Office reviews", body: "Staff mark it compliant, or send it back with remarks.", color: "#F5B800" },
  { title: "Talaghayan updates", body: "The tally changes instantly. No spreadsheet re-encoding.", color: "#F21DB4" },
];

const STATUSES: { status: SubmissionStatus; meaning: string }[] = [
  { status: "pending", meaning: "Assigned, but the barangay hasn't filed it yet." },
  { status: "submitted", meaning: "Uploaded and waiting for the office." },
  { status: "under_review", meaning: "Office staff are checking it." },
  { status: "compliant", meaning: "Accepted. Counts toward the compliance rate." },
  { status: "non_compliant", meaning: "Needs fixing. The reviewer's remarks show on the dashboard." },
];

const FAQ = [
  { q: "How do I get an account?", a: "Ask the DILG Makati office. Accounts are created for you, so there is no public sign-up." },
  { q: "Can barangays see each other's reports?", a: "No. A barangay sees only its own reports. Only office staff see every barangay in the Talaghayan." },
  { q: "What happens when a report is non-compliant?", a: "The reviewer adds remarks explaining what to fix, and they appear next to the report on your dashboard." },
];

const card = "min-w-0 rounded-3xl p-6";

/* ---------- Helpers ---------- */

function getShortName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  if (parts.length >= 2 && /^(jr\.?|sr\.?|ii|iii|iv)$/i.test(parts[1])) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

function getInitial(fullName: string): string {
  return fullName?.trim().charAt(0).toUpperCase() || "U";
}

/* ================================================================== */
/* Main Page                                                           */
/* ================================================================== */

/**
 * "Who's using Talaghayan?" - Chrome profile picker style.
 *
 * - Guest / no saved accounts: shows the chooser + Add card.
 * - Barangay rep logged in: shows the barangay landing content (hero,
 *   charts, journey, statuses, FAQ) directly here — no barangay list,
 *   since the rep is already assigned to one.
 * - DILG / Admin clicks tile: routes to `/dilg`.
 */
export default function ChooserPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [menuOpenEmail, setMenuOpenEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { barangays } = useBarangays();

  // Load saved accounts from localStorage on mount & sync current authenticated user
  useEffect(() => {
    let saved = getSavedAccounts();
    if (user) {
      saved = saveAccount(user);
    }
    setAccounts(saved);
  }, [user]);

  // Close 3-dot dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenEmail(null);
      }
    }
    if (menuOpenEmail) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpenEmail]);

  function handleAccountClick(account: SavedAccount) {
    if (user && user.email.toLowerCase() === account.email.toLowerCase()) {
      // Already logged in with this account → navigate to their role hub
      router.push(homeFor(user.role));
    } else {
      // Different account → login page with email prefilled
      router.push(`/login?email=${encodeURIComponent(account.email)}`);
    }
  }

  function handleRemove(e: React.MouseEvent, email: string) {
    e.stopPropagation();
    const updated = removeSavedAccount(email);
    setAccounts(updated);
    setMenuOpenEmail(null);
  }

  async function handleSignOut(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpenEmail(null);
    await logout();
  }

  // ----------------------------------------------------------------
  // When a barangay rep is logged in, show the barangay landing page
  // content directly (no barangay list) instead of the Chrome chooser.
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!loading && user?.role === "barangay_rep") {
      router.replace("/user");
    }
  }, [loading, user, router]);

  if (!loading && user?.role === "barangay_rep") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0E0A17]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Default: Government Portal Account Access Hub (Institutional System Design, No hover bounce)
  // ----------------------------------------------------------------
  return (
    <div
      className={`${poppins.className} relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#EDE7FA] transition-colors duration-500 ease-out`}
    >
      {/* Static atmospheric glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/40 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Full-width System Navigation Header */}
      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#06D6A0]" />
              System Operational &bull; v2.4
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/citizens"
              className={`rounded-full border border-slate-200 dark:border-white/15 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 ${focusRing}`}
            >
              Makati Citizen View
            </Link>
            <Link
              href="/login"
              className={`rounded-full bg-[#7B4DFF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6A3CF0] ${focusRing}`}
            >
              Enter Credentials &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full flex-1 px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authorized Accounts Roster */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="border-b border-slate-200 dark:border-white/10 pb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3.5 py-1 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
                Unified Identity &amp; Access Hub
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Authorized Personnel Profiles
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Select your assigned profile to load your governance workspace, review pending report cycles, or connect another official account.
              </p>
            </div>

            {/* Profile Cards Grid (Zero hover scale/movement) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => {
                const isMenuOpen = menuOpenEmail === account.email;
                const isCurrentActive =
                  user && user.email.toLowerCase() === account.email.toLowerCase();
                const isBarangay = Boolean(account.barangayName) || account.role === "barangay_rep";

                return (
                  <div
                    key={account.email}
                    onClick={() => handleAccountClick(account)}
                    className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border ${
                      isCurrentActive
                        ? "border-[#7B4DFF] ring-2 ring-[#7B4DFF]/20"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                    } p-5 shadow-sm cursor-pointer select-none transition-colors ${focusRing}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAccountClick(account);
                      }
                    }}
                  >
                    {/* Top: Role Badge & Options Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isBarangay
                            ? "bg-[#F1EBFF] text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF]"
                            : "bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isCurrentActive ? "bg-[#06D6A0]" : "bg-slate-400"}`}
                        />
                        {isBarangay ? "Barangay Official" : "DILG Supervisor / Admin"}
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Account options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenEmail(isMenuOpen ? null : account.email);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <MoreVerticalIcon />
                        </button>

                        {/* Popover Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#28292a] py-1.5 shadow-xl text-left text-xs"
                          >
                            {isCurrentActive && (
                              <button
                                type="button"
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                              >
                                <SignOutIcon />
                                Sign out
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleRemove(e, account.email)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <TrashIcon />
                              Remove from saved
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Profile Identity */}
                    <div className="mt-4 flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
                        style={{ backgroundColor: account.avatarColor || "#7B4DFF" }}
                      >
                        {getInitial(account.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-slate-900 dark:text-white" title={account.name}>
                          {account.name}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {account.barangayName ? `Barangay ${account.barangayName}` : "DILG Makati Central"}
                        </p>
                        <p className="truncate text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {account.email}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Enter action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
                        {isCurrentActive ? "Active Session" : "Click to authenticate"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">
                        Access Workspace &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Add Account Card */}
              <Link
                href="/login"
                className={`relative flex flex-col justify-between rounded-2xl bg-white/60 dark:bg-[#181126]/60 border border-dashed border-slate-300 dark:border-white/20 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] hover:bg-white dark:hover:bg-[#181126] transition-colors select-none ${focusRing}`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    New Account
                  </span>
                  <span className="text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-[#7B4DFF] dark:text-[#CDBBFF] shadow-sm font-bold">
                    <PlusIcon />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      Connect New Account
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sign in with official email &amp; password
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Barangay Clerk, Rep, or DILG Officer
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Credentials Form
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">
                    Open Sign In &rarr;
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right Column: Institutional System Console & Security */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* System Status Panel */}
            <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#06D6A0]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  DILG Makati Security Protocol
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                Authorized Governance System
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Talaghayan is the official monitoring system of the Department of the Interior and Local Government - Makati Field Office.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Jurisdiction</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">23 Barangays</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Audit Status</p>
                  <p className="text-sm font-bold text-[#06D6A0] mt-0.5">Live &amp; Monitored</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#06D6A0] mt-0.5 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>End-to-end audit compliance pursuant to R.A. 7160</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#06D6A0] mt-0.5 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Direct submission pipeline with validation remarks</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#06D6A0] mt-0.5 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Real-time compliance dashboard for citywide tracking</span>
                </div>
              </div>
            </div>

            {/* Public Portal Callout */}
            <div className="rounded-2xl bg-gradient-to-br from-[#F3EDFE] to-[#E6FBF3] dark:from-[#201833] dark:to-[#132A24] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/30 px-2.5 py-0.5 text-[11px] font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
                Citizen Advisory Portal
              </span>
              <h4 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
                Public Transparency Directory
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Looking for public barangay services, local officials, emergency hotlines, and announcements without signing in?
              </p>
              <Link
                href="/citizens"
                className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#7B4DFF] dark:text-[#CDBBFF] hover:underline ${focusRing}`}
              >
                Access Citizens Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 py-5 text-center text-xs text-slate-500 dark:text-[#7C6FA3] bg-white/50 dark:bg-[#110C1B]/50 backdrop-blur-md">
        &copy; {new Date().getFullYear()} Republic of the Philippines &middot; Department of the Interior and Local Government &middot; Makati City Field Office
      </footer>
    </div>
  );
}


/* ================================================================== */
/* Barangay Rep Landing – shown when a rep is logged in               */
/* ================================================================== */

function BarangayRepLanding({
  userName,
  barangayName,
  barangayCount,
  onLogout,
}: {
  userName: string;
  barangayName: string;
  barangayCount: number;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const { data: subData } = useApi<Paginated<Submission>>("/api/submissions?per_page=200", { pollInterval: 8000 });
  const { data: reqSummary } = useFetch<{ to_do: number; new: number; overdue: number }>("/api/requirements/summary", { pollInterval: 8000 });
  const realtime = useRealtimeAnalytics({ barangayId: user?.barangay_id, pollInterval: 8000 });

  const submissions = subData?.data ?? [];
  const counts = { compliant: 0, review: 0, pending: 0, fix: 0 };
  submissions.forEach((s) => {
    if (s.status === "compliant") counts.compliant += 1;
    else if (s.status === "submitted" || s.status === "under_review") counts.review += 1;
    else if (s.status === "non_compliant") counts.fix += 1;
    else counts.pending += 1;
  });

  const total = realtime.data?.total ?? submissions.length;
  const compliantCount = realtime.data?.compliant ?? counts.compliant;
  const underReviewCount = realtime.data?.under_review ?? counts.review;
  const pendingCount = realtime.data?.pending ?? counts.pending;
  const fixCount = realtime.data?.non_compliant ?? counts.fix;
  const compliantPct = realtime.data ? Math.round(realtime.data.compliance_rate) : (total > 0 ? Math.round((compliantCount / total) * 100) : 100);

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      {/* Static atmospheric glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/40 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Full-width System Navigation Header */}
      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#06D6A0] animate-pulse" />
              Barangay Operations Console &bull; Real-Time
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Notification Bell */}
            <NotificationBell />

            <Link
              href="/borms"
              className={`rounded-full bg-[#7B4DFF] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
            >
              Open Dashboard &rarr;
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className={`rounded-full border border-slate-200 dark:border-white/15 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${focusRing}`}
            >
              Sign out
            </button>
            <span
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#E3D5FF] text-xs sm:text-sm font-bold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] shadow-sm"
              aria-hidden="true"
            >
              {userName.trim().charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Full-width Main Area */}
      <main className="relative z-10 w-full flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Full-width Landscape Hero Banner */}
        <section
          className={`${card} relative overflow-hidden bg-gradient-to-br from-[#E6FBF3]/90 via-[#F3EDFE]/80 to-[#E8FAFF]/90 dark:from-[#132A24]/90 dark:via-[#1F1833]/80 dark:to-[#122A30]/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 sm:p-10`}
          aria-labelledby="hero-title"
        >
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left: Info & actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/80 dark:bg-black/30 px-3.5 py-1 text-xs font-semibold text-[#0E5440] dark:text-[#84DEBD] ring-1 ring-[#06D6A0]/30 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#06D6A0] animate-pulse" />
                Authenticated Representative &bull; {userName}
              </div>

              <h1 id="hero-title" className="mt-4 text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0E2B24] dark:text-[#E8F8F3] leading-tight">
                Barangay {barangayName}
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#2C5A4D] dark:text-[#A8E2CF]">
                Welcome to your official DILG Makati reporting command center. Submit mandatory documents, inspect administrative compliance marks, and track report review lifecycles without spreadsheets.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/borms"
                  className={`inline-flex items-center gap-2 rounded-full bg-[#7B4DFF] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
                >
                  Enter Submissions Dashboard &rarr;
                </Link>
                <Link
                  href="/borms/requirements"
                  className={`inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/20 transition-colors ${focusRing}`}
                >
                  {reqSummary && reqSummary.to_do > 0 ? `DILG Directives (${reqSummary.to_do})` : "View Directives"}
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className={`inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors ${focusRing}`}
                >
                  Switch Account
                </button>
              </div>
            </div>

            {/* Right: Telemetry KPI Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">City Network</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">{barangayCount}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Makati Barangays</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status Taxonomy</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">{STATUSES.length}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Standardized Stages</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compliance Rate</p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#06D6A0]">{compliantPct}%</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{compliantCount} of {total} Cleared</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Engine</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xl font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">Real-Time</p>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Instant Field Telemetry</p>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Live Real-Time Analytics in 2 Balanced Columns */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-7`} aria-labelledby="sample-line">
            <RealtimeComplianceChart
              trend={realtime.data?.monthly_trend ?? []}
              title="Reporting Compliance Trend"
              subtitle="Aggregate performance across monthly submission milestones"
              badgeLabel={`Barangay ${barangayName}`}
              loading={realtime.loading}
            />
          </section>

          <section className={`${card} flex flex-col justify-between bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-5`} aria-labelledby="sample-ring">
            <RealtimePeriodTally
              total={total}
              compliant={compliantCount}
              underReview={underReviewCount}
              pending={pendingCount}
              nonCompliant={fixCount}
              complianceRate={compliantPct}
              title="Compliance Status Overview"
              subtitle="Progress toward compliance clearance"
              actionHref="/borms"
              actionLabel="Inspect active reports"
            />
          </section>
        </div>

        {/* Row 3: Actionable Directives & Requirements from DILG */}
        {reqSummary && reqSummary.to_do > 0 ? (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-6 border border-amber-400/30 dark:border-amber-400/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                  !
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Directives Awaiting Action for Barangay {barangayName}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    You have <strong className="text-amber-600 dark:text-amber-400">{reqSummary.to_do} requirement(s)</strong> awaiting your compliance from DILG Makati
                    {reqSummary.new ? ` (${reqSummary.new} new)` : ""}
                    {reqSummary.overdue ? `, ${reqSummary.overdue} overdue` : ""}.
                  </p>
                </div>
              </div>
              <Link
                href="/borms/requirements"
                className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#7B4DFF] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
              >
                Comply Now &rarr;
              </Link>
            </div>
          </section>
        ) : null}

        {/* Row 4: Quick Operational Launchpad */}
        <section aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Barangay Operations Launchpad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/borms"
              className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] transition-colors"
            >
              <div>
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#F1EBFF] text-[#7B4DFF] dark:bg-[#352D52] dark:text-[#CDBBFF] text-sm font-bold mb-3">
                  📂
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reports Dashboard</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  View full status logs, examiner remarks, and submission cycles.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
                Open dashboard &rarr;
              </span>
            </Link>

            <Link
              href="/borms/reports"
              className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] transition-colors"
            >
              <div>
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD] text-sm font-bold mb-3">
                  📝
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Submit Report</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upload quarterly financial filings and monthly accomplishments.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[#0B6B52] dark:text-[#84DEBD]">
                File submission &rarr;
              </span>
            </Link>

            <Link
              href="/borms/requirements"
              className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] transition-colors"
            >
              <div>
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#FFF8E6] text-[#A06C00] dark:bg-[#382C10] dark:text-[#FFD60A] text-sm font-bold mb-3">
                  📑
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">DILG Directives</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Review compliance tasks, required forms, and official directives.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[#A06C00] dark:text-[#FFD60A]">
                Check directives &rarr;
              </span>
            </Link>

            <Link
              href="/borms/community"
              className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] transition-colors"
            >
              <div>
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#FDE8F3] text-[#A0124F] dark:bg-[#3B1225] dark:text-[#FF80B5] text-sm font-bold mb-3">
                  📢
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Announcements</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Makati City programs, circulars, and community advisories.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[#A0124F] dark:text-[#FF80B5]">
                View programs &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Journey + Statuses */}
        <div className="grid gap-6 lg:grid-cols-5">
          <section id="journey" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8 lg:col-span-3`} aria-labelledby="journey-title">
            <h2 id="journey-title" className="text-xl font-bold text-slate-900 dark:text-white">Reporting Workflow Pipeline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standardized progression for every assigned document.</p>
            <ol className="mt-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute left-4.75 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-slate-200 dark:bg-white/10" />
                  )}
                  <span
                    className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: s.color }}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="statuses" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8 lg:col-span-2`} aria-labelledby="statuses-title">
            <h2 id="statuses-title" className="text-xl font-bold text-slate-900 dark:text-white">Status Taxonomy</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Five standardized verification stages.</p>
            <ul className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
              {STATUSES.map((s) => (
                <li key={s.status} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-3">
                  <span className="shrink-0 sm:w-28"><StatusBadge status={s.status} /></span>
                  <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{s.meaning}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* FAQ Accordion */}
        <section id="faq" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8`} aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-xl font-bold text-slate-900 dark:text-white">Barangay Guidance &amp; FAQ</h2>
          <div className="mt-5 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/5">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm text-slate-900 dark:text-slate-100 ${focusRing}`}>
                  {f.q}
                  <span aria-hidden="true" className="text-lg leading-none text-[#7B4DFF] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-xs leading-5 text-slate-600 dark:text-slate-300 border-t border-slate-200/50 dark:border-white/5 pt-2.5">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing Action Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7B4DFF] to-[#5A18C9] px-6 py-8 sm:px-10 sm:py-10 text-white shadow-md">
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Manage Barangay {barangayName} Reports</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#E9DFFF]">Proceed to your authorized operations deck to file requirements and review feedback.</p>
            </div>
            <Link href="/borms" className={`w-full sm:w-auto text-center shrink-0 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#5A18C9] hover:bg-slate-50 transition-colors ${focusRing}`}>
              Open Dashboard &rarr;
            </Link>
          </div>
        </section>

        <footer className="py-4 text-center text-xs text-slate-500 dark:text-[#7C6FA3]">
          &copy; {new Date().getFullYear()} Republic of the Philippines &middot; DILG Makati &middot; Barangay {barangayName}
        </footer>
      </main>
    </div>
  );
}


/* ================================================================== */
/* Shared small pieces                                                 */
/* ================================================================== */

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#06D6A0] px-4 py-5 text-center text-[#04281F]">
      <p className="text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

function Dot({ color, label, small = false }: { color: string; label: string; small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${small ? "h-2 w-2" : "h-2.5 w-2.5"} rounded-full`} style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function SampleChip({ label = "Sample view" }: { label?: string }) {
  return <span className="shrink-0 rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>;
}

/** Dynamic line chart of reports filed and reviewed. */
function DynamicLineChart({ peakPct = 24 }: { peakPct?: number }) {
  return (
    <svg viewBox="0 0 300 190" className="mt-3 w-full" role="img" aria-label="Line chart of reports filed and reviewed over months">
      {[0, 25, 50, 75].map((v, i) => (
        <g key={v}>
          <line x1="30" x2="294" y1={150 - i * 38} y2={150 - i * 38} stroke="#E0D4FA" strokeWidth="1" />
          <text x="22" y={154 - i * 38} textAnchor="end" fontSize="10" fill="#7C6FA3">{v}</text>
        </g>
      ))}
      <path d="M34 128 C52 112 62 78 86 82 S120 138 140 104 S178 36 204 44 S250 90 290 76" fill="none" stroke="#7B4DFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 140 C58 126 70 80 98 84 S132 116 152 90 S186 24 208 34 S246 62 290 106" fill="none" stroke="#F21DB4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="208" x2="208" y1="40" y2="150" stroke="#7B4DFF" strokeWidth="1" strokeDasharray="3 3" />
      <g transform="translate(184 6)">
        <rect width="48" height="22" rx="5" fill="#140B33" />
        <text x="24" y="15" textAnchor="middle" fontSize="10" fill="#fff">{peakPct}%</text>
      </g>
      {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => (
        <text key={m} x={34 + i * 43.3} y="176" textAnchor="middle" fontSize="10" fill="#7C6FA3">{m}</text>
      ))}
    </svg>
  );
}

function DynamicRings({
  filedPct,
  reviewPct,
  compliantPct,
}: {
  filedPct: number;
  reviewPct: number;
  compliantPct: number;
}) {
  const ring = (r: number, pct: number, color: string, track: string) => {
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0.04, Math.min(1, pct));
    return (
      <g key={r}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
        />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 -rotate-90" role="img" aria-label="Progress rings">
      {ring(54, filedPct, "#F21DB4", "#FBD3EE")}
      {ring(40, reviewPct, "#7B4DFF", "#E3D5FF")}
      {ring(26, compliantPct, "#FFC800", "#FFF0A3")}
    </svg>
  );
}

/* ---------- Icons ---------- */

function PlusIcon() {
  return (
    <svg
      width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MoreVerticalIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GuestModeIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 18c.8-2.2 2.7-3.5 5-3.5s4.2 1.3 5 3.5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
