"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";
export const card = "min-w-0 rounded-3xl p-6";

/**
 * Same frame as the homepage (soft purple page, big white rounded panel, brand header),
 * for the read-only Citizens View. There is deliberately no sign-in button here.
 */
export default function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`${poppins.className} min-h-screen text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out p-3 sm:p-6 lg:p-8`}>
      <div className="relative mx-auto flex max-w-360 overflow-hidden bg-white/40 dark:bg-[#1B142F]/40 backdrop-blur-3xl shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] border border-white/40 dark:border-white/10 rounded-2xl sm:rounded-[2rem] transition-colors duration-500 ease-out">

        <div className="relative min-w-0 flex-1">
          <header className="border-b border-[#EDE7FA] dark:border-[#2B2542]">
            <div className="flex items-center gap-2 sm:gap-3 px-4 py-3.5 sm:px-8 sm:py-4">
              <Link href="/" className={`grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] transition-colors hover:bg-[#E3D5FF] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out dark:hover:bg-[#2B2542] ${focusRing}`} aria-label="Go back to home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <BrandMark tone="dark" />
              <span className="hidden xs:inline-block rounded-full bg-[#F1EBFF] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out">
                Citizens View
              </span>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <span className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#E3D5FF] text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20c1-3.5 3.7-5 7-5s6 1.5 7 5" />
                  </svg>
                </span>
              </div>
            </div>
          </header>

          <main className="space-y-5 p-4 sm:p-8">{children}</main>

          <footer className="pb-6 pt-1 text-center text-sm text-slate-500 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">
            &copy; {new Date().getFullYear()} Talaghayan &middot; Barangay Report Tracker
          </footer>
        </div>
      </div>
    </div>
  );
}

/** Small coloured chip, e.g. a programme category. */
export function Chip({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  );
}

/** Date badge ("OCT 20") used in event lists. */
export function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#7B4DFF] text-center leading-none text-white" aria-hidden="true">
      <span>
        <span className="block text-[10px] font-semibold tracking-wide text-[#E3D5FF]">{month}</span>
        <span className="block text-xl font-semibold">{day}</span>
      </span>
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out/70 px-5 py-6 text-center text-sm text-slate-500">{children}</p>;
}
