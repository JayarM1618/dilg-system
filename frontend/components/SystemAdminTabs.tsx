"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODULES = [
  {
    href: "/talaghayan/settings",
    label: "Settings & Config",
    badge: "General · Broadcasts · Logs",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    href: "/talaghayan/security",
    label: "Security & Access",
    badge: "Telemetry · IP Blocks · Sessions",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/talaghayan/archive",
    label: "Archive Center",
    badge: "Recycle Bin · Restore Vault",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
  },
  {
    href: "/talaghayan/system",
    label: "System Health & Data",
    badge: "Diagnostics · Storage · Exports",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
] as const;

export default function SystemAdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-black/25 p-1.5 backdrop-blur-md">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {MODULES.map((m) => {
          const active = pathname.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                active
                  ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm ring-1 ring-slate-200/60 dark:ring-white/10 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 font-medium"
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  active
                    ? "bg-[#7B4DFF]/15 text-[#7B4DFF] dark:bg-[#7B4DFF]/25 dark:text-[#CDBBFF]"
                    : "bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}
              >
                {m.icon}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs sm:text-sm leading-tight truncate">{m.label}</p>
                <p className="text-[10px] leading-tight text-slate-400 dark:text-slate-500 truncate mt-0.5 hidden sm:block">
                  {m.badge}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

