"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { homeFor, ROLE_LABELS } from "@/lib/format";

/**
 * Wraps every /dashboard/* page:
 *  - not signed in            -> /login
 *  - barangay rep on admin UI -> /dashboard      (and office staff the other way round)
 * Real security is enforced by the Laravel API; this only keeps people on the right screen.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const inAdminArea = pathname.startsWith("/dashboard/admin");
  const isOffice = !!user && user.role !== "barangay_rep";
  const wrongArea = !!user && (inAdminArea ? !isOffice : isOffice);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (wrongArea) router.replace(homeFor(user.role));
  }, [loading, user, wrongArea, router]);

  if (loading || !user || wrongArea) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper" role="status">
        <p className="text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <BrandMark tone="dark" href={homeFor(user.role)} />
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <p className="font-semibold">{user.name}</p>
              <p className="text-muted">{ROLE_LABELS[user.role] ?? user.role}</p>
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

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
