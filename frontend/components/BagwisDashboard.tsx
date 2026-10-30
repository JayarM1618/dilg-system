"use client";

import { useState, useMemo, useRef, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { BagwisReadOnlyBanner } from "@/components/BagwisReadOnlyBanner";
import type { TalaghayanRow } from "@/types";
import type { BagwisPpa, BagwisPpaEntry } from "@/components/threers/types";

/* ================================================================== */
/* Constants & Helpers                                                 */
/* ================================================================== */

type Tab = "matrix" | "reports" | "ppas" | "security";

const PPA_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  compliant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  non_compliant: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

/* ================================================================== */
/* Main Bagwis Dashboard Component                                     */
/* ================================================================== */

export default function BagwisDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("matrix");
  if (!user) return null;

  const isBarangayRep = user.role === "barangay_rep";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "matrix",
      label: "Compliance Matrix",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: "reports",
      label: "City Reports",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "ppas",
      label: "PPAs (City Programs)",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: "security",
      label: "Security Oversight",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {isBarangayRep && <BagwisReadOnlyBanner />}

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3 py-0.5 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
            DILG Makati City Oversight
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bagwis Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {isBarangayRep
              ? "City-wide compliance standing and program monitoring. Barangay representatives have view-only access."
              : "Consolidated city-level governance, barangay compliance metrics, PPA progress, and threat telemetry."}
          </p>
        </div>
        {isBarangayRep && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            <span>👁</span> View Only Mode
          </span>
        )}
      </header>

      {/* Modern Pill Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                tab === t.key
                  ? "bg-[#0039A6] text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "matrix" && <MatrixTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "ppas" && <PpasTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}

/* ================================================================== */
/* Matrix Tab — Barangay compliance grid                               */
/* ================================================================== */

type SummaryData = {
  total_barangays?: number;
  total?: number;
  compliant?: number;
  submitted?: number;
  pending?: number;
  non_compliant?: number;
  under_review?: number;
  overdue?: number;
};

function MatrixTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  // Both /api/dashboard/talaghayan and /api/bagwis/compliance-grid are routed in backend
  const { data: gridRes, loading, reload } = useFetch<{ data: TalaghayanRow[] }>(user ? "/api/dashboard/talaghayan" : null);
  const { data: totals } = useFetch<SummaryData>(user ? "/api/dashboard/summary" : null);

  const rows = useMemo(() => {
    const raw = Array.isArray(gridRes) ? gridRes : (gridRes?.data ?? []);
    if (!search.trim()) return raw;
    const term = search.toLowerCase();
    return raw.filter(
      (r) =>
        r.barangay.name.toLowerCase().includes(term) ||
        r.barangay.code.toLowerCase().includes(term)
    );
  }, [gridRes, search]);

  const totalBarangays = totals?.total_barangays ?? totals?.total ?? 33;
  const compliantCount = totals?.compliant ?? 0;
  const underReviewCount = totals?.under_review ?? 0;
  const pendingCount = totals?.pending ?? 0;
  const overdueCount = totals?.overdue ?? 0;

  return (
    <div className="space-y-6">
      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <KpiCard
          label="Total Barangays"
          value={totalBarangays}
          subtext="Makati City jurisdictions"
          accent="slate"
        />
        <KpiCard
          label="Compliant Submissions"
          value={compliantCount}
          subtext="Approved & compliant"
          accent="emerald"
        />
        <KpiCard
          label="Under Review"
          value={underReviewCount}
          subtext="Awaiting verification"
          accent="amber"
        />
        <KpiCard
          label="Pending Submissions"
          value={pendingCount}
          subtext="Awaiting barangay upload"
          accent="blue"
        />
        <KpiCard
          label="Overdue"
          value={overdueCount}
          subtext="Past filing deadline"
          accent="red"
        />
      </div>

      {/* Filter and Table Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Makati City Compliance Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live computed standing per barangay across all mandatory requirements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] pl-8 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 w-52 sm:w-64 transition"
                placeholder="Search barangay or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => reload()}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Refresh Matrix"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">Barangay</th>
                <th scope="col" className="px-4 py-3.5">Code</th>
                <th scope="col" className="px-4 py-3.5 text-center">Requirements</th>
                <th scope="col" className="px-6 py-3.5">Compliance Progress</th>
                <th scope="col" className="px-6 py-3.5 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
                      <span>Loading compliance matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                    {search ? "No barangays match your filter criteria." : "No compliance records found."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const rate = r.compliance_rate ?? 0;
                  const progressColor =
                    rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";
                  const standingText =
                    rate >= 80 ? "High Compliance" : rate >= 50 ? "Moderate" : rate > 0 ? "Needs Attention" : "Pending";
                  const standingBadge =
                    rate >= 80
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : rate >= 50
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300";

                  return (
                    <tr key={r.barangay.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0039A6]/10 text-[#0039A6] dark:text-[#93C5FD] text-xs font-bold">
                            {r.barangay.name.substring(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold">{r.barangay.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {r.barangay.code}
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300">
                        {r.submissions?.length ?? 0}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progressColor} transition-all duration-300`}
                              style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${standingBadge}`}>
                          {standingText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Reports Tab — City compliance cycles & analytics                    */
/* ================================================================== */

type Period = { period_label: string; period_start: string; due_date: string };
type ComplianceReport = {
  period_label: string | null;
  totals: {
    pending: number;
    submitted: number;
    under_review: number;
    compliant: number;
    non_compliant: number;
    total: number;
    overdue: number;
    late_filed: number;
    compliance_rate: number;
    filing_rate: number;
  };
  by_barangay: {
    barangay: { id: number; name: string; code: string };
    total: number;
    compliant: number;
    non_compliant: number;
    awaiting_review: number;
    not_filed: number;
    overdue: number;
    compliance_rate: number;
  }[];
  overdue: { id: number; barangay: string; category: string; due_date: string }[];
};

function ReportsTab() {
  const { user } = useAuth();
  const periods = useFetch<{ data: Period[] }>(user ? "/api/reports/periods" : null);
  const [period, setPeriod] = useState("");
  const qs = period ? `?period_label=${encodeURIComponent(period)}` : "";
  const { data: report, loading, reload } = useFetch<ComplianceReport>(user ? `/api/reports/compliance${qs}` : null);

  const periodList = Array.isArray(periods.data) ? periods.data : (periods.data?.data ?? []);

  return (
    <div className="space-y-6">
      {/* Period Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Filing Cycle:
          </span>
          <select
            className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 w-48 transition"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="" className="bg-white dark:bg-[#1E293B]">Latest active period</option>
            {periodList.map((p) => (
              <option key={p.period_label} value={p.period_label} className="bg-white dark:bg-[#1E293B]">
                {p.period_label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <a
            href={apiUrl(`/api/reports/compliance/export${qs}`)}
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#002B7F] transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0F172A]/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading compliance reports...</span>
        </div>
      ) : !report ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80">
          <p className="text-sm text-slate-500 dark:text-slate-400">No compliance data available for this cycle.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Compliance Rate"
              value={`${report.totals?.compliance_rate ?? 0}%`}
              subtext="Compliant vs total due"
              accent="emerald"
            />
            <KpiCard
              label="Filing Rate"
              value={`${report.totals?.filing_rate ?? 0}%`}
              subtext="Submissions received"
              accent="blue"
            />
            <KpiCard
              label="Awaiting Review"
              value={report.totals?.under_review ?? 0}
              subtext="Pending supervisor sign-off"
              accent="amber"
            />
            <KpiCard
              label="Overdue Submissions"
              value={report.totals?.overdue ?? 0}
              subtext="Action required"
              accent="red"
            />
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Barangay Filing Standing — {report.period_label || "Current Period"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Barangay</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Total</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-emerald-600 dark:text-emerald-400">Compliant</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-rose-600 dark:text-rose-400">Needs Fixing</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-red-600 dark:text-red-400">Overdue</th>
                    <th scope="col" className="px-6 py-3.5">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {report.by_barangay.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">No records found.</td>
                    </tr>
                  ) : (
                    report.by_barangay.map((row) => (
                      <tr key={row.barangay.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                          {row.barangay.name}
                        </td>
                        <td className="px-4 py-3.5 text-center tabular-nums font-semibold">{row.total}</td>
                        <td className="px-4 py-3.5 text-center tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{row.compliant}</td>
                        <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-rose-600 dark:text-rose-400">{row.non_compliant}</td>
                        <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-red-600 dark:text-red-400">{row.overdue}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${row.compliance_rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{row.compliance_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* PPAs Tab — Makati City Programs, Projects & Activities (Bagwis)    */
/* ================================================================== */

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

type PpaFormModalProps = {
  ppa?: BagwisPpa | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function PpaFormModal({ ppa, isOpen, onClose, onSuccess }: PpaFormModalProps) {
  const [name, setName] = useState(ppa?.name ?? "");
  const [frequency, setFrequency] = useState(ppa?.frequency ?? "Quarterly");
  const [responsibleOffice, setResponsibleOffice] = useState(ppa?.responsible_office ?? "");
  const [deadlineDescription, setDeadlineDescription] = useState(ppa?.deadline_description ?? "");
  const [description, setDescription] = useState(ppa?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !responsibleOffice.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("frequency", frequency);
      fd.append("responsible_office", responsibleOffice.trim());
      if (deadlineDescription.trim()) fd.append("deadline_description", deadlineDescription.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (file) fd.append("attachment", file);

      if (ppa) {
        await apiSend(`/api/bagwis/ppas/${ppa.id}`, "POST", fd);
      } else {
        await apiSend("/api/bagwis/ppas", "POST", fd);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save program.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0039A6]/10 dark:bg-[#0039A6]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#0039A6] dark:text-[#93C5FD]">
              <span>🏛️</span> DILG Makati City Oversight
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {ppa ? "Edit Makati City Program / Directive" : "Upload & Publish Makati City Program"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Programs and uploaded guidelines will be available city-wide to all Makati barangays in view-only mode.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Name / Directive Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Makati BADAC Program Guidelines 2026"
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reporting Frequency <span className="text-rose-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semestral">Semestral</option>
                <option value="Annual">Annual</option>
                <option value="Weekly">Weekly</option>
                <option value="Ad Hoc">Ad Hoc / As Needed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsible Office / Council <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responsibleOffice}
                onChange={(e) => setResponsibleOffice(e.target.value)}
                placeholder="e.g. CADAC / DILG Makati / PNP"
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Submission Deadline / Target Schedule
            </label>
            <input
              type="text"
              value={deadlineDescription}
              onChange={(e) => setDeadlineDescription(e.target.value)}
              placeholder="e.g. Tuwing ika-5 ng buwan kasunod ng bawat quarter"
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Description &amp; Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, objectives, and compliance requirements for Makati barangays..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 resize-none"
            />
          </div>

          {/* Guideline Document Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Makati City Guideline Document / Memorandum (PDF, DOCX, XLSX, max 25MB)
            </label>
            {ppa?.attachment_name && !file && (
              <div className="mb-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs text-purple-700 dark:text-purple-300">
                <span className="flex items-center gap-2 truncate">
                  <span>📄</span>
                  <span className="font-semibold truncate">{ppa.attachment_name}</span>
                  {ppa.attachment_size ? <span className="text-[11px] opacity-75">({formatBytes(ppa.attachment_size)})</span> : null}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200/60 dark:bg-purple-900/60 px-2 py-0.5 rounded-lg">Current File</span>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0039A6]/10 dark:file:bg-[#0039A6]/20 file:text-[#0039A6] dark:file:text-[#93C5FD] hover:file:bg-[#0039A6]/20 cursor-pointer"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Barangay representatives will be able to view and download this official guideline file.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] hover:bg-[#002B7F] px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              {busy ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading &amp; Publishing...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>{ppa ? "Save Changes" : "Publish Program & Upload Guideline"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PpasTab() {
  const { user } = useAuth();
  const isOffice = user ? ["super_admin", "office_supervisor"].includes(user.role) : false;
  const isBarangayRep = user?.role === "barangay_rep";
  const { data: ppas, loading, reload } = useFetch<BagwisPpa[]>(user ? "/api/bagwis/ppas" : null);

  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPpa, setEditingPpa] = useState<BagwisPpa | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // Quick guideline upload ref
  const quickFileRef = useRef<HTMLInputElement>(null);
  const [quickUploadTargetPpaId, setQuickUploadTargetPpaId] = useState<number | null>(null);
  const [quickUploadBusy, setQuickUploadBusy] = useState(false);

  function triggerQuickUpload(ppaId: number) {
    setQuickUploadTargetPpaId(ppaId);
    quickFileRef.current?.click();
  }

  async function handleQuickFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !quickUploadTargetPpaId) return;

    setQuickUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("attachment", selectedFile);
      await apiSend(`/api/bagwis/ppas/${quickUploadTargetPpaId}/attachment`, "POST", fd);
      setFlash({ kind: "ok", text: `Official guideline "${selectedFile.name}" uploaded successfully.` });
      reload();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Failed to upload guideline file." });
    } finally {
      setQuickUploadBusy(false);
      setQuickUploadTargetPpaId(null);
      if (e.target) e.target.value = "";
    }
  }

  async function handleDeletePpa(ppa: BagwisPpa) {
    if (!confirm(`Are you sure you want to delete "${ppa.name}"? This will also remove its associated compliance records.`)) return;
    try {
      await apiSend(`/api/bagwis/ppas/${ppa.id}`, "DELETE");
      setFlash({ kind: "ok", text: `Program "${ppa.name}" removed successfully.` });
      reload();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Failed to remove program." });
    }
  }

  const filteredPpas = useMemo(() => {
    if (!ppas) return [];
    return ppas.filter((p) => {
      const matchesSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.responsible_office.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchesFreq =
        frequencyFilter === "all" || p.frequency.toLowerCase() === frequencyFilter.toLowerCase();

      return matchesSearch && matchesFreq;
    });
  }, [ppas, search, frequencyFilter]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0F172A]/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading Makati PPAs...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Hidden file input for supervisor quick upload */}
      <input
        ref={quickFileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleQuickFileChange}
      />

      {/* Program Create/Edit Modal */}
      <PpaFormModal
        ppa={editingPpa}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPpa(null);
        }}
        onSuccess={() => {
          setFlash({ kind: "ok", text: editingPpa ? "Program updated successfully." : "Makati program and guideline published successfully." });
          reload();
        }}
      />

      {/* Flash Notice */}
      {flash && (
        <div
          className={`rounded-2xl px-5 py-3 text-xs font-semibold flex items-center justify-between shadow-sm ${
            flash.kind === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{flash.kind === "ok" ? "✓" : "⚠️"}</span>
            <span>{flash.text}</span>
          </div>
          <button onClick={() => setFlash(null)} className="underline text-[11px] opacity-80 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Supervisor Authority Banner */}
      {isOffice ? (
        <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-bold text-[#0039A6] dark:text-blue-300">
              <span>🛡️</span> DILG Supervisor Authority &bull; Makati City Oversight
            </div>
            <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Makati City Programs, Projects &amp; Activities (PPAs)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
              You have supervisor power to upload, publish, and maintain city-level programs, memos, and toolkits.
              Barangay representatives have view-only and download access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPpa(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#0039A6] hover:bg-[#002B7F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Makati Program</span>
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <span>👁</span> View Only &bull; Download Guidelines
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              Makati City Programs, Projects &amp; Activities (PPAs)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official programs and policies monitored across Makati City. You can view schedules and download published guidelines.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "Monthly", "Quarterly", "Semestral", "Annual"].map((freq) => (
            <button
              key={freq}
              onClick={() => setFrequencyFilter(freq)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                frequencyFilter === freq
                  ? "bg-[#0039A6] text-white shadow-sm"
                  : "bg-white/80 dark:bg-[#0F172A]/80 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {freq === "all" ? "All Cycles" : freq}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search programs, offices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-white/15 bg-white/90 dark:bg-[#0F172A]/90 px-3.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20"
          />
          <button
            onClick={() => reload()}
            title="Refresh list"
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* PPA List / Cards Grid */}
      {filteredPpas.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/15 bg-white/60 dark:bg-[#0F172A]/60">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-2xl">
            🎯
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No Makati programs found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {search ? "No programs match your search criteria." : "No city programs currently published."}
          </p>
          {isOffice && (
            <button
              onClick={() => {
                setEditingPpa(null);
                setModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#002B7F] transition"
            >
              + Upload Makati Program Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPpas.map((ppa) => (
            <div
              key={ppa.id}
              className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 p-5 shadow-sm transition-all hover:border-[#0039A6]/40 dark:hover:border-[#0039A6]/40 flex flex-col justify-between"
            >
              <div>
                {/* Header row: frequency + office actions */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-[#0039A6]/10 dark:bg-[#0039A6]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#0039A6] dark:text-[#93C5FD] uppercase tracking-wider">
                      {ppa.frequency}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {ppa.responsible_office}
                    </span>
                  </div>

                  {isOffice && (
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit program details"
                        onClick={() => {
                          setEditingPpa(ppa);
                          setModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-[#0039A6] hover:bg-slate-100 dark:hover:bg-white/5 transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        title="Delete program"
                        onClick={() => handleDeletePpa(ppa)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {ppa.name}
                </h3>
                {ppa.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {ppa.description}
                  </p>
                )}

                {/* Schedule/Deadline */}
                {ppa.deadline_description && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-white/5 p-2 rounded-xl">
                    <span className="text-[#0039A6]">📅</span>
                    <span className="truncate">{ppa.deadline_description}</span>
                  </div>
                )}

                {/* Guideline / City File Attachment Zone */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
                  {ppa.attachment_name ? (
                    <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 text-sm">
                            📄
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {ppa.attachment_name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Official Guideline &bull; {formatBytes(ppa.attachment_size)}
                            </p>
                          </div>
                        </div>

                        {/* Download link accessible to all (including barangays) */}
                        <a
                          href={apiUrl(`/api/bagwis/ppas/${ppa.id}/download`)}
                          download
                          title="Download guideline document"
                          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download</span>
                        </a>
                      </div>

                      {/* Supervisor quick replace option */}
                      {isOffice && (
                        <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/30 flex justify-end">
                          <button
                            type="button"
                            disabled={quickUploadBusy}
                            onClick={() => triggerQuickUpload(ppa.id)}
                            className="text-[10px] font-semibold text-[#0039A6] dark:text-[#93C5FD] hover:underline"
                          >
                            Replace Guideline File
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {isOffice ? (
                        <button
                          type="button"
                          disabled={quickUploadBusy}
                          onClick={() => triggerQuickUpload(ppa.id)}
                          className="w-full rounded-2xl border border-dashed border-[#0039A6]/40 dark:border-[#0039A6]/40 bg-[#0039A6]/5 dark:bg-[#0039A6]/10 p-3 text-center text-xs font-semibold text-[#0039A6] dark:text-[#93C5FD] hover:bg-[#0039A6]/15 transition flex items-center justify-center gap-1.5"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>+ Upload City Guideline File (PDF/DOC)</span>
                        </button>
                      ) : (
                        <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
                          Official guideline document pending upload by DILG Supervisor
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Creator & Entries indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span>🏛️</span>
                  <span>{ppa.creator?.name ?? "DILG Makati"}</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {ppa.entries_count ?? 0} compliance cycle{(ppa.entries_count ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail accordion view per PPA for periodic tracking */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Makati City PPA Periodic Tracking &amp; Compliance Logs
          </h3>
          <span className="text-[11px] text-slate-500">
            {isOffice ? "Supervisors record & review cycle compliance" : "View-only compliance archive"}
          </span>
        </div>

        {filteredPpas.map((ppa) => (
          <PpaDetail key={ppa.id} ppa={ppa} isOffice={isOffice} onPpaUpdated={reload} />
        ))}
      </div>
    </div>
  );
}

function PpaDetail({
  ppa,
  isOffice,
  onPpaUpdated,
}: {
  ppa: BagwisPpa;
  isOffice: boolean;
  onPpaUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: entriesRes, loading, reload } = useFetch<{ data: BagwisPpaEntry[] }>(
    expanded ? `/api/bagwis/ppas/${ppa.id}/entries` : null
  );

  const entries = useMemo(() => {
    return Array.isArray(entriesRes) ? entriesRes : (entriesRes?.data ?? []);
  }, [entriesRes]);

  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  /* Add entry form state */
  const [showForm, setShowForm] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("");
  const [status, setStatus] = useState<"pending" | "submitted" | "compliant" | "non_compliant">("submitted");
  const [remarks, setRemarks] = useState("");
  const [entryFile, setEntryFile] = useState<File | null>(null);

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault();
    if (!periodLabel.trim()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("period_label", periodLabel.trim());
      fd.append("status", status);
      if (remarks.trim()) fd.append("remarks", remarks.trim());
      if (entryFile) fd.append("attachment", entryFile);

      await apiSend(`/api/bagwis/ppas/${ppa.id}/entries`, "POST", fd);
      setFlash({ kind: "ok", text: `Entry recorded for ${periodLabel}.` });
      setPeriodLabel("");
      setRemarks("");
      setEntryFile(null);
      setShowForm(false);
      reload();
      onPpaUpdated();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Failed to record entry." });
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(entryId: number, reviewStatus: "compliant" | "non_compliant") {
    setBusy(true);
    try {
      await apiSend(`/api/bagwis/ppa-entries/${entryId}/review`, "PATCH", { status: reviewStatus });
      setFlash({ kind: "ok", text: `Entry marked as ${reviewStatus.replace("_", " ")}.` });
      reload();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Review failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0039A6]/10 text-[#0039A6] dark:text-[#93C5FD] text-lg font-bold">
            🎯
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{ppa.name}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {ppa.frequency} &bull; {ppa.responsible_office}
              {ppa.attachment_name ? " &bull; 📄 Guideline Attached" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {ppa.attachment_name && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <span>✓</span> Guideline Ready
            </span>
          )}
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/5 px-5 py-5 bg-slate-50/30 dark:bg-black/10 space-y-4">
          {flash && (
            <div className={`rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
              flash.kind === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
            }`}>
              <span>{flash.text}</span>
              <button onClick={() => setFlash(null)} className="underline underline-offset-4 text-[10px]">Dismiss</button>
            </div>
          )}

          {/* Guideline Banner in Details */}
          {ppa.attachment_name && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📄</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Official Guideline: {ppa.attachment_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    File Size: {formatBytes(ppa.attachment_size)} &bull; Uploaded for city-wide barangay compliance
                  </p>
                </div>
              </div>
              <a
                href={apiUrl(`/api/bagwis/ppas/${ppa.id}/download`)}
                download
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#002B7F] transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Guideline</span>
              </a>
            </div>
          )}

          {/* Office Supervisor Add Entry Form */}
          {isOffice && (
            <div>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002B7F] transition-colors shadow-sm"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel Entry" : "+ Record Period Compliance Entry"}
              </button>

              {showForm && (
                <form onSubmit={handleAddEntry} className="mt-3 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Record New Period Entry for {ppa.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs">
                      <span className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Period Label <span className="text-rose-500">*</span></span>
                      <input
                        className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 w-full"
                        required
                        placeholder="e.g. 2026-Q1 or 2026-OCTOBER"
                        value={periodLabel}
                        onChange={(e) => setPeriodLabel(e.target.value)}
                      />
                    </label>

                    <label className="text-xs">
                      <span className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Initial Status</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 w-full"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="compliant">Compliant</option>
                        <option value="non_compliant">Non-compliant</option>
                      </select>
                    </label>
                  </div>

                  <label className="text-xs block">
                    <span className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Remarks / Evaluation Notes</span>
                    <input
                      className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 w-full"
                      placeholder="Optional assessment / remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>

                  <div>
                    <span className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">Optional MOV / Evidence Document</span>
                    <input
                      type="file"
                      onChange={(e) => setEntryFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-white/10 file:text-slate-700 dark:file:text-slate-200"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-[#0039A6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B7F] transition-colors disabled:opacity-50"
                    >
                      {busy ? "Saving Entry..." : "Save Period Entry"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Entries table */}
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Loading entries...</p>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No periodic entries recorded yet for this program. {isOffice ? 'Click "+ Record Period Compliance Entry" above to add one.' : ""}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-xs">
              <table className="w-full min-w-[650px] text-left text-xs bg-white dark:bg-[#0F172A]">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">Period</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Submitted</th>
                    <th scope="col" className="px-4 py-3">Reviewed</th>
                    <th scope="col" className="px-4 py-3">Attachment</th>
                    <th scope="col" className="px-4 py-3">Remarks</th>
                    {isOffice && <th scope="col" className="px-4 py-3 text-right">Supervisor Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{entry.period_label}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PPA_STATUS_COLORS[entry.status] ?? PPA_STATUS_COLORS.pending}`}>
                          {entry.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                        {entry.submitted_at ? formatDate(entry.submitted_at) : "—"}
                        {entry.submitter && <span className="text-slate-400 ml-1">({entry.submitter.name})</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                        {entry.reviewed_at ? formatDate(entry.reviewed_at) : "—"}
                        {entry.reviewer && <span className="text-slate-400 ml-1">({entry.reviewer.name})</span>}
                      </td>
                      <td className="px-4 py-3">
                        {entry.attachment_name ? (
                          <a
                            href={apiUrl(`/api/bagwis/ppa-entries/${entry.id}/download`)}
                            download
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0039A6] dark:text-[#93C5FD] hover:underline"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-[120px]" title={entry.attachment_name}>
                              {entry.attachment_name}
                            </span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={entry.remarks ?? ""}>
                        {entry.remarks ?? "—"}
                      </td>
                      {isOffice && (
                        <td className="px-4 py-3 text-right">
                          {entry.status === "submitted" || entry.status === "pending" ? (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                className="rounded-lg bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                disabled={busy}
                                onClick={() => handleReview(entry.id, "compliant")}
                              >
                                ✓ Compliant
                              </button>
                              <button
                                className="rounded-lg bg-rose-100 dark:bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                                disabled={busy}
                                onClick={() => handleReview(entry.id, "non_compliant")}
                              >
                                ✗ Non-compliant
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              {entry.status.replace("_", " ")}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Security Tab — City-Level Threat Telemetry                          */
/* ================================================================== */

type SecuritySummary = {
  total: number;
  open: number;
  unacknowledged_over_24h: number;
  avg_hours_to_acknowledge: number | null;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
};

type SecurityIncident = {
  id: number;
  type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
  reporter?: { id: number; name: string } | null;
  barangay?: { id: number; name: string } | null;
};

function SecurityTab() {
  const { user } = useAuth();
  const { data: summary, loading, reload } = useFetch<SecuritySummary>(user ? "/api/reports/security" : null);
  const { data: incidentsRes, reload: reloadIncidents } = useFetch<{ data: SecurityIncident[] }>(user ? "/api/security-incidents?per_page=10" : null);

  const incidents = useMemo(() => {
    return Array.isArray(incidentsRes) ? incidentsRes : (incidentsRes?.data ?? []);
  }, [incidentsRes]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0F172A]/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading security telemetry...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <KpiCard label="Total Incidents" value={summary.total} accent="slate" subtext="Logged across city" />
          <KpiCard label="Active / Open" value={summary.open} accent="amber" subtext="Under investigation" />
          <KpiCard label="Unanswered >24h" value={summary.unacknowledged_over_24h} accent="rose" subtext="SLA critical threshold" />
          <KpiCard
            label="Avg Response"
            value={summary.avg_hours_to_acknowledge != null ? `${summary.avg_hours_to_acknowledge.toFixed(1)}h` : "N/A"}
            accent="blue"
            subtext="Hours to acknowledge"
          />
        </div>
      )}

      {/* Incident list */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security Telemetry</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              City-wide incidents reported by barangays and personnel
            </p>
          </div>
          <button
            onClick={() => { reload(); reloadIncidents(); }}
            className="text-xs font-semibold text-[#0039A6] dark:text-[#93C5FD] hover:underline"
          >
            Refresh
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No incidents logged in the system.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="px-6 py-3.5 flex flex-wrap items-center gap-3 text-sm hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  inc.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                  : inc.severity === "high" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                  : inc.severity === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                }`}>
                  {inc.severity}
                </span>

                <span className="font-semibold text-slate-900 dark:text-white capitalize text-xs">
                  {inc.type.replace(/_/g, " ")}
                </span>

                {inc.reporter && (
                  <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    {inc.reporter.name}
                  </span>
                )}

                <span className="flex-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                  {inc.description}
                </span>

                <span className="text-xs text-slate-400 tabular-nums">
                  {formatDate(inc.created_at)}
                </span>

                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  inc.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : inc.status === "acknowledged" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : inc.status === "escalated_to_icto" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                }`}>
                  {inc.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Shared KPI Card Component                                           */
/* ================================================================== */

function KpiCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent: string;
}) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    emerald: {
      bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200/80 dark:border-emerald-800/40",
    },
    blue: {
      bg: "bg-blue-50/70 dark:bg-blue-950/20",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200/80 dark:border-blue-800/40",
    },
    amber: {
      bg: "bg-amber-50/70 dark:bg-amber-950/20",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200/80 dark:border-amber-800/40",
    },
    rose: {
      bg: "bg-rose-50/70 dark:bg-rose-950/20",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-200/80 dark:border-rose-800/40",
    },
    red: {
      bg: "bg-red-50/70 dark:bg-red-950/20",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200/80 dark:border-red-800/40",
    },
    slate: {
      bg: "bg-white/80 dark:bg-white/5",
      text: "text-slate-900 dark:text-white",
      border: "border-slate-200/80 dark:border-white/10",
    },
  };

  const current = styles[accent] ?? styles.slate;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:scale-[1.01] ${current.bg} ${current.border}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black tracking-tight tabular-nums ${current.text}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
