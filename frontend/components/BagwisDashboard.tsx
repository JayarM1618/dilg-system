"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";
import { apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import BagwisReadOnlyBanner from "@/components/BagwisReadOnlyBanner";
import StatusBadge from "@/components/StatusBadge";
import type { TalaghayanRow } from "@/types";

interface Summary {
  total_barangays: number;
  pending: number;
  submitted: number;
  under_review?: number;
  compliant: number;
  non_compliant: number;
}

interface Period {
  period_label: string;
  period_start: string;
  due_date: string;
}

interface CategoryCompliance {
  barangay: { id: number; name: string; code: string };
  total: number;
  compliant: number;
  non_compliant: number;
  awaiting_review: number;
  not_filed: number;
  overdue: number;
  compliance_rate: number;
}

interface ComplianceReportData {
  period_label: string;
  totals: {
    total: number;
    pending: number;
    submitted: number;
    compliant: number;
    non_compliant: number;
    under_review?: number;
    compliance_rate: number;
    filing_rate: number;
  };
  by_barangay: CategoryCompliance[];
}

interface SecuritySummary {
  total?: number;
  open?: number;
  resolved?: number;
}

interface SecurityIncident {
  id: number;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "acknowledged" | "investigating" | "resolved" | "escalated_to_icto";
  created_at: string;
  description?: string;
  barangay?: { id: number; name: string };
}

type Tab = "matrix" | "reports" | "security";

export default function BagwisDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("matrix");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const isBarangayRep = user?.role === "barangay_rep";
  const userBarangayId = user?.barangay_id;

  // Real-time city-level endpoints
  const grid = useApi<{ data: TalaghayanRow[] }>("/api/dashboard/talaghayan", { pollInterval: 8000 });
  const totals = useApi<Summary>("/api/dashboard/summary", { pollInterval: 8000 });
  const periods = useFetch<{ data: Period[] }>("/api/reports/periods");

  const qs = selectedPeriod ? `?period_label=${encodeURIComponent(selectedPeriod)}` : "";
  const compliance = useFetch<ComplianceReportData>(`/api/reports/compliance${qs}`, { pollInterval: 10000 });
  const security = useFetch<SecuritySummary>("/api/reports/security", { pollInterval: 12000 });
  const incidents = useFetch<{ data: SecurityIncident[] }>("/api/security-incidents", { pollInterval: 15000 });

  const rows = grid.data?.data ?? [];
  const summary = totals.data;
  const loading = grid.loading || totals.loading;
  const error = grid.error ?? totals.error;

  const currentPeriodLabel = compliance.data?.period_label ?? selectedPeriod;

  // Filtered rows for the 23 barangays matrix
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch =
        r.barangay.name.toLowerCase().includes(search.toLowerCase()) ||
        r.barangay.code.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;

      // Status based on compliance rate
      if (statusFilter === "compliant") return r.compliance_rate >= 80;
      if (statusFilter === "pending") return r.compliance_rate < 80 && r.compliance_rate > 0;
      if (statusFilter === "non_compliant") return r.compliance_rate === 0;

      return true;
    });
  }, [rows, search, statusFilter]);

  const overallRate = useMemo(() => {
    if (!summary || summary.total_barangays === 0) return 0;
    const total = summary.compliant + summary.submitted + summary.pending + summary.non_compliant;
    if (total === 0) return 0;
    return Math.round((summary.compliant / total) * 100);
  }, [summary]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── City-Level Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1B1235] dark:text-white">
              Bagwis
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              City of Makati &bull; DILG Oversight
            </span>
            {isBarangayRep && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                View Only
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-[#C9BCEB]">
            Makati City-wide compliance metrics, inter-barangay reporting standing, and security status.
          </p>
        </div>

        {/* Action button for office staff */}
        {!isBarangayRep && currentPeriodLabel && (
          <a
            href={apiUrl(`/api/reports/compliance/export?period_label=${encodeURIComponent(currentPeriodLabel)}`)}
            download
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-white/15 shadow-sm transition-all hover:border-[#7B4DFF] hover:text-[#7B4DFF] dark:hover:text-[#CDBBFF]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Export City Compliance (.csv)</span>
          </a>
        )}
      </div>

      {/* ── View-Only Banner for Barangay Representative ── */}
      {isBarangayRep && <BagwisReadOnlyBanner />}

      {/* ── Makati City KPI Overview ── */}
      {summary && (
        <section aria-label="Makati City compliance summary" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#7C6FA3]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Barangays</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#7B4DFF]/15 text-[#5A18C9] dark:text-[#CDBBFF]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1B1235] dark:text-white">
              {summary.total_barangays}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Active Makati Units</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Compliant</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {summary.compliant}
            </p>
            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">{overallRate}% City Rate</p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Submitted</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
              {summary.submitted + (summary.under_review ?? 0)}
            </p>
            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">Under DILG Review</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">
              {summary.pending}
            </p>
            <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">Awaiting Submission</p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 p-4 sm:p-5 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Non-Compliant</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-700 dark:text-rose-300">
              {summary.non_compliant}
            </p>
            <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">Need Attention</p>
          </div>
        </section>
      )}

      {/* ── Bagwis Navigation Sub-tabs ── */}
      <nav aria-label="Bagwis navigation" className="flex items-center gap-2 overflow-x-auto scrollbar-none rounded-2xl bg-slate-100/80 dark:bg-black/30 p-1.5 border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "matrix"
              ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/15"
              : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>Makati Barangays Matrix ({rows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "reports"
              ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/15"
              : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>City Compliance Cycles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "security"
              ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/15"
              : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>City Security &amp; Audit</span>
        </button>
      </nav>

      {/* ── TAB 1: MAKATI BARANGAYS MATRIX ── */}
      {activeTab === "matrix" && (
        <section aria-labelledby="barangay-matrix-title" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="barangay-matrix-title" className="text-lg font-bold text-[#1B1235] dark:text-white">
                Makati City Barangays Compliance Status
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#C9BCEB]">
                Real-time compliance tracking across all 23 barangays of Makati City.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search barangay..."
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#201835] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#7B4DFF]"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#201835] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7B4DFF]"
              >
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant (&ge;80%)</option>
                <option value="pending">In Progress</option>
                <option value="non_compliant">Non-compliant (0%)</option>
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                    <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7C6FA3]">Barangay</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7C6FA3]">Compliance Rate</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7C6FA3]">Submissions Status</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7C6FA3] text-right">Access Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        Loading Makati barangays tally...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-rose-500 font-medium">
                        {error}
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        No barangays match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => {
                      const isOwnBarangay = userBarangayId === r.barangay.id;
                      const rate = r.compliance_rate;
                      const isHigh = rate >= 80;
                      const isMid = rate > 0 && rate < 80;

                      return (
                        <tr
                          key={r.barangay.id}
                          className={`transition-colors ${
                            isOwnBarangay
                              ? "bg-[#7B4DFF]/10 dark:bg-[#7B4DFF]/20 font-medium"
                              : "hover:bg-slate-50/50 dark:hover:bg-white/5"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{r.barangay.name}</span>
                                  {isOwnBarangay && (
                                    <span className="rounded-full bg-[#7B4DFF] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                      Your Barangay
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400">{r.barangay.code}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isHigh ? "bg-emerald-500" : isMid ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${
                                isHigh ? "text-emerald-600 dark:text-emerald-400" : isMid ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                              }`}>
                                {rate}%
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {r.submissions.length === 0 ? (
                                <span className="text-xs text-slate-400">No submissions filed yet</span>
                              ) : (
                                r.submissions.slice(0, 3).map((s, idx) => (
                                  <StatusBadge key={`${s.category}-${idx}`} status={s.status} label={s.category} />
                                ))
                              )}
                              {r.submissions.length > 3 && (
                                <span className="text-[11px] text-slate-400 font-medium self-center">
                                  +{r.submissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {isBarangayRep ? (
                              <span className="inline-flex rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                                View Only
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-purple-100 dark:bg-[#7B4DFF]/20 px-2.5 py-1 text-xs font-semibold text-[#5A18C9] dark:text-[#CDBBFF]">
                                City Oversight
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── TAB 2: CITY COMPLIANCE CYCLES ── */}
      {activeTab === "reports" && (
        <section aria-labelledby="reports-title" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="reports-title" className="text-lg font-bold text-[#1B1235] dark:text-white">
                Makati City Compliance Cycles &amp; Deadlines
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#C9BCEB]">
                View compliance performance per reporting period across Makati City.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-[#7C6FA3]">Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#201835] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7B4DFF]"
              >
                <option value="">Latest Reporting Period</option>
                {periods.data?.data.map((p) => (
                  <option key={p.period_label} value={p.period_label}>
                    {p.period_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Summary Card */}
          {compliance.data && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7B4DFF] dark:text-[#CDBBFF]">Cycle Details</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{compliance.data.period_label || "All Active Periods"}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    City Filing Rate: <strong className="text-slate-900 dark:text-white">{compliance.data.totals.filing_rate}%</strong>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Compliance Rate: <strong className="text-emerald-600 dark:text-emerald-400">{compliance.data.totals.compliance_rate}%</strong>
                  </span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] border-b border-slate-100 dark:border-white/5">
                      <th className="py-2.5">Barangay</th>
                      <th className="py-2.5">Required</th>
                      <th className="py-2.5">Compliant</th>
                      <th className="py-2.5">Awaiting Review</th>
                      <th className="py-2.5">Pending / Overdue</th>
                      <th className="py-2.5 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {compliance.data.by_barangay.slice(0, 15).map((b) => (
                      <tr key={b.barangay.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">{b.barangay.name}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">{b.total}</td>
                        <td className="py-2.5 text-emerald-600 font-semibold">{b.compliant}</td>
                        <td className="py-2.5 text-blue-600">{b.awaiting_review}</td>
                        <td className="py-2.5 text-amber-600">{b.not_filed}</td>
                        <td className="py-2.5 text-right font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">{b.compliance_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── TAB 3: CITY SECURITY & INCIDENT AUDIT ── */}
      {activeTab === "security" && (
        <section aria-labelledby="security-title" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="security-title" className="text-lg font-bold text-[#1B1235] dark:text-white">
                Makati City Security &amp; Audit Logs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#C9BCEB]">
                City-wide incident monitoring and transaction security for DILG Makati operations.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Security Gateway Active
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]">
              Recorded City Incidents &amp; Alerts
            </h3>

            {incidents.data?.data && incidents.data.data.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {incidents.data.data.map((inc) => (
                  <div key={inc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{inc.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {inc.barangay ? `Barangay ${inc.barangay.name}` : "City Wide"} &bull; {formatDate(inc.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-bold capitalize text-slate-600 dark:text-slate-300 self-start sm:self-center">
                      {inc.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-sm">
                No active security incidents recorded in Makati City. System operating normally.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
