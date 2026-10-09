"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_INFO, homeFor } from "@/lib/roles";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9A2FF]";

/**
 * "Who's using Talaghayan?" - the first screen, modelled on a browser profile picker.
 * Pick an account to sign in, or go to the Citizens View (the guest mode, no sign-in).
 * This page only routes people; every permission is enforced by Laravel.
 */
export default function ChooserPage() {
  const { user, loading, logout } = useAuth();

  return (
    <div
      className={`${poppins.className} relative flex min-h-screen flex-col overflow-hidden bg-[#17112B] text-[#EDE7FA]`}
    >
      {/* soft colour glows in the corners */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 0% 0%, rgba(6,214,160,0.20), transparent 70%), radial-gradient(55% 40% at 100% 0%, rgba(245,184,0,0.16), transparent 70%), radial-gradient(60% 45% at 100% 100%, rgba(123,77,255,0.35), transparent 70%), radial-gradient(50% 40% at 0% 100%, rgba(242,29,180,0.16), transparent 70%)",
        }}
      />

      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        <BrandMark />

        <h1 className="mt-8 text-3xl font-medium tracking-tight sm:text-4xl">Welcome to Talaghayan</h1>
        <p className="mt-3 max-w-xl text-base text-[#C9BCEB]">
          Choose how you want to continue. Sign in with your account, or just look around in the Citizens View.
        </p>

        <ul className="mt-10 flex flex-wrap items-stretch justify-center gap-5">
          {/* The signed-in account, if there is one */}
          {!loading && user && (
            <li>
              <ProfileTile
                href={homeFor(user.role)}
                title={user.name}
                subtitle={`Continue as ${ROLE_INFO[user.role].label}`}
                avatar={<span className="text-3xl font-medium">{user.name.trim().charAt(0).toUpperCase()}</span>}
                avatarClass="bg-[#06D6A0] text-[#04382B]"
              />
            </li>
          )}

          <li>
            <ProfileTile
              href="/barangays"
              title="Barangay"
              subtitle="Representative sign-in"
              avatar={<BuildingIcon />}
              avatarClass="bg-[#E3D5FF] text-[#5A18C9]"
            />
          </li>

          <li>
            <ProfileTile
              href="/login"
              title="DILG Office"
              subtitle="Admin & supervisor sign-in"
              avatar={<ShieldIcon />}
              avatarClass="bg-[#FFF0A3] text-[#7A5B00]"
            />
          </li>
        </ul>

        {!loading && user && (
          <button
            type="button"
            onClick={() => logout()}
            className={`mt-8 rounded-full px-4 py-2 text-sm text-[#C9BCEB] underline-offset-4 hover:underline ${focusRing}`}
          >
            Not {user.name.split(" ")[0]}? Sign out
          </button>
        )}
      </main>

      {/* Guest mode, named "Citizens View" */}
      <footer className="relative px-5 pb-8 sm:px-10">
        <Link
          href="/citizens"
          className={`inline-flex items-center gap-3 rounded-full border border-[#7B4DFF]/70 px-6 py-3 text-base font-semibold text-[#CDBBFF] transition-colors hover:bg-[#7B4DFF]/15 ${focusRing}`}
        >
          <PersonFrameIcon />
          Citizens View
        </Link>
      </footer>
    </div>
  );
}

function ProfileTile({
  href,
  title,
  subtitle,
  avatar,
  avatarClass,
}: {
  href: string;
  title: string;
  subtitle: string;
  avatar: React.ReactNode;
  avatarClass: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full w-52 flex-col items-center gap-4 rounded-2xl bg-[#2B2542] px-5 py-7 transition-all hover:-translate-y-1 hover:bg-[#352D52] ${focusRing}`}
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className={`grid h-24 w-24 place-items-center rounded-full ${avatarClass}`} aria-hidden="true">
        {avatar}
      </span>
      <span className="text-sm text-[#C9BCEB]">{subtitle}</span>
    </Link>
  );
}

/* ---------- icons ---------- */

function BuildingIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V9l8-5 8 5v12M2 21h20M9 21v-6h6v6M9 11h.01M15 11h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PersonFrameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19c1-2.6 3.1-4 5.5-4s4.5 1.4 5.5 4" />
    </svg>
  );
}
