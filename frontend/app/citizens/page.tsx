"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PublicFrame, { Chip, DateBadge, EmptyNote, card, focusRing } from "@/components/public/PublicFrame";
import { usePublicOverview } from "@/hooks/usePublicOverview";
import { AVATARS, initials, normalizeName } from "@/lib/barangays";
import { badgeParts, eventWhen, formatLongDate } from "@/lib/publicInfo";

const CYCLE_LABEL: Record<string, string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
  semestral: "Twice a year",
  annual: "Once a year",
};

/** Citizens View: the same look as the homepage, read-only, no sign-in. All data comes from Laravel. */
export default function CitizensPage() {
  const { barangays, categories, stats, events, announcements, loading, error, retry } = usePublicOverview();
  const [query, setQuery] = useState("");

  const q = normalizeName(query);
  const shown = useMemo(
    () => barangays.filter((b) => !q || normalizeName(b.name).includes(q) || b.code.toLowerCase().includes(q)),
    [q, barangays],
  );

  return (
    <PublicFrame>
      {/* ---------- Row 1: hero + upcoming events + announcements ---------- */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${card} flex flex-col bg-[#E6FBF3]/70 dark:bg-[#1C362F]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-5 transition-all duration-500 ease-out`} aria-labelledby="hero-title">
          <p className="text-sm font-medium text-[#2C5A4D] dark:text-[#84DEBD] transition-colors duration-500 ease-out">Talaghayan &middot; Citizens View</p>
          <h1 id="hero-title" className="mt-3 text-balance text-2xl font-semibold leading-tight text-[#0E2B24] dark:text-[#E8F8F3] transition-colors duration-500 ease-out sm:text-4xl">
            Know what is happening in your barangay.
          </h1>
          <p className="mt-3 max-w-[44ch] text-sm sm:text-base leading-6 sm:leading-7 text-[#2C5A4D] dark:text-[#84DEBD] transition-colors duration-500 ease-out">
            Browse announcements, the calendar of upcoming events and the programs of every barangay in Makati. No
            account needed.
          </p>

          <div className="mt-auto grid grid-cols-2 gap-3 sm:gap-4 pt-6 sm:pt-7">
            <StatTile value={loading ? "…" : barangays.length} label="Barangays" />
            <StatTile value={loading ? "…" : stats.upcoming_events} label="Upcoming events" />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <a href="#barangays" className={`text-center rounded-full bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] ${focusRing}`}>
              Find your barangay
            </a>
          </div>
        </section>

        <section className={`${card} bg-[#F3EDFE]/70 dark:bg-[#2A233D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-4 transition-all duration-500 ease-out`} aria-labelledby="events-title">
          <h2 id="events-title" className="text-xl font-medium text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Coming up in Makati</h2>
          <p className="mt-1 text-sm text-[#5B4C8A] dark:text-[#B6A3E8] transition-colors duration-500 ease-out">The next events across all barangays</p>
          <ul className="mt-4 space-y-3">
            {loading ? (
              <li><EmptyNote>Loading&hellip;</EmptyNote></li>
            ) : events.length === 0 ? (
              <li><EmptyNote>No upcoming events have been posted yet.</EmptyNote></li>
            ) : (
              events.slice(0, 4).map((e) => (
                <li key={e.id} className="flex gap-3 rounded-2xl bg-white dark:bg-[#362E4D] p-3">
                  <DateBadge {...badgeParts(e.starts_at!)} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-out">{e.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">{eventWhen(e)}</p>
                    {e.barangay && (
                      <Link href={`/citizens/${e.barangay.id}`} className={`text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors duration-500 ease-out underline-offset-4 hover:underline ${focusRing}`}>
                        {e.barangay.name}
                      </Link>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={`${card} bg-[#FFF8E6]/70 dark:bg-[#382C10]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-3 transition-all duration-500 ease-out`} aria-labelledby="ann-title">
          <h2 id="ann-title" className="text-xl font-medium text-[#2A2000] dark:text-[#FBE5A1] transition-colors duration-500 ease-out">Announcements</h2>
          <p className="mt-1 text-sm text-[#5C4600] dark:text-[#C7A340] transition-colors duration-500 ease-out"><b className="font-semibold text-[#F5A800]">Latest</b> from the barangays</p>
          <ul className="mt-4 space-y-3">
            {loading ? (
              <li><EmptyNote>Loading&hellip;</EmptyNote></li>
            ) : announcements.length === 0 ? (
              <li><EmptyNote>No announcements yet.</EmptyNote></li>
            ) : (
              announcements.slice(0, 3).map((a) => (
                <li key={a.id} className="rounded-2xl bg-white dark:bg-[#4E3D18] p-3">
                  <p className="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-out">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-500 ease-out">{formatLongDate(a.published_at)}</p>
                  {a.barangay && (
                    <Link href={`/citizens/${a.barangay.id}`} className={`text-sm font-semibold text-[#8A6300] dark:text-[#FBE5A1] transition-colors duration-500 ease-out underline-offset-4 hover:underline ${focusRing}`}>
                      {a.barangay.name}
                    </Link>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* ---------- Row 2: barangay directory ---------- */}
      <section id="barangays" className={`${card} scroll-mt-6 bg-[#F1F0FB]/70 dark:bg-[#1E192D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none p-4 sm:p-8 transition-all duration-500 ease-out`} aria-labelledby="barangays-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="barangays-title" className="text-2xl font-semibold text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Barangays of Makati</h2>
            <p className="mt-1 max-w-[56ch] text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">
              Select a barangay to see its announcements, upcoming events and programs.
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search barangays</span>
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search barangay"
              className="w-full rounded-xl bg-white dark:bg-black/30 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-[#E3DEF5] dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#7B4DFF]"
            />
          </label>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-black/20 border border-line/40 dark:border-white/10 px-6 py-10 text-center text-slate-500 dark:text-slate-400" role="status">Loading barangays&hellip;</div>
        ) : error ? (
          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-black/20 border border-line/40 dark:border-white/10 px-6 py-10 text-center" role="alert">
            <p className="font-medium text-slate-800 dark:text-slate-200">Couldn&apos;t load the information.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <button onClick={retry} className={`mt-3 rounded-full bg-[#7B4DFF] px-5 py-2 text-sm font-semibold text-white ${focusRing}`}>Try again</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-black/20 border border-line/40 dark:border-white/10 px-6 py-10 text-center" role="status">
            <p className="font-medium text-slate-800 dark:text-slate-200">No barangay matches &ldquo;{query}&rdquo;.</p>
            <button onClick={() => setQuery("")} className={`mt-2 text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] underline underline-offset-4 ${focusRing}`}>
              Show all {barangays.length} barangays
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((b) => {
              const av = AVATARS[barangays.indexOf(b) % AVATARS.length];
              return (
                <li key={b.id}>
                  <Link
                    href={`/citizens/${b.id}`}
                    className={`group flex w-full items-center gap-3 rounded-2xl bg-white/70 dark:bg-[#1B142F]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md p-3 pr-4 ring-1 ring-[#E8E3F7] dark:ring-white/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:bg-white dark:hover:bg-[#352D52]/80 dark:hover:ring-[#7B4DFF] ${focusRing}`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold transition-transform duration-500 ease-out group-hover:scale-110" style={{ backgroundColor: av.bg, color: av.fg }} aria-hidden="true">
                      {initials(b.name)}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-out">{b.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 transition-colors duration-500 ease-out">{b.code}</span>
                    </span>
                    <svg className="shrink-0 text-[#7B4DFF]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-slate-500" aria-live="polite">Showing {shown.length} of {barangays.length} barangays</p>
      </section>

      {/* ---------- Row 3: what barangays report ---------- */}
      {categories.length > 0 && (
        <section className={`${card} bg-[#E8FAFF]/70 dark:bg-[#15343B]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none p-4 sm:p-8 transition-all duration-500 ease-out`} aria-labelledby="cat-title">
          <h2 id="cat-title" className="text-2xl font-semibold text-[#0B2A36] dark:text-white transition-colors duration-500 ease-out">What barangays report to DILG</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">Every barangay files these reports so the city can keep track of how local government is doing.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id} className="rounded-2xl bg-white/70 dark:bg-[#0B1E22]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md p-4">
                <p className="font-semibold text-slate-900 dark:text-[#E8FAFF] transition-colors duration-500 ease-out">{c.name}</p>
                <div className="mt-1"><Chip bg="#C5F0FF" fg="#0B6180">{CYCLE_LABEL[c.cycle] ?? c.cycle}</Chip></div>
                {c.description && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">{c.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </PublicFrame>
  );
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-[#06D6A0] px-4 py-5 text-center text-[#04281F]">
      <p className="text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

