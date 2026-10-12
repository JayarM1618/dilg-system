"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_INFO, homeFor } from "@/lib/roles";
import type { Role } from "@/types";

/**
 * Header, role guard and tabs shared by every signed-in area.
 *  - not signed in          -> /login
 *  - signed in as wrong role -> that role's own home
 */
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
              <button
                onClick={() => void logout()}
                className="rounded-full border border-[#EDE7FA] dark:border-[#2B2542] px-3.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors duration-500 ease-out hover:bg-white/50 dark:hover:bg-[#2B2542]/50"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {info.nav.length > 1 && (
          <nav aria-label="Dashboard" className="border-b border-[#EDE7FA] dark:border-[#2B2542] bg-white/20 dark:bg-black/10 overflow-x-auto scrollbar-none">
            <div className="mx-auto flex w-full min-w-max gap-4 sm:gap-6 px-4 sm:px-8">
              {info.nav.map((item) => {
                const active = item.href === info.home ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`-mb-px border-b-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-500 ease-out ${
                      active ? "border-[#7B4DFF] text-[#5A18C9] dark:border-[#B9A2FF] dark:text-[#E3D5FF] transition-colors duration-500 ease-out" : "border-transparent text-slate-500 dark:text-[#7C6FA3] transition-colors duration-500 ease-out hover:text-[#1B1235] dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        <main className="w-full px-4 py-6 sm:px-8 sm:py-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
