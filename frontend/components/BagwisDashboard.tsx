"use client";

import { useState, useMemo, type FormEvent } from "react";
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
        <div className="inline-flex p-1.5 rounded-2xl bg-white/90 dark:bg-[#181126]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                tab === t.key
                  ? "bg-gradient-to-r from-[#7B4DFF] to-[#9254DE] text-white shadow-md shadow-[#7B4DFF]/30 font-bold"
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
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181126]/90 shadow-sm overflow-hidden">
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
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] pl-8 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20 w-52 sm:w-64 transition"
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
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
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
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
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
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7B4DFF]/10 text-[#7B4DFF] dark:text-[#CDBBFF] text-xs font-bold">
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#181126]/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Filing Cycle:
          </span>
          <select
            className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3.5 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20 w-48 transition"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="" className="bg-white dark:bg-[#2B2542]">Latest active period</option>
            {periodList.map((p) => (
              <option key={p.period_label} value={p.period_label} className="bg-white dark:bg-[#2B2542]">
                {p.period_label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <a
            href={apiUrl(`/api/reports/compliance/export${qs}`)}
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B4DFF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#181126]/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading compliance reports...</span>
        </div>
      ) : !report ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#181126]/80">
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
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181126]/90 shadow-sm overflow-hidden">
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
/* PPAs Tab — 6 Bagwis city-level programs from the PDF architecture   */
/* ================================================================== */

function PpasTab() {
  const { user } = useAuth();
  const isOffice = user ? ["super_admin", "office_supervisor"].includes(user.role) : false;
  const { data: ppas, loading, reload } = useFetch<BagwisPpa[]>(user ? "/api/bagwis/ppas" : null);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#181126]/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading Makati PPAs...</span>
      </div>
    );

  if (!ppas || ppas.length === 0)
    return (
      <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#181126]/80">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No city-level PPAs loaded.
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#181126]/80 backdrop-blur-md shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🎯</span> Makati City Programs, Projects &amp; Activities (PPAs)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Standard programs monitored city-wide by DILG Makati and partner governance bodies.
        </p>
      </div>

      {/* PPA overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ppas.map((ppa) => (
          <div
            key={ppa.id}
            className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181126]/90 p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/20"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7B4DFF]/10 text-[#7B4DFF] dark:text-[#CDBBFF] text-base font-bold">
                🎯
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{ppa.name}</h3>
                {ppa.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ppa.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#7B4DFF]/10 dark:bg-[#7B4DFF]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#7B4DFF] dark:text-[#CDBBFF] uppercase tracking-wider">
                    {ppa.frequency}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {ppa.responsible_office}
                  </span>
                </div>
                {ppa.deadline_description && (
                  <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>📅</span> {ppa.deadline_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail accordion view per PPA */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          PPA Periodic Tracking &amp; Compliance Records
        </h3>
        {ppas.map((ppa) => (
          <PpaDetail key={ppa.id} ppa={ppa} isOffice={isOffice} />
        ))}
      </div>
    </div>
  );
}

function PpaDetail({ ppa, isOffice }: { ppa: BagwisPpa; isOffice: boolean }) {
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
  const [remarks, setRemarks] = useState("");

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault();
    if (!periodLabel.trim()) return;
    setBusy(true);
    try {
      await apiSend(`/api/bagwis/ppas/${ppa.id}/entries`, "POST", {
        period_label: periodLabel.trim(),
        status: "submitted",
        remarks: remarks.trim() || null,
      });
      setFlash({ kind: "ok", text: `Entry added for ${periodLabel}.` });
      setPeriodLabel("");
      setRemarks("");
      setShowForm(false);
      reload();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Failed to add entry." });
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(entryId: number, status: "compliant" | "non_compliant") {
    setBusy(true);
    try {
      await apiSend(`/api/bagwis/ppa-entries/${entryId}/review`, "PATCH", { status });
      setFlash({ kind: "ok", text: `Entry marked as ${status.replace("_", " ")}.` });
      reload();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Review failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181126]/90 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">🎯</span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ppa.name}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {ppa.frequency} &bull; {ppa.responsible_office}
            </span>
          </div>
        </div>
        <svg
          className={`flex-shrink-0 h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/5 px-5 py-4 bg-slate-50/30 dark:bg-black/10">
          {flash && (
            <div className={`mb-3 rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
              flash.kind === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
            }`}>
              <span>{flash.text}</span>
              <button onClick={() => setFlash(null)} className="underline underline-offset-4 text-[10px]">Dismiss</button>
            </div>
          )}

          {isOffice && (
            <div className="mb-4">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B4DFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6A3CF0] transition-colors"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel" : "+ Record Period Entry"}
              </button>

              {showForm && (
                <form onSubmit={handleAddEntry} className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] flex flex-wrap gap-3 items-end">
                  <label className="text-xs">
                    <span className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Period Label</span>
                    <input
                      className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20 w-44"
                      required
                      placeholder="e.g. 2024-Q3 or 2024-ANNUAL"
                      value={periodLabel}
                      onChange={(e) => setPeriodLabel(e.target.value)}
                    />
                  </label>
                  <label className="text-xs flex-1 min-w-[200px]">
                    <span className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Remarks</span>
                    <input
                      className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20 w-full"
                      placeholder="Optional assessment / remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-[#7B4DFF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6A3CF0] transition-colors disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Save Entry"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Entries table */}
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              No entries recorded yet. {isOffice ? 'Click "+ Record Period Entry" to add one.' : ""}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10">
              <table className="w-full min-w-[550px] text-left text-xs bg-white dark:bg-[#181126]">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Period</th>
                    <th scope="col" className="px-4 py-2.5">Status</th>
                    <th scope="col" className="px-4 py-2.5">Submitted</th>
                    <th scope="col" className="px-4 py-2.5">Reviewed</th>
                    <th scope="col" className="px-4 py-2.5">Remarks</th>
                    {isOffice && <th scope="col" className="px-4 py-2.5 text-right">Office Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{entry.period_label}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PPA_STATUS_COLORS[entry.status] ?? PPA_STATUS_COLORS.pending}`}>
                          {entry.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 tabular-nums">
                        {entry.submitted_at ? formatDate(entry.submitted_at) : "—"}
                        {entry.submitter && <span className="text-slate-400 ml-1">({entry.submitter.name})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 tabular-nums">
                        {entry.reviewed_at ? formatDate(entry.reviewed_at) : "—"}
                        {entry.reviewer && <span className="text-slate-400 ml-1">({entry.reviewer.name})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{entry.remarks ?? "—"}</td>
                      {isOffice && (
                        <td className="px-4 py-2.5 text-right">
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
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#181126]/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
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
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181126]/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security Telemetry</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              City-wide incidents reported by barangays and personnel
            </p>
          </div>
          <button
            onClick={() => { reload(); reloadIncidents(); }}
            className="text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF] hover:underline"
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
