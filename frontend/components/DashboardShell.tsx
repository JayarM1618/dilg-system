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
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <BrandMark tone="dark" href={info.home} />
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <p className="font-semibold">{user.name}</p>
              <p className="text-muted">{info.label}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="rounded-md border border-line px-3.5 py-2 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {info.nav.length > 1 && (
        <nav aria-label="Dashboard" className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl gap-6 px-5 sm:px-8">
            {info.nav.map((item) => {
              const active = item.href === info.home ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
                    active ? "border-navy-900 text-navy-900" : "border-transparent text-muted hover:text-navy-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
