"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_INFO, homeFor } from "@/lib/roles";
import type { Role } from "@/types";

/**
 * Header, role guard and tabs shared by every signed-in area.
 *  - not signed in          -> /login
 *  - signed in as wrong role -> that role's own home
 */
function getNavIcon(label: string) {
  switch (label.toLowerCase()) {
    case "supervisor hub":
    case "barangay hub":
    case "talaghayan hub":
    case "hub":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "monitoring":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "accounts":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "barangays":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "borms":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "bagwis":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "my reports":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "announcements & programs":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function getBreadcrumbLabel(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Home";
  const last = parts[parts.length - 1];
  switch (last) {
    case "users":
      return "Accounts";
    case "borms":
      return "BORMS";
    case "bagwis":
      return "Bagwis";
    case "monitoring":
      return "Monitoring";
    case "barangays":
      return "Barangays";
    case "compliance":
      return "Compliance";
    case "security":
      return "Security";
    case "reports":
      return "Reports";
    case "requirements":
      return "Requirements";
    case "resources":
      return "Resources";
    case "repository":
      return "Repository";
    case "community":
      return "Announcements & Programs";
    default:
      return last.replace(/-/g, " ");
  }
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

export default function DashboardShell({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !!user && allow.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(homeFor(user.role));
  }, [loading, user, allowed, router]);

  if (loading || !user || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper" role="status">
        <p className="text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  const info = ROLE_INFO[user.role];

  return (
    <div className="min-h-screen text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out p-3 sm:p-6 lg:p-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden bg-white/40 dark:bg-[#1B142F]/40 backdrop-blur-3xl shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] border border-white/40 dark:border-white/10 rounded-2xl sm:rounded-[2rem] sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)] transition-colors duration-500 ease-out">

        <header className="border-b border-[#EDE7FA] dark:border-[#2B2542]">
          <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
            <BrandMark tone="dark" href={info.home} />
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden text-right text-sm leading-tight sm:block">
                <p className="font-semibold">{user.name}</p>
                <p className="text-slate-500 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">{info.label}</p>
              </div>
              <NotificationBell />
              <button
                onClick={() => void logout()}
                className={`rounded-full border border-[#EDE7FA] dark:border-[#2B2542] px-3.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors duration-500 ease-out hover:bg-white/50 dark:hover:bg-[#2B2542]/50 ${focusRing}`}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {info.nav.length > 0 && (
          <nav
            aria-label="Dashboard"
            className="border-b border-[#EDE7FA] dark:border-[#2B2542] bg-white/40 dark:bg-black/20 px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-none"
          >
            <div className="mx-auto flex w-full min-w-max items-center gap-2">
              {info.nav.map((item) => {
                const active = item.href === info.home ? pathname === item.href : pathname.startsWith(item.href);
                const icon = getNavIcon(item.label);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${focusRing} ${
                      active
                        ? "bg-[#7B4DFF] text-white shadow-md shadow-[#7B4DFF]/30 dark:shadow-[#7B4DFF]/20"
                        : "text-slate-600 dark:text-[#C9BCEB] hover:bg-slate-200/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-md transition-colors ${
                        active
                          ? "text-white"
                          : "text-slate-400 dark:text-[#7C6FA3] group-hover:text-slate-700 dark:group-hover:text-white"
                      }`}
                    >
                      {icon}
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        <main className="w-full px-4 py-6 sm:px-8 sm:py-8 flex-1">
          {pathname !== info.home && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE7FA]/70 dark:border-white/10 pb-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push(info.home);
                  }
                }}
                className={`group inline-flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-[#E0D5FC] shadow-sm backdrop-blur-md transition-all hover:border-[#7B4DFF]/60 hover:bg-[#F3EDFE] dark:hover:bg-[#7B4DFF]/20 hover:text-[#5A18C9] dark:hover:text-white active:scale-95 ${focusRing}`}
                aria-label="Back to previous page"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:-translate-x-1"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>

              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-[#7C6FA3]">
                <Link
                  href={info.home}
                  className="hover:text-[#5A18C9] dark:hover:text-[#CDBBFF] hover:underline transition-colors"
                >
                  {user.role === "super_admin"
                    ? "Talaghayan Hub"
                    : user.role === "office_supervisor"
                    ? "Supervisor Hub"
                    : "Barangay Hub"}
                </Link>
                <span>/</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                  {getBreadcrumbLabel(pathname)}
                </span>
              </nav>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
