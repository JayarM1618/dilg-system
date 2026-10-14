"use client";

import Link from "next/link";

interface RealtimePeriodTallyProps {
  total: number;
  compliant: number;
  underReview: number;
  pending: number;
  nonCompliant: number;
  complianceRate: number;
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function RealtimePeriodTally({
  total,
  compliant,
  underReview,
  pending,
  nonCompliant,
  complianceRate,
  title = "Current Period Tally",
  subtitle = "Progress toward compliance clearance",
  actionHref = "/user",
  actionLabel = "Inspect active reports",
}: RealtimePeriodTallyProps) {
  // Proportions for concentric rings (clamped 0 to 1)
  const safeTotal = Math.max(1, total);
  const filedCount = compliant + underReview;
  const filedPct = Math.min(1, Math.max(0.08, filedCount / safeTotal));
  const reviewPct = Math.min(1, Math.max(0.08, underReview / safeTotal));
  const compliantPct = Math.min(1, Math.max(0.08, compliant / safeTotal));

  // Concentric ring radii and circumferences
  const rOuter = 46;
  const cOuter = 2 * Math.PI * rOuter; // ~289

  const rMiddle = 35;
  const cMiddle = 2 * Math.PI * rMiddle; // ~220

  const rInner = 24;
  const cInner = 2 * Math.PI * rInner; // ~150

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-[#2C2145] px-2.5 py-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF] border border-[#7B4DFF]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7B4DFF] animate-pulse" />
            Live Tally
          </span>
        </div>

        {/* Rings & Legend Layout */}
        <div className="mt-6 flex items-center justify-between gap-5">
          {/* Legend Items */}
          <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F21DB4]" />
              <span className="font-medium">Filed Submissions:</span>
              <strong className="text-slate-900 dark:text-white font-bold ml-1">{filedCount}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7B4DFF]" />
              <span className="font-medium">In Office Review:</span>
              <strong className="text-slate-900 dark:text-white font-bold ml-1">{underReview}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06D6A0]" />
              <span className="font-medium">Compliant &amp; Cleared:</span>
              <strong className="text-[#059669] dark:text-[#84DEBD] font-bold ml-1">{compliant}</strong>
            </li>
            {nonCompliant > 0 && (
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="font-medium text-rose-600 dark:text-rose-400">Needs Fixing:</span>
                <strong className="text-rose-600 dark:text-rose-400 font-bold ml-1">{nonCompliant}</strong>
              </li>
            )}
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="font-medium text-slate-500 dark:text-slate-400">Awaiting Filing:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold ml-1">{pending}</strong>
            </li>
          </ul>

          {/* SVG Concentric Gauge */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="h-28 w-28 sm:h-32 sm:w-32 -rotate-90 drop-shadow-sm select-none"
              role="img"
              aria-label="Concentric progress rings for filed, reviewed, and compliant rates"
            >
              {/* Background Tracks */}
              <circle cx="60" cy="60" r={rOuter} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="6" />
              <circle cx="60" cy="60" r={rMiddle} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="6" />
              <circle cx="60" cy="60" r={rInner} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="6" />

              {/* Outer Ring: Filed */}
              <circle
                cx="60"
                cy="60"
                r={rOuter}
                fill="none"
                stroke="#F21DB4"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${cOuter * filedPct} ${cOuter}`}
                className="transition-all duration-700 ease-out"
              />

              {/* Middle Ring: In Review */}
              <circle
                cx="60"
                cy="60"
                r={rMiddle}
                fill="none"
                stroke="#7B4DFF"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${cMiddle * reviewPct} ${cMiddle}`}
                className="transition-all duration-700 ease-out"
              />

              {/* Inner Ring: Compliant */}
              <circle
                cx="60"
                cy="60"
                r={rInner}
                fill="none"
                stroke="#06D6A0"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${cInner * compliantPct} ${cInner}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Center Rate Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {Math.round(complianceRate)}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {total > 0 ? `${compliant} compliant &bull; ${pending} pending filing` : "100% compliant"}
        </span>
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 dark:border-white/15 px-3.5 py-1.5 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF] hover:bg-[#7B4DFF] hover:text-white transition-colors"
        >
          {actionLabel} &rarr;
        </Link>
      </div>
    </div>
  );
}
