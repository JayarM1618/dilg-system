"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The 3 Rs as the main navigation: Repository, Resources, Reports.
 * Works under /user, /admin and /super-admin (it reads the first URL segment),
 * so it does not depend on your layout files.
 */
export default function ThreeRsTabs() {
  const pathname = usePathname() ?? "";
  const base = "/" + (pathname.split("/")[1] ?? "");

  const tabs = [
    { href: base, label: "Overview", match: (p: string) => p === base },
    { href: `${base}/repository`, label: "Repository", match: (p: string) => p.startsWith(`${base}/repository`) },
    { href: `${base}/resources`, label: "Resources", match: (p: string) => p.startsWith(`${base}/resources`) },
    { href: `${base}/reports`, label: "Reports", match: (p: string) => p.startsWith(`${base}/reports`) },
  ];

  return (
    <nav aria-label="Repository, Resources and Reports" className="mb-6 flex overflow-x-auto scrollbar-none gap-1 border-b border-line dark:border-white/10 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              active
                ? "border-navy-800 text-navy-900 dark:border-[#B9A2FF] dark:text-[#E3D5FF]"
                : "border-transparent text-muted dark:text-slate-400 hover:border-line dark:hover:border-white/20 hover:text-navy-800 dark:hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
