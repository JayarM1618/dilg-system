"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import RealtimeAnalyticsSection from "@/components/RealtimeAnalyticsSection";
import BarangayHelpModal from "@/components/BarangayHelpModal";
import SystemAssistantModal from "@/components/support/SystemAssistantModal";
import ConcernsDeskModal from "@/components/support/ConcernsDeskModal";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";

/**
 * Barangay Representative Command Hub.
 * The entry point for barangay users. They must click BORMS to enter their
 * operations dashboard, or Bagwis to view city-level Makati oversight.
 */
export default function BarangayUserHome() {
  const { user } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [concernsOpen, setConcernsOpen] = useState(false);
  const { data: reqSummary } = useFetch<{ to_do: number; new: number; overdue: number }>(
    user ? "/api/requirements/summary" : null,
    { pollInterval: 8000 }
  );

  const barangayName = user?.barangay?.name ?? "Your Barangay";

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-0.5 text-xs font-bold text-[#0039A6] dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Talaghayan &bull; Barangay Command Portal
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Representative
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Barangay {barangayName}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Welcome, <strong>{user?.name}</strong>. Access your operational record systems below. To file reports, access repository archives, and comply with directives, open <strong>BORMS</strong>.
          </p>
        </div>

        {/* Status pill & Quick Help Guide */}
        <div className="self-start sm:self-center shrink-0 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3.5 shadow-sm hover:border-[#0039A6] dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            title="Open Operational Guide &amp; FAQs"
          >
            <span className="text-sm">📘</span>
            <span className="hidden sm:inline">Rep Guide &amp; FAQs</span>
          </button>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3.5 shadow-sm text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">DILG Status</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Active Jurisdiction</p>
          </div>
        </div>
      </div>

      {/* ── Deadline Reminders & Action Reminders Scorecard ── */}
      {reqSummary && (reqSummary.to_do > 0 || reqSummary.overdue > 0) && (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/20 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xl">
                ⏰
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Compliance Deadlines &amp; Reminders
                  </span>
                  {reqSummary.overdue > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {reqSummary.overdue} Overdue
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Action Required: {reqSummary.to_do} Pending DILG Directive{reqSummary.to_do === 1 ? "" : "s"}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Your barangay has {reqSummary.to_do} requirement(s) awaiting official filing or response.
                  {reqSummary.overdue > 0
                    ? ` Attention: ${reqSummary.overdue} requirement(s) are past due date.`
                    : " Submit responses on or before designated due dates to maintain your compliance standing."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/borms/requirements"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0039A6] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#002B7F] transition-colors"
              >
                <span>Comply in BORMS</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link
                href="/borms/reports"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/15 transition-colors"
              >
                <span>View Reports</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Real‑Time Analytics ── */}
      <section aria-label="Barangay representative real‑time analytics">
        {user?.barangay_id ? (
          <RealtimeAnalyticsSection
            defaultBarangayId={user.barangay_id}
            restrictedToBarangayId={user.barangay_id}
            restrictedBarangayName={user.barangay?.name}
            actionHref="/borms/reports"
            actionLabel="Submit & Inspect Reports"
          />
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 p-10 flex items-center justify-center shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <span className="h-4 w-4 border-2 border-[#0039A6] border-t-transparent rounded-full animate-spin" />
              <span>Loading telemetry analytics...</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Sub-systems Selection ── */}
      <section aria-labelledby="subsystems-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="subsystems-heading"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Available Sub-systems
          </h2>
          <span className="text-xs text-slate-400">Click a system to launch</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* ── CARD 1: BORMS (PRIMARY SYSTEM) ── */}
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
                  Primary System &bull; 3 Rs
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors">
                BORMS
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#0039A6] dark:text-blue-400">
                Barangay Operations &amp; Records Management System
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                The centralized operational workspace for Barangay {barangayName}. File quarterly and monthly accomplishment reports, download official DILG forms, access the document repository, and review examiner marks.
              </p>

              {/* 3 Rs breakdown tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Requirements Compliance</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Reports Submission</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Resources &amp; Forms</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Archived Repository</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Contains your live Barangay Dashboard
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#002B7F] transition-colors">
                <span>Open BORMS</span>
                <span>&rarr;</span>
              </span>
            </div>
          </Link>

          {/* ── CARD 2: BAGWIS (MAKATI CITY LEVEL - VIEW ONLY) ── */}
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
                  Makati City &bull; View Only
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Bagwis
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                City-Level Compliance &amp; Security Oversight
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                City-wide transparency portal for all 23 barangays of Makati City. Check city-wide compliance matrices, reporting cycles, and security audit status. As a representative, this system is for viewing only.
              </p>

              {/* City features tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>23 Barangays Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Makati City Rates</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Reporting Cycles</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
                  <span>Security Advisories</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Read-only city governance standing
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors">
                <span>View Bagwis</span>
                <span>&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Community & Transparency ── */}
      <section aria-labelledby="community-heading" className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              Community Outreach &amp; Citizens
            </span>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              Announcements &amp; Public Programs
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              Publish local community advisories, holiday emergency hotlines, and public services displayed on the Citizens Transparency Portal for Barangay {barangayName}.
            </p>
          </div>

          <Link
            href="/borms/community"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:border-[#0039A6] hover:text-[#0039A6] dark:hover:text-blue-400 transition-colors shadow-sm"
          >
            <span>Manage Announcements</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Official DILG Communication & Support ── */}
      <section aria-labelledby="support-heading" className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 px-3 py-1 text-xs font-bold text-[#0039A6] dark:text-blue-300">
              Official Liaison &amp; Support
            </span>
            <h3 id="support-heading" className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              DILG Assistant &amp; Concerns Desk
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              Ask questions about the system using the scripted Assistant, or submit an official communication request to DILG Makati officers with Super Admin escalation support.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:border-[#0039A6] hover:text-[#0039A6] dark:hover:text-blue-400 transition-colors shadow-sm"
            >
              <span>🤖 System Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => setConcernsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#002B7F] transition-colors shadow-sm"
            >
              <span>💬 Contact DILG Officer</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Help Guide & FAQ Modal ── */}
      <BarangayHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* ── Scripted AI Assistant Modal ── */}
      <SystemAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onOpenConcernsDesk={() => setConcernsOpen(true)}
        userRole={user?.role}
      />

      {/* ── Concerns Desk Modal ── */}
      <ConcernsDeskModal
        isOpen={concernsOpen}
        onClose={() => setConcernsOpen(false)}
      />
    </div>
  );
}
