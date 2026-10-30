"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import ThreeRsTabs from "./ThreeRsTabs";
import BarangayReports from "./BarangayReports";
import SKReportsView from "./SKReportsView";
import ReportSetup from "./ReportSetup";
import SendRemindersModal from "@/components/supervisor/SendRemindersModal";
import ExecutiveComplianceSummaryModal from "@/components/supervisor/ExecutiveComplianceSummaryModal";
import {
  PageTitle,
  Pager,
  btn,
  btnGhost,
  field,
  formatDateTime,
  CYCLE_LABEL,
  SECTOR_ICON,
  Notice,
} from "./ui";
import type {
  AuditEntry,
  Category,
  ComplianceReport,
  Incident,
  Paged,
  Period,
  SecuritySummary,
} from "./types";

/* ================================================================== */
/* Main entry point                                                    */
/* ================================================================== */

export default function ReportsView() {
  const { user } = useAuth();
  const [sector, setSector] = useState<"all" | "barangay" | "sk" | "katarungang_pambarangay">("all");

  if (!user) return null;

  /* Barangay reps see their own filing dashboard */
  if (user.role === "barangay_rep") {
    return (
      <>
        <PageTitle
          title="Reports"
          subtitle="Submit your barangay's periodic reports, track filing deadlines, and monitor compliance status."
        />
        <ThreeRsTabs />

        {/* Sector filter tabs */}
        <div className="flex gap-1 rounded-full bg-slate-100 dark:bg-white/5 p-1 mb-6 overflow-x-auto">
          {([
            { key: "all", label: "All Reports", icon: "📋" },
            { key: "barangay", label: "Barangay", icon: "🏘️" },
            { key: "sk", label: "SK", icon: "🧑‍🤝‍🧑" },
            { key: "katarungang_pambarangay", label: "KP", icon: "⚖️" },
          ] as { key: typeof sector; label: string; icon: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setSector(t.key)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                sector === t.key
                  ? "bg-[#0039A6] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* SK view or standard Barangay filings */}
        {sector === "sk" ? (
          <SKReportsView />
        ) : (
          <BarangayReports sectorFilter={sector === "all" ? undefined : sector} />
        )}
      </>
    );
  }

  /* Office users: compliance overview with category catalogue */
  return (
    <>
      <PageTitle
        title="Reports"
        subtitle={
          user.role === "super_admin"
            ? "Full compliance oversight: review all barangay filings, manage report categories, and audit the system."
            : "Monitor barangay compliance, review incoming submissions, and track filing deadlines."
        }
      />
      <ThreeRsTabs />
      <OfficeDashboard />
    </>
  );
}

/* ================================================================== */
/* Office Dashboard                                                    */
/* ================================================================== */

type Tab = "compliance" | "categories" | "security" | "audit";

function OfficeDashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [tab, setTab] = useState<Tab>("compliance");

  const tabs: { key: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    {
      key: "compliance",
      label: "Compliance",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      show: true,
    },
    {
      key: "categories",
      label: "Report Categories",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      show: true,
    },
    {
      key: "security",
      label: "Security",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      show: true,
    },
    {
      key: "audit",
      label: "Audit Log",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      show: !!isSuperAdmin,
    },
  ];

  return (
    <>
      {/* Sleek pill tab bar - fully isolated from ReportSetup */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
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

      {tab === "compliance" && <ComplianceSection />}
      {tab === "categories" && <CategoriesSection />}
      {tab === "security" && <SecuritySection />}
      {tab === "audit" && isSuperAdmin && <AuditLog />}
    </>
  );
}

/* ================================================================== */
/* Compliance Section                                                  */
/* ================================================================== */

function ComplianceSection() {
  const { user } = useAuth();
  const periods = useFetch<{ data: Period[] }>(user ? "/api/reports/periods" : null);
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const qs = period ? `?period_label=${encodeURIComponent(period)}` : "";
  const { data: report, loading, reload } = useFetch<ComplianceReport>(user ? `/api/reports/compliance${qs}` : null);

  const periodList = Array.isArray(periods.data) ? periods.data : (periods.data?.data ?? []);

  // Filter barangay rows
  const filteredBarangays = useMemo(() => {
    if (!report?.by_barangay) return [];
    if (!search.trim()) return report.by_barangay;
    const term = search.toLowerCase();
    return report.by_barangay.filter(
      (b) => b.barangay.name.toLowerCase().includes(term) || b.barangay.code.toLowerCase().includes(term)
    );
  }, [report?.by_barangay, search]);

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Period:
            </span>
            <select
              className={`${field} w-48 font-medium`}
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

          <div className="relative">
            <input
              type="text"
              placeholder="Filter barangays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${field} w-48 sm:w-56 pl-8`}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRemindersModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-[#0039A6] dark:text-blue-300 hover:bg-blue-100 transition-colors shadow-xs"
          >
            <span>⏰</span>
            <span>Send Reminders</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-xs"
          >
            <span>📄</span>
            <span>Summary Report</span>
          </button>

          <button
            onClick={() => reload()}
            className={`${btnGhost} text-xs`}
            title="Refresh compliance metrics"
          >
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <a
            href={apiUrl(`/api/reports/compliance/export${qs}`)}
            download
            className={`${btn} text-xs`}
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
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading compliance records...</span>
        </div>
      ) : !report ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80">
          <p className="text-sm text-slate-500 dark:text-slate-400">No compliance data available for this period.</p>
        </div>
      ) : (
        <>
          {/* KPI Tiles Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <KpiCard
              label="Compliance Rate"
              value={`${report.totals?.compliance_rate ?? 0}%`}
              subtext="Compliant vs total due"
              accent="emerald"
              icon={
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KpiCard
              label="Filing Rate"
              value={`${report.totals?.filing_rate ?? 0}%`}
              subtext="Submissions received"
              accent="blue"
              icon={
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            />
            <KpiCard
              label="Awaiting Review"
              value={report.totals?.under_review ?? 0}
              subtext="Requires supervisor evaluation"
              accent="amber"
              icon={
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KpiCard
              label="Needs Fixing"
              value={report.totals?.non_compliant ?? 0}
              subtext="Returned for revision"
              accent="rose"
              icon={
                <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <KpiCard
              label="Overdue"
              value={report.totals?.overdue ?? 0}
              subtext="Past statutory deadline"
              accent="red"
              icon={
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Overdue Alert Banner if any overdue */}
          {report.overdue && report.overdue.length > 0 && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-300">
                  Critical: Overdue Submissions ({report.overdue.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {report.overdue.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-rose-200/60 dark:border-rose-500/10 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{o.barangay}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{o.category}</span>
                    </div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded-md text-[10px]">
                      Due {o.due_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Barangay Compliance Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compliance by Barangay</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detailed filing health and status breakdown for Makati City barangays
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {filteredBarangays.length} barangay(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Barangay</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Required</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-emerald-600 dark:text-emerald-400">Compliant</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-rose-600 dark:text-rose-400">Needs Fixing</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-amber-600 dark:text-amber-400">Awaiting</th>
                    <th scope="col" className="px-4 py-3.5 text-center text-red-600 dark:text-red-400">Overdue</th>
                    <th scope="col" className="px-6 py-3.5">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filteredBarangays.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                        {search ? "No barangays match your search term." : "No barangay records available."}
                      </td>
                    </tr>
                  ) : (
                    filteredBarangays.map((row) => {
                      const rate = row.compliance_rate ?? 0;
                      const progressColor =
                        rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";

                      return (
                        <tr
                          key={row.barangay.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0039A6]/10 text-[#0039A6] dark:text-[#93C5FD] text-xs font-bold">
                                {row.barangay.name.substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="font-semibold block">{row.barangay.name}</span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  {row.barangay.code}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {row.total}
                          </td>
                          <td className="px-4 py-3.5 text-center tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {row.compliant}
                          </td>
                          <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                            {row.non_compliant}
                          </td>
                          <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                            {row.awaiting_review}
                          </td>
                          <td className="px-4 py-3.5 text-center tabular-nums font-semibold text-red-600 dark:text-red-400">
                            {row.overdue}
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Supervisor Compliance Operations Modals */}
      <SendRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        onSuccess={() => reload()}
      />

      <ExecutiveComplianceSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />
    </div>
  );
}

/* ================================================================== */
/* Categories Section                                                  */
/* ================================================================== */

function CategoriesSection() {
  const { user } = useAuth();
  const { data: categories, loading, reload } = useFetch<Category[]>(user ? "/api/report-categories" : null);
  const [cycleFilter, setCycleFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  const cats = categories ?? [];
  const cycles = ["weekly", "monthly", "quarterly", "semestral", "annual"];

  const filteredCats = cats
    .filter((c) => {
      const matchCycle = !cycleFilter || c.cycle === cycleFilter;
      const matchSector = !sectorFilter || c.sector === sectorFilter;
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.sector && c.sector.toLowerCase().includes(search.toLowerCase()));
      return matchCycle && matchSector && matchSearch;
    })
    .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));

  const grouped: Record<string, Category[]> = {};
  for (const c of filteredCats) {
    (grouped[c.cycle] ??= []).push(c);
  }

  const uniqueSectors = [...new Set(cats.map((c) => c.sector).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      {/* Header with "+ Create Report" action for supervisors */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Report Catalogue & Requirements</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configured periodic reports that Makati barangays must prepare, submit, and file.
          </p>
        </div>

        {user?.role === "office_supervisor" && (
          <button
            onClick={() => setShowSetup(!showSetup)}
            className={`${btn} text-xs`}
          >
            <span>{showSetup ? "Close setup" : "+ Add report type"}</span>
          </button>
        )}
      </div>

      {/* Accordion form for adding report category */}
      {showSetup && user?.role === "office_supervisor" && (
        <div className="transition-all animate-fadeIn">
          <ReportSetup onChanged={() => { reload(); setShowSetup(false); }} />
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search report name or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${field} w-full pl-8`}
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Cycle filter */}
        <select
          className={`${field} w-40 font-medium`}
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
        >
          <option value="" className="bg-white dark:bg-[#1E293B]">All cycles</option>
          {cycles.map((c) => (
            <option key={c} value={c} className="bg-white dark:bg-[#1E293B]">
              {CYCLE_LABEL[c] ?? c}
            </option>
          ))}
        </select>

        {/* Sector filter */}
        <select
          className={`${field} w-44 font-medium`}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="" className="bg-white dark:bg-[#1E293B]">All sectors</option>
          {uniqueSectors.map((s) => (
            <option key={s} value={s} className="bg-white dark:bg-[#1E293B]">
              {s}
            </option>
          ))}
        </select>

        {(cycleFilter || sectorFilter || search) && (
          <button
            className={`${btnGhost} text-[#0039A6] dark:text-[#93C5FD] text-xs`}
            onClick={() => { setCycleFilter(""); setSectorFilter(""); setSearch(""); }}
          >
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0F172A]/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading report catalogue...</span>
        </div>
      ) : filteredCats.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {cats.length === 0 ? "No report categories defined yet." : "No reports match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {cycles.filter((c) => grouped[c]?.length).map((cycle) => (
            <div key={cycle} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#0039A6]/10 dark:bg-[#0039A6]/20 px-3 py-1 text-xs font-bold text-[#0039A6] dark:text-[#93C5FD] uppercase tracking-wider">
                  {CYCLE_LABEL[cycle] ?? cycle}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {grouped[cycle]!.length} report(s)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {grouped[cycle]!.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category: cat }: { category: Category }) {
  const [expanded, setExpanded] = useState(false);
  const sectorIcon = SECTOR_ICON[cat.sector ?? ""] ?? "📄";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5 flex-shrink-0">{sectorIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</h3>
              {cat.sector && (
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {cat.sector}
                </span>
              )}
            </div>
            {cat.deadline_description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>📅</span>
                <span>{cat.deadline_description}</span>
              </p>
            )}
          </div>
          <svg
            className={`flex-shrink-0 h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-white/5 space-y-3.5 bg-slate-50/40 dark:bg-black/20">
          {cat.barangay_action && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <span>✓</span> Barangay Submission Mandate
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{cat.barangay_action}</p>
            </div>
          )}
          {cat.supervisor_action && (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                <span>👁</span> DILG Office Review Responsibility
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{cat.supervisor_action}</p>
            </div>
          )}
          {cat.slug && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono bg-white dark:bg-white/10 px-2 py-0.5 rounded border border-slate-200/60 dark:border-white/10">
                slug: {cat.slug}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Security Section — Fully Functional Telemetry & Incident Log         */
/* ================================================================== */

function SecuritySection() {
  const { user } = useAuth();
  // Fixed route: /api/reports/security (replaces broken /api/security/summary)
  const { data: security, loading, reload } = useFetch<SecuritySummary>(user ? "/api/reports/security" : null);
  const { data: incidentsData, loading: loadingIncidents, reload: reloadIncidents } = useFetch<Paged<Incident>>(user ? "/api/security-incidents" : null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const incidents = incidentsData?.data ?? [];

  async function handleAcknowledge(incidentId: number) {
    setActionBusy(incidentId);
    try {
      await apiSend(`/api/security-incidents/${incidentId}/status`, "PATCH", {
        status: "acknowledged",
      });
      reload();
      reloadIncidents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to acknowledge incident.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleResolve(incidentId: number) {
    const notes = prompt("Enter resolution notes or actions taken:");
    if (notes === null) return;

    setActionBusy(incidentId);
    try {
      await apiSend(`/api/security-incidents/${incidentId}/status`, "PATCH", {
        status: "resolved",
        resolution_notes: notes,
      });
      reload();
      reloadIncidents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve incident.");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with "+ Report Incident" */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Security & Threat Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time incident response, threat telemetry, and security reporting across barangays.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className={`${btn} text-xs`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report Security Incident
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0F172A]/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading security telemetry...</span>
        </div>
      ) : !security ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80">
          <p className="text-sm text-slate-500 dark:text-slate-400">Security telemetry currently unavailable.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Total Incidents"
              value={security.total}
              subtext="Logged in system"
              accent="slate"
              icon={
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
            <KpiCard
              label="Active / Open"
              value={security.open}
              subtext="Under active handling"
              accent="amber"
              icon={
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <KpiCard
              label="Unanswered >24h"
              value={security.unacknowledged_over_24h}
              subtext="SLA breach threshold"
              accent="rose"
              icon={
                <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KpiCard
              label="Avg Response Time"
              value={security.avg_hours_to_acknowledge != null ? `${security.avg_hours_to_acknowledge.toFixed(1)}h` : "N/A"}
              subtext="Hours to acknowledge"
              accent="blue"
              icon={
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Breakdown title="Threat Type Breakdown" data={security.by_type || {}} />
            <Breakdown title="Severity Distribution" data={security.by_severity || {}} />
            <Breakdown title="Status Resolution" data={security.by_status || {}} />
          </div>

          {/* Incidents Log Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reported Security Incidents</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Incident feed with supervisor escalation and acknowledgment actions
                </p>
              </div>
              <button
                onClick={() => reloadIncidents()}
                className={`${btnGhost} text-xs`}
              >
                Refresh Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Threat Type</th>
                    <th scope="col" className="px-4 py-3.5">Severity</th>
                    <th scope="col" className="px-5 py-3.5">Description</th>
                    <th scope="col" className="px-4 py-3.5">Reported By</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {loadingIncidents && incidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">Loading incident records...</td>
                    </tr>
                  ) : incidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No security incidents reported.
                      </td>
                    </tr>
                  ) : (
                    incidents.map((inc) => {
                      const sevColor =
                        inc.severity === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                          : inc.severity === "high"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                          : inc.severity === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";

                      const statusColor =
                        inc.status === "resolved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : inc.status === "acknowledged"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                          : inc.status === "escalated_to_icto"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";

                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-white capitalize">
                            {inc.type.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sevColor}`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={inc.description}>
                            {inc.description}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                            <div>{inc.reporter?.name ?? "Anonymous"}</div>
                            <div className="text-[10px] text-slate-400">{formatDateTime(inc.created_at)}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                              {inc.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {user?.role === "office_supervisor" || user?.role === "super_admin" ? (
                              <>
                                {inc.status === "reported" && (
                                  <button
                                    onClick={() => handleAcknowledge(inc.id)}
                                    disabled={actionBusy === inc.id}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                                  >
                                    Acknowledge
                                  </button>
                                )}
                                {inc.status !== "resolved" && inc.status !== "false_positive" && (
                                  <button
                                    onClick={() => handleResolve(inc.id)}
                                    disabled={actionBusy === inc.id}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
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
        </>
      )}

      {/* Report Incident Modal */}
      {showReportModal && (
        <ReportIncidentModal
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            reload();
            reloadIncidents();
          }}
        />
      )}
    </div>
  );
}

function ReportIncidentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    setBusy(true);
    setError(null);
    try {
      await apiSend("/api/security-incidents", "POST", fd);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to file security report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡</span> Report Security Incident
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <Notice kind="error">{error}</Notice>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Incident Type
            </label>
            <select name="type" required className={`${field} w-full`}>
              <option value="phishing_attempt">Phishing Attempt / Scam Email</option>
              <option value="suspicious_login">Suspicious Login / Account Takeover</option>
              <option value="data_leak_suspicion">Suspected Data Leak</option>
              <option value="malware">Malware / Ransomware Infection</option>
              <option value="other">Other Security Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Severity Level
            </label>
            <select name="severity" required className={`${field} w-full`}>
              <option value="low">Low - Minor inquiry or suspicious email</option>
              <option value="medium">Medium - Potential unauthorized access</option>
              <option value="high">High - Active compromise or breach risk</option>
              <option value="critical">Critical - System compromise / ransom attack</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Incident Description
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe what occurred, affected systems or accounts, and any observable symptoms..."
              className={`${field} w-full`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Evidence (Optional Screenshot / Log)
            </label>
            <input
              type="file"
              name="evidence"
              accept=".png,.jpg,.jpeg,.pdf,.txt"
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0039A6]/10 file:text-[#0039A6] hover:file:bg-[#0039A6]/20 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button type="button" onClick={onClose} className={btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={btn}>
              {busy ? "Submitting..." : "Submit Incident Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Audit Log (super_admin only)                                        */
/* ================================================================== */

function AuditLog() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const qs = new URLSearchParams({ page: String(page) });
  if (actionFilter) qs.set("action", actionFilter);

  const { data, loading } = useFetch<Paged<AuditEntry>>(`/api/audit-log?${qs}`);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/80">
        <label className="text-sm flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
            Filter by action:
          </span>
          <input
            className={`${field} w-56`}
            placeholder="e.g. login, upload, delete"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <caption className="sr-only">Audit log entries</caption>
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3">Timestamp</th>
                <th scope="col" className="px-5 py-3">User</th>
                <th scope="col" className="px-5 py-3">Action</th>
                <th scope="col" className="px-5 py-3">Subject</th>
                <th scope="col" className="px-5 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading && rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">Loading audit log...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">No audit entries found.</td></tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 text-xs tabular-nums text-slate-600 dark:text-slate-300">{formatDateTime(e.created_at)}</td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-900 dark:text-white">{e.user?.name ?? "System"}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {e.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {e.subject_type ? `${e.subject_type} #${e.subject_id}` : "-"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{e.ip_address ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}
    </div>
  );
}

/* ================================================================== */
/* Shared UI Components                                                */
/* ================================================================== */

function KpiCard({
  label,
  value,
  subtext,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent: string;
  icon?: React.ReactNode;
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
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && <div className="p-1 rounded-lg bg-white/50 dark:bg-white/5">{icon}</div>}
      </div>
      <p className={`text-2xl font-black tracking-tight tabular-nums mt-1 ${current.text}`}>
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

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
        {title}
      </h4>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400 py-3">No incident data yet</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {val} <span className="text-[10px] text-slate-400 font-normal">({Math.round((val / total) * 100)}%)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0039A6] transition-all duration-300"
                  style={{ width: `${(val / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
