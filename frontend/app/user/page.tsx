"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import RealtimeAnalyticsSection from "@/components/RealtimeAnalyticsSection";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

/**
 * Barangay Representative Command Hub.
 * The entry point for barangay users. They must click BORMS to enter their
 * operations dashboard, or Bagwis to view city-level Makati oversight.
 */
export default function BarangayUserHome() {
  const { user } = useAuth();
  const { data: reqSummary } = useFetch<{ to_do: number; new: number; overdue: number }>(
    "/api/requirements/summary",
    { pollInterval: 8000 }
  );

  const barangayName = user?.barangay?.name ?? "Your Barangay";

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3 py-0.5 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0] animate-pulse" />
              Talaghayan &bull; Barangay Command Portal
            </span>
            <span className="inline-flex items-center rounded-full bg-[#F1EBFF] dark:bg-[#352D52] px-2.5 py-0.5 text-xs font-semibold text-[#5A18C9] dark:text-[#CDBBFF]">
              Representative
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B1235] dark:text-white">
            Barangay {barangayName}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-[#C9BCEB] max-w-2xl">
            Welcome, <strong>{user?.name}</strong>. Access your operational record systems below. To file reports, access repository archives, and comply with directives, open <strong>BORMS</strong>.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3.5 shadow-sm text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">DILG Status</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Active Jurisdiction</p>
          </div>
        </div>
      </div>

      {/* ── Notice Banner if Directives are Awaiting Action ── */}
      {reqSummary && reqSummary.to_do > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-5 backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-lg">
              !
            </span>
            <div>
              <p className="font-bold text-sm sm:text-base text-[#1B1235] dark:text-white">
                Directives Awaiting Action ({reqSummary.to_do})
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                You have {reqSummary.to_do} requirement(s) from DILG Makati requiring compliance from Barangay {barangayName}
                {reqSummary.overdue ? ` (${reqSummary.overdue} overdue)` : ""}. Open BORMS to submit your response.
              </p>
            </div>
          </div>
          <Link
            href="/borms/requirements"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7B4DFF] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors"
          >
            <span>Comply in BORMS</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
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
              <span className="h-4 w-4 border-2 border-[#7B4DFF] border-t-transparent rounded-full animate-spin" />
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
            className={`group relative flex flex-col justify-between rounded-3xl border-2 border-[#7B4DFF]/30 hover:border-[#7B4DFF] bg-gradient-to-br from-[#F3EDFE]/90 via-white to-[#EDE7FA]/70 dark:from-[#241A3F] dark:via-[#1B142F] dark:to-[#171026] p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7B4DFF]/20 text-[#5A18C9] dark:text-[#CDBBFF] font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </span>
                <span className="rounded-full bg-[#7B4DFF]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5A18C9] dark:text-[#CDBBFF]">
                  Primary System &bull; 3 Rs
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#1B1235] dark:text-white group-hover:text-[#5A18C9] dark:group-hover:text-[#CDBBFF] transition-colors">
                BORMS
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#A78BFA]">
                Barangay Operations &amp; Records Management System
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-[#C9BCEB] leading-relaxed">
                The centralized operational workspace for Barangay {barangayName}. File quarterly and monthly accomplishment reports, download official DILG forms, access the document repository, and review examiner marks.
              </p>

              {/* 3 Rs breakdown tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Requirements Compliance</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Reports Submission</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Resources &amp; Forms</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Archived Repository</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#7B4DFF]/15 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Contains your live Barangay Dashboard
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B4DFF] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#7B4DFF]/25 transition-transform group-hover:scale-105">
                <span>Open BORMS</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>

          {/* ── CARD 2: BAGWIS (MAKATI CITY LEVEL - VIEW ONLY) ── */}
          <Link
            href="/bagwis"
            className={`group relative flex flex-col justify-between rounded-3xl border border-[#06D6A0]/30 hover:border-[#06D6A0] bg-gradient-to-br from-[#E6FBF3]/90 via-white to-[#E0F8F0]/70 dark:from-[#12382C]/80 dark:via-[#0F2D24]/80 dark:to-[#0C241D]/90 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${focusRing}`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#06D6A0]/20 text-[#0B6B52] dark:text-[#84DEBD] font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg>
                </span>
                <span className="rounded-full bg-[#06D6A0]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0B6B52] dark:text-[#84DEBD]">
                  Makati City &bull; View Only
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#1B1235] dark:text-white group-hover:text-[#0B6B52] dark:group-hover:text-[#84DEBD] transition-colors">
                Bagwis
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#0B6B52] dark:text-[#84DEBD]">
                City-Level Compliance &amp; Security Oversight
              </p>

              <p className="mt-3 text-sm text-slate-600 dark:text-[#C9BCEB] leading-relaxed">
                City-wide transparency portal for all 23 barangays of Makati City. Check city-wide compliance matrices, reporting cycles, and security audit status. As a representative, this system is for viewing only.
              </p>

              {/* City features tags */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>23 Barangays Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Makati City Rates</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Reporting Cycles</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                  <span className="text-[#06D6A0] font-bold">&bull;</span>
                  <span>Security Advisories</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#06D6A0]/20 pt-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Read-only city governance standing
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B6B52] dark:bg-[#06D6A0] px-4 py-2 text-xs sm:text-sm font-bold text-white dark:text-slate-900 shadow-md transition-transform group-hover:scale-105">
                <span>View Bagwis</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Community & Transparency ── */}
      <section aria-labelledby="community-heading" className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              Community Outreach &amp; Citizens
            </span>
            <h3 className="mt-2 text-lg font-bold text-[#1B1235] dark:text-white">
              Announcements &amp; Public Programs
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#C9BCEB] max-w-2xl">
              Publish local community advisories, holiday emergency hotlines, and public services displayed on the Citizens Transparency Portal for Barangay {barangayName}.
            </p>
          </div>

          <Link
            href="/user/community"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:border-[#7B4DFF] hover:text-[#7B4DFF] dark:hover:text-[#CDBBFF] transition-all shadow-sm"
          >
            <span>Manage Announcements</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
