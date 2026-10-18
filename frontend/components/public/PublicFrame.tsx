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
 * Full-screen layout for the Citizens View and Barangay Detail views.
 * Spans edge-to-edge across the screen with responsive horizontal padding.
 */
export default function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`${poppins.className} min-h-screen w-full bg-white dark:bg-[#110C1B] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      {/* Subtle full-bleed atmospheric gradient glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/50 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/50 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/50 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Full-width sticky/ambient Header */}
      <header className="relative z-20 w-full border-b border-[#EDE7FA] dark:border-[#251E38] bg-white/80 dark:bg-[#181126]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center gap-3 px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <Link
            href="/"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] transition-all hover:bg-[#E3D5FF] hover:scale-105 dark:bg-[#352D52] dark:text-[#CDBBFF] dark:hover:bg-[#423866] ${focusRing}`}
            aria-label="Go back to home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          <BrandMark tone="dark" />

          <span className="hidden xs:inline-flex items-center gap-1.5 rounded-full bg-[#F1EBFF] px-3 py-1 text-xs font-semibold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7B4DFF] animate-pulse" />
            Makati Citizen View
          </span>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#E3D5FF] text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 shadow-sm"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20c1-3.5 3.7-5 7-5s6 1.5 7 5" />
              </svg>
            </span>
          </div>
        </div>
      </header>

      {/* Full-width Main Content Area */}
      <main className="relative z-10 w-full flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {children}
      </main>

      {/* Full-width Footer */}
      <footer className="relative z-10 w-full border-t border-[#EDE7FA] dark:border-[#251E38] py-6 text-center text-sm text-slate-500 dark:text-[#7C6FA3] transition-colors duration-500">
        &copy; {new Date().getFullYear()} Talaghayan &middot; E-Sub LGRRC &middot; DILG Makati
      </footer>
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
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#7B4DFF] text-center leading-none text-white shadow-sm" aria-hidden="true">
      <span>
        <span className="block text-[10px] font-semibold tracking-wide text-[#E3D5FF]">{month}</span>
        <span className="block text-xl font-bold">{day}</span>
      </span>
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-white/70 dark:bg-black/20 shadow-sm border border-slate-200/60 dark:border-white/10 backdrop-blur-md px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}
