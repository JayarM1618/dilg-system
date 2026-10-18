"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";
import type { User } from "@/types";

interface DashboardSummary {
  total_barangays: number;
  pending: number;
  submitted: number;
  under_review?: number;
  compliant: number;
  non_compliant: number;
}

interface MonitoringSummary {
  totals: {
    actions_today: number;
    actions_7d: number;
    active_users_7d: number;
    pending_accounts: number;
    deactivated_accounts: number;
    barangays_without_account: number;
  };
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

/**
 * Talaghayan — Mother System Operations Command Hub (`/talaghayan`).
 * Provides Super Administrators with full root-level control over
 * sub-systems (BORMS and Bagwis), administrative infrastructure (Accounts,
 * Monitoring, Barangays), and city-wide telemetry.
 */
export default function TalaghayanHome() {
  const { user } = useAuth();

  // City-wide compliance metrics
  const totals = useApi<DashboardSummary>("/api/dashboard/summary", { pollInterval: 8000 });
  // Directives review counts
  const reqSummary = useFetch<{ awaiting_review: number; to_do: number }>(
    "/api/requirements/summary",
    { pollInterval: 8000 }
  );
  // Monitoring & account metrics
  const monitoring = useApi<MonitoringSummary>("/api/monitoring/summary", { pollInterval: 10000 });
  const usersList = useApi<{ data: User[] }>("/api/users", { pollInterval: 12000 });

  const summary = totals.data;
  const awaitingReview = (summary?.submitted ?? 0) + (summary?.under_review ?? 0);
  const requirementsAwaiting = reqSummary.data?.awaiting_review ?? 0;

  const totalUsers = usersList.data?.data?.length ?? 0;
  const pendingAccounts = monitoring.data?.totals?.pending_accounts ?? 0;
  const actionsToday = monitoring.data?.totals?.actions_today ?? 0;
  const barangaysWithoutAccount = monitoring.data?.totals?.barangays_without_account ?? 0;

  const overallRate =
    summary && summary.total_barangays > 0
      ? Math.round(
          (summary.compliant /
            (summary.compliant + summary.submitted + summary.pending + summary.non_compliant || 1)) *
            100
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3 py-0.5 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0] animate-pulse" />
              DILG Makati Field Office
            </span>
            <span className="inline-flex items-center rounded-full bg-[#F1EBFF] dark:bg-[#352D52] px-2.5 py-0.5 text-xs font-semibold text-[#5A18C9] dark:text-[#CDBBFF]">
              Talaghayan Mother System
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              Root Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B1235] dark:text-white">
            Mother System Console
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-[#C9BCEB] max-w-2xl">
            Welcome, <strong>{user?.name}</strong>. Full root administrative oversight across the mother system — managing sub-systems <strong>BORMS</strong> &amp; <strong>Bagwis</strong>, user accounts, and city-wide audit trails.
          </p>
        </div>

        {/* Super admin authority badge */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="rounded-2xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/20 p-3.5 shadow-sm text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">Root Authority</p>
            <p className="text-sm font-bold text-[#5A18C9] dark:text-[#CDBBFF]">Super Administrator</p>
          </div>
        </div>
      </div>

      {/* ── System Attention Alert ── */}
      {(pendingAccounts > 0 || barangaysWithoutAccount > 0 || awaitingReview > 0 || requirementsAwaiting > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#F3EDFE]/90 via-[#EDE7FA]/70 to-transparent dark:from-[#241A3F] dark:via-[#1B142F] p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#7B4DFF]/20 text-[#5A18C9] dark:text-[#CDBBFF] font-bold text-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg>
            </span>
            <div>
              <p className="font-bold text-sm sm:text-base text-[#1B1235] dark:text-white">
                Administrative Actions Awaiting Your Attention
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {pendingAccounts > 0 && (
                  <>
                    <strong className="text-[#5A18C9] dark:text-[#CDBBFF]">{pendingAccounts} account(s)</strong> awaiting activation.{" "}
                  </>
                )}
                {barangaysWithoutAccount > 0 && (
                  <>
                    <strong className="text-amber-600 dark:text-amber-400">{barangaysWithoutAccount} barangay(s)</strong> have no designated representative.{" "}
                  </>
                )}
                {awaitingReview > 0 && (
                  <>
                    <strong className="text-[#0B6B52] dark:text-[#84DEBD]">{awaitingReview} report(s)</strong> awaiting review in BORMS.{" "}
                  </>
                )}
                {requirementsAwaiting > 0 && (
                  <>
                    <strong className="text-[#5A18C9] dark:text-[#CDBBFF]">{requirementsAwaiting} directive response(s)</strong> waiting for clearance.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {pendingAccounts > 0 && (
              <Link
                href="/talaghayan/users"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7B4DFF] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors"
              >
                <span>Manage Accounts</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            )}
            <Link
              href="/talaghayan/monitoring"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 shadow-sm hover:border-[#7B4DFF] transition-colors"
            >
              <span>View Audit Logs</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Key Metrics Overview ── */}
      <section aria-label="Talaghayan operational telemetry" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Makati Barangays</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1B1235] dark:text-white">
            {summary?.total_barangays ?? 23}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Full Jurisdiction</p>
        </div>

        <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">City Compliance</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {overallRate}%
          </p>
          <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">{summary?.compliant ?? 0} Units Cleared</p>
        </div>

        <div className="group rounded-2xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5A18C9] dark:text-[#CDBBFF]">System Accounts</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#5A18C9] dark:text-[#CDBBFF]">
            {totalUsers}
          </p>
          <p className="mt-1 text-xs text-[#5A18C9]/80 dark:text-[#CDBBFF]/80">{pendingAccounts} Waiting Activation</p>
        </div>

        <div className="group rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Audit Actions Today</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300">
            {actionsToday}
          </p>
          <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">Live Transactional Events</p>
        </div>
      </section>

      {/* ── Sub-systems Selection ── */}
      <section aria-labelledby="subsystems-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="subsystems-heading"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Talaghayan Sub-systems
          </h2>
          <span className="text-xs text-slate-400">Select sub-system to manage</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* ── CARD 1: BORMS ── */}
          <Link
            href="/borms"
            className={`group relative flex flex-col justify-between rounded-3xl border-2 border-[#7B4DFF]/30 hover:border-[#7B4DFF] bg-gradient-to-br from-[#F3EDFE]/90 via-white to-[#EDE7FA]/70 dark:from-[#241A3F] dark:via-[#1B142F] dark:to-[#171026] p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7B4DFF]/20 text-[#5A18C9] dark:text-[#CDBBFF] font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </span>
                <span className="rounded-full bg-[#7B4DFF]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5A18C9] dark:text-[#CDBBFF]">
                  Operations Center &bull; 3 Rs
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#1B1235] dark:text-white group-hover:text-[#5A18C9] dark:group-hover:text-[#CDBBFF] transition-colors">
                BORMS
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#A78BFA]">
                Barangay Operations &amp; Records Management System
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-[#C9BCEB] leading-relaxed">
                Supervise and administer the Three Rs for all active Makati barangays. Open reporting periods, review submissions, issue official requirements and complaints, upload guidelines, and manage the repository archive.
              </p>

              {/* 3 Rs breakdown */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Issue &amp; Track Requirements</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Review Barangay Reports</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Upload Forms &amp; Resources</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Manage Central Repository</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#7B4DFF]/15 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Full administrative authority
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B4DFF] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#7B4DFF]/25 transition-transform group-hover:scale-105">
                <span>Open BORMS</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>

          {/* ── CARD 2: BAGWIS ── */}
          <Link
            href="/bagwis"
            className={`group relative flex flex-col justify-between rounded-3xl border border-[#06D6A0]/30 hover:border-[#06D6A0] bg-gradient-to-br from-[#E6FBF3]/90 via-white to-[#E0F8F0]/70 dark:from-[#12382C]/80 dark:via-[#0F2D24]/80 dark:to-[#0C241D]/90 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#06D6A0]/20 text-[#0B6B52] dark:text-[#84DEBD] font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg>
                </span>
                <span className="rounded-full bg-[#06D6A0]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0B6B52] dark:text-[#84DEBD]">
                  Makati City &bull; Full Oversight
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#1B1235] dark:text-white group-hover:text-[#0B6B52] dark:group-hover:text-[#84DEBD] transition-colors">
                Bagwis
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#0B6B52] dark:text-[#84DEBD]">
                City-Level Compliance &amp; Security Oversight
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-[#C9BCEB] leading-relaxed">
                Makati City Field Office command board. Inspect the live 23-barangay compliance tally, track reporting cycles, export official CSV compliance reports, and monitor security incident logs across the city.
              </p>

              {/* City features tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>23 Barangays Live Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Export Compliance (.csv)</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Filing Cycles &amp; Deadlines</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Security &amp; Audit Logs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#06D6A0]/20 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Full city analytics &amp; security logs
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B6B52] dark:bg-[#06D6A0] px-4 py-2 text-xs sm:text-sm font-bold text-white dark:text-slate-900 shadow-md transition-transform group-hover:scale-105">
                <span>Open Bagwis</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Administrative Infrastructure ── */}
      <section aria-labelledby="admin-infrastructure-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="admin-infrastructure-title"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Administrative Infrastructure
          </h2>
          <span className="text-xs text-slate-400">Root administration modules</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Link
            href="/talaghayan/users"
            className={`group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD] text-base font-bold transition-transform duration-300 group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </span>
                <span className="rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-2.5 py-0.5 text-[11px] font-bold text-[#0B6B52] dark:text-[#84DEBD]">
                  User Provisioning
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#5A18C9] dark:group-hover:text-[#CDBBFF] transition-colors">
                Accounts Management
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Issue activation invitations, assign role permissions, and control administrative or barangay representative access.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0B6B52] dark:text-[#84DEBD]">
              <span>Manage Accounts</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/talaghayan/monitoring"
            className={`group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#F1EBFF] text-[#7B4DFF] dark:bg-[#352D52] dark:text-[#CDBBFF] text-base font-bold transition-transform duration-300 group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </span>
                <span className="rounded-full bg-[#F1EBFF] dark:bg-[#352D52] px-2.5 py-0.5 text-[11px] font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">
                  Audit Trail
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#5A18C9] dark:group-hover:text-[#CDBBFF] transition-colors">
                System Monitoring
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Track all user transactions, report submissions, security events, and compliance milestones in real time.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
              <span>Inspect Audit Trail</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/talaghayan/barangays"
            className={`group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#FFF8E6] text-[#A06C00] dark:bg-[#382C10] dark:text-[#FFD60A] text-base font-bold transition-transform duration-300 group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </span>
                <span className="rounded-full bg-[#FFF8E6] dark:bg-[#382C10] px-2.5 py-0.5 text-[11px] font-bold text-[#A06C00] dark:text-[#FFD60A]">
                  Jurisdiction
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-[#FFD60A] transition-colors">
                Barangays Directory
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Configure the 23 official Makati barangays, edit official designations, and monitor account assignment status.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#A06C00] dark:text-[#FFD60A]">
              <span>Manage Directory</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        </div>
      </section>

      {/* ── Quick Supervisory & Operational Actions ── */}
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] mb-4">
          Quick Operational Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/borms/requirements"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#7B4DFF] dark:hover:border-[#7B4DFF] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#F1EBFF] text-[#7B4DFF] dark:bg-[#352D52] dark:text-[#CDBBFF] text-sm font-bold mb-3 transition-transform duration-300 group-hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#5A18C9] dark:group-hover:text-[#CDBBFF] transition-colors">Directives Tracker</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Issue directives and track barangay compliance.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
              <span>Manage directives</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/borms/reports"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#06D6A0] dark:hover:border-[#06D6A0] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD] text-sm font-bold mb-3 transition-transform duration-300 group-hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0B6B52] dark:group-hover:text-[#84DEBD] transition-colors">Review Submissions</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Examine barangay reports and mark compliant.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B6B52] dark:text-[#84DEBD]">
              <span>Review reports</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/borms/resources"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[#FFF8E6] text-[#A06C00] dark:bg-[#382C10] dark:text-[#FFD60A] text-sm font-bold mb-3 transition-transform duration-300 group-hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-[#FFD60A] transition-colors">Resources &amp; SOPs</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload official templates, memos, and forms.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#A06C00] dark:text-[#FFD60A]">
              <span>Upload forms</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/borms/repository"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-slate-500 dark:hover:border-slate-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-sm font-bold mb-3 transition-transform duration-300 group-hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-white transition-colors">Central Repository</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Access archived documents and historical records.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Browse repository</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
