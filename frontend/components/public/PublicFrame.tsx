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
    <div className={`${poppins.className} min-h-screen bg-[#F4EEFE] text-slate-800 sm:p-6 lg:p-8`}>
      <div className="mx-auto flex max-w-360 overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] sm:rounded-[2rem]">
        <div className="min-w-0 flex-1">
          <header className="border-b border-[#EDE7FA]">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
              <BrandMark tone="dark" />
              <span className="rounded-full bg-[#F1EBFF] px-3 py-1 text-xs font-semibold text-[#5A18C9]">
                Citizens View
              </span>
              <div className="ml-auto flex items-center gap-3">
                <Link
                  href="/"
                  className={`rounded-full border-2 border-[#7B4DFF] px-4 py-1.5 text-sm font-semibold text-[#5A18C9] transition-colors hover:bg-[#7B4DFF] hover:text-white ${focusRing}`}
                >
                  Exit Citizens View
                </Link>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E3D5FF] text-[#5A18C9]" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20c1-3.5 3.7-5 7-5s6 1.5 7 5" />
                  </svg>
                </span>
              </div>
            </div>
          </header>

          <main className="space-y-5 p-5 sm:p-8">{children}</main>

          <footer className="pb-6 pt-1 text-center text-sm text-slate-500">
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
  return <p className="rounded-2xl bg-white/70 px-5 py-6 text-center text-sm text-slate-500">{children}</p>;
}
