"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";

/**
 * The 3 Rs as the main navigation: Repository, Resources, Reports.
 * Works under /user, /admin and /super-admin (it reads the first URL segment),
 * so it does not depend on your layout files.
 */
export default function ThreeRsTabs() {
  const pathname = usePathname() ?? "";
  const base = "/" + (pathname.split("/")[1] ?? "");
  const { user } = useAuth();
  // Small number on the Requirements tab: what a barangay still has to do,
  // or what is waiting for DILG to review.
  const counts = useFetch<{ to_do?: number; awaiting_review?: number }>(user ? "/api/requirements/summary" : null);
  const badge = user?.role === "barangay_rep" ? counts.data?.to_do ?? 0 : counts.data?.awaiting_review ?? 0;

  const tabs = [
    {
      href: base,
      label: "Overview",
      match: (p: string) => p === base,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      href: `${base}/requirements`,
      label: "Requirements",
      description: "Sent & Complied",
      match: (p: string) => p.startsWith(`${base}/requirements`),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4z" />
        </svg>
      ),
    },
    {
      href: `${base}/repository`,
      label: "Repository",
      description: "Archived & Filed",
      match: (p: string) => p.startsWith(`${base}/repository`),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: `${base}/resources`,
      label: "Resources",
      description: "Official Forms",
      match: (p: string) => p.startsWith(`${base}/resources`),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      href: `${base}/reports`,
      label: "Reports",
      description: "Due & Submissions",
      match: (p: string) => p.startsWith(`${base}/reports`),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-8">
      {/* Container for segment buttons */}
      <nav
        aria-label="Repository, Resources and Reports"
        className="flex items-center gap-2 overflow-x-auto scrollbar-none rounded-2xl bg-slate-100/80 dark:bg-black/30 p-1.5 border border-slate-200/80 dark:border-white/10"
      >
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors select-none ${
                active
                  ? "bg-white dark:bg-[#0F172A] text-[#002B7F] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/15"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-lg transition-colors ${
                  active
                    ? "bg-[#EBF2FF] text-[#0039A6] dark:bg-[#0039A6]/30 dark:text-[#93C5FD]"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {t.icon}
              </span>
              <span>{t.label}</span>
              {t.label === "Requirements" && badge > 0 && (
                <span className="rounded-full bg-[#F21D6B] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{badge}</span>
              )}
              {active && (
                <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-[#0039A6] dark:bg-[#06D6A0]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
