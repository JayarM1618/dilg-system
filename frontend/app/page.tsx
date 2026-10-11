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
      className={`${poppins.className} relative flex min-h-screen flex-col overflow-hidden text-[#1B1235] dark:text-[#EDE7FA] transition-colors duration-500 ease-out`}
    >

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-5 sm:py-12 text-center">
        <BrandMark />

        <h1 className="mt-6 sm:mt-8 text-2xl font-medium tracking-tight sm:text-4xl text-[#1B1235] dark:text-[#EDE7FA] transition-colors duration-500 ease-out">Welcome to Talaghayan</h1>
        <p className="mt-2 sm:mt-3 max-w-xl text-sm sm:text-base text-slate-600 dark:text-[#C9BCEB] transition-colors duration-500 ease-out">
          Choose how you want to continue. Sign in with your account, or just look around in the Citizens View.
        </p>

        <ul className="mt-8 sm:mt-10 flex flex-wrap items-stretch justify-center gap-4 sm:gap-5">
          {/* The signed-in account, if there is one */}
          {!loading && user && (
            <li>
              <ProfileTile
                href={homeFor(user.role)}
                title={user.name}
                subtitle={`Continue as ${ROLE_INFO[user.role].label}`}
                avatar={<span className="text-3xl font-medium">{user.name.trim().charAt(0).toUpperCase()}</span>}
                avatarClass="bg-[#06D6A0] text-[#04382B] group-hover:bg-[#04382B] group-hover:text-white"
                hoverBg="hover:bg-[#06D6A0]/20 dark:hover:bg-[#06D6A0]/30"
              />
            </li>
          )}

          <li>
            <ProfileTile
              href="/barangays"
              title="Barangay"
              subtitle="Representative sign-in"
              avatar={<BuildingIcon />}
              avatarClass="bg-[#E3D5FF] text-[#5A18C9] group-hover:bg-[#5A18C9] group-hover:text-white"
              hoverBg="hover:bg-[#5A18C9]/15 dark:hover:bg-[#5A18C9]/30"
            />
          </li>

          <li>
            <ProfileTile
              href="/dilg"
              title="DILG Office"
              subtitle="Admin & supervisor sign-in"
              avatar={<ShieldIcon />}
              avatarClass="bg-[#FFF0A3] text-[#7A5B00] group-hover:bg-[#FFB703] group-hover:text-white"
              hoverBg="hover:bg-[#FFB703]/15 dark:hover:bg-[#FFB703]/30"
            />
          </li>
        </ul>

        {!loading && user && (
          <button
            type="button"
            onClick={() => logout()}
            className={`mt-8 rounded-full px-4 py-2 text-sm text-slate-600 dark:text-[#C9BCEB] transition-colors duration-500 ease-out underline-offset-4 hover:underline ${focusRing}`}
          >
            Not {user.name.split(" ")[0]}? Sign out
          </button>
        )}
      </main>

      {/* Guest mode, named "Citizens View" */}
      <footer className="relative flex justify-center sm:justify-start px-5 pb-8 sm:px-10">
        <Link
          href="/citizens"
          className={`inline-flex items-center gap-3 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/40 dark:border-white/10 px-6 py-3 text-base font-semibold text-[#5A18C9] dark:text-[#E9DFFF] transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-black/40 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,1)] dark:hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] ${focusRing}`}
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
  hoverBg,
}: {
  href: string;
  title: string;
  subtitle: string;
  avatar: React.ReactNode;
  avatarClass: string;
  hoverBg: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full w-44 sm:w-52 flex-col items-center gap-3 sm:gap-4 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/40 dark:border-white/10 px-4 sm:px-5 py-6 sm:py-8 transition-all duration-500 ease-out hover:-translate-y-2 ${hoverBg} hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,1)] dark:hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] ${focusRing}`}
    >
      <span className="text-sm font-semibold text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">{title}</span>
      <span className={`grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full transition-all duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1 ${avatarClass}`} aria-hidden="true">
        {avatar}
      </span>
      <span className="text-xs sm:text-sm text-slate-600 dark:text-[#C9BCEB] transition-colors duration-500 ease-out">{subtitle}</span>
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
