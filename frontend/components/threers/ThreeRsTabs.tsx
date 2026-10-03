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
    <nav aria-label="Repository, Resources and Reports" className="mb-6 flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              active
                ? "border-navy-800 text-navy-900"
                : "border-transparent text-muted hover:border-line hover:text-navy-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
