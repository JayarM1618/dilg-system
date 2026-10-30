"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";
import RealtimeAnalyticsSection from "@/components/RealtimeAnalyticsSection";
import SendRemindersModal from "@/components/supervisor/SendRemindersModal";
import ExecutiveComplianceSummaryModal from "@/components/supervisor/ExecutiveComplianceSummaryModal";
import BarangayOperationsChecklistModal from "@/components/supervisor/BarangayOperationsChecklistModal";

interface Summary {
  total_barangays: number;
  pending: number;
  submitted: number;
  under_review?: number;
  compliant: number;
  non_compliant: number;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";

/**
 * DILG Supervisor Operations Console Hub (`/admin`).
 * Provides official supervisors with access to BORMS for the 3 Rs
 * (Requirements, Resources, Reports, Repository) and Bagwis for Makati City oversight.
 */
export default function SupervisorAdminHome() {
  const { user } = useAuth();
  const totals = useApi<Summary>(user ? "/api/dashboard/summary" : null, { pollInterval: 8000 });
  const reqSummary = useFetch<{ awaiting_review: number; to_do: number }>(
    user ? "/api/requirements/summary" : null,
    { pollInterval: 8000 }
  );

  const summary = totals.data;
  const awaitingReview = (summary?.submitted ?? 0) + (summary?.under_review ?? 0);
  const requirementsAwaiting = reqSummary.data?.awaiting_review ?? 0;

  const overallRate = summary && summary.total_barangays > 0
    ? Math.round(
        (summary.compliant /
          (summary.compliant + summary.submitted + summary.pending + summary.non_compliant || 1)) *
          100
      )
    : 0;

  const [showReminders, setShowReminders] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  function openConcernsDesk() {
    window.dispatchEvent(new CustomEvent("open-concerns-desk"));
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-0.5 text-xs font-bold text-[#0039A6] dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DILG Makati Field Office
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Supervisor Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operations Console
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Welcome, <strong>{user?.name}</strong>. Manage the Three Rs for Makati barangays in <strong>BORMS</strong>, or monitor city-level governance and compliance in <strong>Bagwis</strong>.
          </p>
        </div>

        {/* Supervisor badge info */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3.5 shadow-sm text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Authority</p>
            <p className="text-sm font-bold text-[#0039A6] dark:text-blue-400">Field Supervisor</p>
          </div>
        </div>
      </div>

      {/* ── Supervisory Action Alert ── */}
      {(awaitingReview > 0 || requirementsAwaiting > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-200/60 dark:bg-blue-900/40 text-[#0039A6] dark:text-blue-300 font-bold text-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </span>
            <div>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Submissions &amp; Directives Awaiting Your Review
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                You have <strong className="text-[#0039A6] dark:text-blue-300">{awaitingReview} report(s)</strong> and{" "}
                <strong className="text-[#0039A6] dark:text-blue-300">{requirementsAwaiting} directive response(s)</strong> waiting for examiner review and clearance.
              </p>
            </div>
          </div>
          <Link
            href="/borms/reports"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#002B7F] transition-colors"
          >
            <span>Review in BORMS</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      )}

      {/* ── Key Metrics Overview ── */}
      {summary && (
        <section aria-label="Supervisor operational telemetry" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jurisdiction</span>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.total_barangays}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Makati Barangays</p>
          </div>

          <div className="group rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Reports To Review</span>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300">
              {awaitingReview}
            </p>
            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">Pending Examination</p>
          </div>

          <div className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0039A6] dark:text-blue-400">Directives Waiting</span>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0039A6] dark:text-blue-400">
              {requirementsAwaiting}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Responses Received</p>
          </div>

          <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Makati Compliance</span>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {overallRate}%
            </p>
            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">{summary.compliant} Barangays Cleared</p>
          </div>
        </section>
      )}

      {/* ── Real‑Time Analytics ── */}
      <section aria-label="Supervisor real‑time analytics">
        <RealtimeAnalyticsSection actionHref="/borms/reports" actionLabel="Inspect active reports" />
      </section>

      {/* ── Sub-systems Selection ── */}
      <section aria-labelledby="subsystems-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="subsystems-heading"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Supervisory Sub-systems
          </h2>
          <span className="text-xs text-slate-400">Select system to operate</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* ── CARD 1: BORMS ── */}
          <Link
            href="/borms"
            className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 hover:border-[#0039A6] dark:hover:border-blue-500 bg-white dark:bg-[#181126] p-6 sm:p-8 shadow-sm transition-colors ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0039A6] dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30 font-bold text-lg shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </span>
                <span className="rounded-full bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0039A6] dark:text-blue-300">
                  Operations Center &bull; 3 Rs
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">
                BORMS
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#0039A6] dark:text-blue-400">
                Barangay Operations &amp; Records Management System
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Supervise and administer the Three Rs for all active Makati barangays. Open reporting periods, review submissions, issue official requirements and complaints, upload guidelines, and manage the repository archive.
              </p>

              {/* 3 Rs breakdown */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Issue &amp; Track Requirements</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Review Barangay Reports</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Upload Forms &amp; Resources</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Manage Central Repository</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Full supervisory management access
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#002B7F] transition-colors">
                <span>Open BORMS</span>
                <span>&rarr;</span>
              </span>
            </div>
          </Link>

          {/* ── CARD 2: BAGWIS ── */}
          <Link
            href="/bagwis"
            className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 hover:border-emerald-600 dark:hover:border-emerald-500 bg-white dark:bg-[#181126] p-6 sm:p-8 shadow-sm transition-colors ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30 font-bold text-lg shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg>
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Makati City &bull; Full Oversight
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Bagwis
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                City-Level Compliance &amp; Security Oversight
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Makati City Field Office command board. Inspect the live 23-barangay compliance tally, track reporting cycles, export official CSV compliance reports, and monitor security incident logs across the city.
              </p>

              {/* City features tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>23 Barangays Live Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Export Compliance (.csv)</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Filing Cycles &amp; Deadlines</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-white dark:group-hover:bg-white/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Security &amp; Audit Logs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Full supervisory analytics &amp; export
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors">
                <span>Open Bagwis</span>
                <span>&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Supervisor Operations & Follow-up Toolkit ── */}
      <section aria-labelledby="supervisor-toolkit-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="supervisor-toolkit-title"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Supervisor Action &amp; Follow-up Operations
          </h2>
          <span className="text-xs text-slate-400 font-medium">Administrative Toolkit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Send Reminders */}
          <button
            type="button"
            onClick={() => setShowReminders(true)}
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-blue-200 dark:border-blue-900/40 p-5 text-left shadow-sm hover:border-[#0039A6] dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0039A6] dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-[#0039A6] dark:text-blue-300">
                  Bulk &amp; 1-Click
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">
                Send Reminders
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dispatch deadline notifications to non-compliant or pending barangays.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0039A6] dark:text-blue-400">
              <span>Dispatch notice</span>
              <span>&rarr;</span>
            </span>
          </button>

          {/* Action 2: Compliance Summary Generator */}
          <button
            type="button"
            onClick={() => setShowSummary(true)}
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 text-left shadow-sm hover:border-[#0039A6] dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200 font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  Regional Format
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">
                Compliance Summary
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate official executive report for superiors and DILG Regional.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>View &amp; Print</span>
              <span>&rarr;</span>
            </span>
          </button>

          {/* Action 3: Barangay Operations & Field Checklist */}
          <button
            type="button"
            onClick={() => setShowChecklist(true)}
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-emerald-200 dark:border-emerald-900/40 p-5 text-left shadow-sm hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  Field Operations
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Barangay Checklist
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Running checklist per barangay and field visit / inspection notes log.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>Open checklist</span>
              <span>&rarr;</span>
            </span>
          </button>

          {/* Action 4: Concerns & Communication Desk */}
          <button
            type="button"
            onClick={openConcernsDesk}
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 text-left shadow-sm hover:border-[#0039A6] dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0039A6] dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-[#0039A6] dark:text-blue-300">
                  Direct Threads
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">
                Concerns &amp; Logs
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Message thread per barangay, official responses, and Super Admin escalation.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0039A6] dark:text-blue-400">
              <span>Open Concerns Desk</span>
              <span>&rarr;</span>
            </span>
          </button>
        </div>
      </section>

      {/* ── Quick Supervisory Actions ── */}
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] mb-4">
          Quick Supervisory Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/borms/requirements"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-[#0039A6] dark:hover:border-blue-500 transition-colors"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0039A6] dark:bg-blue-950/50 dark:text-blue-300 text-sm font-bold mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">Directives Tracker</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Issue directives and track barangay compliance.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0039A6] dark:text-blue-400">
              <span>Manage directives</span>
              <span>&rarr;</span>
            </span>
          </Link>

          <Link
            href="/borms/reports"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:border-emerald-600 dark:hover:border-emerald-500 transition-colors"
          >
            <div>
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-sm font-bold mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Review Submissions</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Examine barangay reports and mark compliant.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Review reports</span>
              <span>&rarr;</span>
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

      {/* ── Modals for Supervisor Operations ── */}
      <SendRemindersModal
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        onSuccess={() => totals.retry()}
      />

      <ExecutiveComplianceSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
      />

      <BarangayOperationsChecklistModal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
      />
    </div>
  );
}
