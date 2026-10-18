"use client";

import { useApi } from "@/hooks/useApi";
import type { TalaghayanRow } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import ThreeRsTabs from "@/components/threers/ThreeRsTabs";

interface Summary {
  total_barangays: number;
  pending: number;
  submitted: number;
  compliant: number;
  non_compliant: number;
}

export default function TalaghayanBoard() {
  const grid = useApi<{ data: TalaghayanRow[] }>("/api/dashboard/talaghayan", { pollInterval: 8000 });
  const totals = useApi<Summary>("/api/dashboard/summary", { pollInterval: 8000 });

  const rows = grid.data?.data ?? [];
  const summary = totals.data;
  const loading = grid.loading || totals.loading;
  const error = grid.error ?? totals.error;

  function retry() {
    if (grid.error) grid.retry();
    if (totals.error) totals.retry();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EBFF] dark:bg-[#352D52] px-3 py-0.5 text-xs font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
            Sub-System of Talaghayan
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Board &bull; Real-Time Sync
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">
          BORMS Operations Board
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-[#C9BCEB] transition-colors duration-500 ease-out">
          Barangay Operations &amp; Records Management System &bull; Active compliance matrix for all 23 Makati barangays across the Three Rs.
        </p>
      </div>

      <ThreeRsTabs />

      {/* ── Overview Panel ── */}
      {summary && (
        <section aria-label="Overview statistics">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Barangays"
              value={summary.total_barangays}
              icon={<BarangayIcon />}
              accentFrom="from-[#7B4DFF]/10"
              accentTo="to-[#A78BFA]/5"
              darkAccentFrom="dark:from-[#7B4DFF]/20"
              darkAccentTo="dark:to-[#A78BFA]/10"
              iconBg="bg-[#E3D5FF] text-[#5A18C9] dark:bg-[#5A18C9]/30 dark:text-[#CDBBFF]"
            />
            <StatCard
              label="Pending"
              value={summary.pending}
              icon={<ClockIcon />}
              accentFrom="from-amber-500/10"
              accentTo="to-orange-400/5"
              darkAccentFrom="dark:from-amber-500/20"
              darkAccentTo="dark:to-orange-400/10"
              iconBg="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
            />
            <StatCard
              label="Submitted"
              value={summary.submitted}
              icon={<PaperIcon />}
              accentFrom="from-blue-500/10"
              accentTo="to-cyan-400/5"
              darkAccentFrom="dark:from-blue-500/20"
              darkAccentTo="dark:to-cyan-400/10"
              iconBg="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
            />
            <StatCard
              label="Compliant"
              value={summary.compliant}
              icon={<CheckCircleIcon />}
              accentFrom="from-emerald-500/10"
              accentTo="to-green-400/5"
              darkAccentFrom="dark:from-emerald-500/20"
              darkAccentTo="dark:to-green-400/10"
              iconBg="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              valueColor="text-emerald-700 dark:text-emerald-400"
            />
            <StatCard
              label="Non-compliant"
              value={summary.non_compliant}
              icon={<AlertIcon />}
              accentFrom="from-rose-500/10"
              accentTo="to-red-400/5"
              darkAccentFrom="dark:from-rose-500/20"
              darkAccentTo="dark:to-red-400/10"
              iconBg="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
              valueColor="text-rose-700 dark:text-rose-400"
            />
          </div>
        </section>
      )}

      {/* ── Barangay Compliance Panel ── */}
      <section aria-label="Barangay compliance details">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <path d="M4 21V9l8-5 8 5v12M2 21h20M9 21v-6h6v6" />
          </svg>
          Barangay Compliance
        </h2>
        <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 ease-out overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Compliance rate and latest report statuses per barangay</caption>
              <thead>
                <tr className="border-b border-[#EDE7FA]/60 dark:border-white/10">
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]">Barangay</th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]">Compliance Rate</th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]">Latest Statuses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FA]/40 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
                        <span className="text-sm text-slate-400 dark:text-[#7C6FA3]">Loading the tally...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-14 text-center">
                      <p className="font-medium text-rose-600 dark:text-rose-400">{error}</p>
                      <button onClick={retry} className="mt-3 rounded-full border border-[#EDE7FA] dark:border-[#2B2542] px-4 py-1.5 text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors hover:bg-white/50 dark:hover:bg-[#2B2542]/50">
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-14 text-center text-slate-400 dark:text-[#7C6FA3]">
                      No barangays yet. Add barangays and report periods to start the tally.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.barangay.id} className="transition-colors duration-300 hover:bg-[#7B4DFF]/5 dark:hover:bg-[#7B4DFF]/10">
                      <th scope="row" className="whitespace-nowrap px-5 py-4 text-left font-medium text-[#1B1235] dark:text-white">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E3D5FF]/60 dark:bg-[#5A18C9]/20 text-xs font-bold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors duration-500">
                            {row.barangay.name.charAt(0).toUpperCase()}
                          </span>
                          {row.barangay.name}
                        </div>
                      </th>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-2.5 w-28 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                row.compliance_rate >= 80
                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  : row.compliance_rate >= 40
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-rose-400 to-rose-500"
                              }`}
                              style={{ width: `${row.compliance_rate}%` }}
                            />
                          </div>
                          <span className={`w-12 font-semibold tabular-nums ${
                            row.compliance_rate >= 80
                              ? "text-emerald-700 dark:text-emerald-400"
                              : row.compliance_rate >= 40
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-rose-700 dark:text-rose-400"
                          }`}>
                            {row.compliance_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.submissions.length === 0 ? (
                            <span className="text-slate-400 dark:text-[#7C6FA3]">No reports yet</span>
                          ) : (
                            row.submissions.map((s, i) => (
                              <StatusBadge key={i} status={s.status} label={s.category} />
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Stat Card Component ── */

function StatCard({
  label,
  value,
  icon,
  accentFrom,
  accentTo,
  darkAccentFrom,
  darkAccentTo,
  iconBg,
  valueColor = "text-[#1B1235] dark:text-white",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentFrom: string;
  accentTo: string;
  darkAccentFrom: string;
  darkAccentTo: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} ${darkAccentFrom} ${darkAccentTo} bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] px-4 py-5 sm:px-5 sm:py-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,1)] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-[#A99BD4] transition-colors duration-500 ease-out">{label}</p>
          <p className={`mt-1 text-2xl sm:text-3xl font-bold tabular-nums ${valueColor} transition-colors duration-500 ease-out`}>
            {value}
          </p>
        </div>
        <span className={`grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl ${iconBg} transition-all duration-500 ease-out group-hover:scale-110`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ── Icons ── */

function BarangayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V9l8-5 8 5v12M2 21h20M9 21v-6h6v6M9 11h.01M15 11h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
