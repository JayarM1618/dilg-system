"use client";

import Link from "next/link";

export function BagwisReadOnlyBanner() {
  return (
    <div
      role="status"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-[#FFF8E6] dark:bg-amber-500/10 p-4 sm:p-5 text-sm text-[#7A5B00] dark:border-amber-400/20 dark:text-amber-200 shadow-sm"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="3" />
          </svg>
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm sm:text-base text-[#1B1235] dark:text-white">
              Makati City-Level View-Only Mode
            </p>
            <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Read-Only
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-[#E0D5FC] leading-relaxed">
            Bagwis is the city-level oversight system for DILG Makati. Barangay representatives can view city-wide compliance tallies and standing, but do not have action or editing permissions. Submissions and reports are processed in <strong>BORMS</strong>.
          </p>
        </div>
      </div>

      <Link
        href="/borms"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7B4DFF] to-[#5A18C9] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#7B4DFF]/20 transition-all hover:scale-105 active:scale-95 shrink-0"
      >
        <span>Open BORMS</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
    </div>
  );
}

export default BagwisReadOnlyBanner;
