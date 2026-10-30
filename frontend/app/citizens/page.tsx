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

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Official Announcements",
    body: "Receive verified public advisories, notices, and updates published directly by your barangay council.",
    color: "#0039A6",
  },
  {
    step: "02",
    title: "Community Calendar",
    body: "Track upcoming barangay assemblies, free health clinics, vaccinations, and town hall meetings in real time.",
    color: "#059669",
  },
  {
    step: "03",
    title: "Barangay Services",
    body: "Explore ongoing community programs, livelihood opportunities, and social welfare services in Makati.",
    color: "#D97706",
  },
  {
    step: "04",
    title: "DILG Transparency",
    body: "Stay informed with government compliance metrics and official submission timelines without needing an account.",
    color: "#2563EB",
  },
];

const CITIZEN_FAQS = [
  {
    q: "Do I need to sign up or create an account to view barangay information?",
    a: "No! The Talaghayan Citizens Portal is completely public. Anyone can browse announcements, upcoming community events, office hours, and programs for every barangay in Makati freely.",
  },
  {
    q: "How frequently is the community calendar and announcements updated?",
    a: "Each barangay's designated representative uploads and manages events and announcements in real time as they are scheduled or published by the barangay hall.",
  },
  {
    q: "How do I contact my local barangay hall for clearances or assistance?",
    a: "Click on your barangay from the list below. You will find their verified office hours, physical hall address, and direct hotline contact number right on their page.",
  },
  {
    q: "What is the role of DILG Makati in this portal?",
    a: "The Department of the Interior and Local Government (DILG) Makati oversees monitoring, governance standards, and report compliance across all barangays, ensuring accountability and timely service delivery to citizens.",
  },
];

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
      <div className="space-y-6 sm:space-y-8">
        {/* ================================================================ */}
        {/* ROW 1: Wide Landscape Hero Panel Card                           */}
        {/* ================================================================ */}
        <section
          className={`${card} relative overflow-hidden bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-10 transition-all duration-500`}
          aria-labelledby="hero-title"
        >
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Heading, description, actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <span className="h-2 w-2 rounded-full bg-[#059669]" />
                Talaghayan &middot; Makati Citizens Portal
              </div>

              <h1
                id="hero-title"
                className="mt-4 text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-500 leading-[1.15]"
              >
                Know what is happening in your barangay.
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 transition-colors duration-500">
                Browse announcements, the calendar of upcoming events, and official community programs across every
                barangay in Makati. Completely transparent, verified by DILG, with no account needed.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#barangays"
                  className={`inline-flex items-center gap-2 rounded-full bg-[#0039A6] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#002B7F] transition-colors ${focusRing}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  Find your barangay
                </a>

                <a
                  href="#events-announcements"
                  className={`inline-flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 transition-all duration-200 ${focusRing}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Upcoming events
                </a>

                <a
                  href="#faqs"
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-[#0039A6] hover:underline underline-offset-4 ${focusRing}`}
                >
                  Frequently asked questions
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Column: Landscape Stats Cards */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <LandscapeStatTile
                  value={loading ? "…" : barangays.length}
                  label="Active Barangays"
                  subtext="Makati City coverage"
                  icon="buildings"
                  color="#059669"
                />
                <LandscapeStatTile
                  value={loading ? "…" : stats.upcoming_events}
                  label="Upcoming Events"
                  subtext="Across all districts"
                  icon="calendar"
                  color="#0039A6"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Public Bulletins</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {loading ? "Loading…" : `${announcements.length} Latest announcements available`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Updated daily</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* ROW 2: Two Balanced Landscape Columns: Events & Announcements   */}
        {/* ================================================================ */}
        <div id="events-announcements" className="grid gap-6 lg:grid-cols-2 scroll-mt-6">
          {/* Column 1: Upcoming Events in Makati */}
          <section
            className={`${card} flex flex-col bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-500`}
            aria-labelledby="events-title"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0039A6] text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>
                <div>
                  <h2 id="events-title" className="text-xl font-bold text-slate-900 dark:text-white">
                    Coming up in Makati
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Community calendar across all barangays</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold text-[#0039A6] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {events.length} scheduled
              </span>
            </div>

            <ul className="mt-4 space-y-3 flex-1">
              {loading ? (
                <li><EmptyNote>Loading upcoming events&hellip;</EmptyNote></li>
              ) : events.length === 0 ? (
                <li><EmptyNote>No upcoming events posted at this moment.</EmptyNote></li>
              ) : (
                events.slice(0, 4).map((e) => (
                  <li
                    key={e.id}
                    className="group flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-white/5 p-3.5 border border-slate-200 dark:border-white/10 hover:border-[#0039A6] transition-all duration-200"
                  >
                    <DateBadge {...badgeParts(e.starts_at!)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0039A6] transition-colors">
                        {e.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {eventWhen(e)}
                        </span>
                        {e.venue && (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            &bull; {e.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    {e.barangay && (
                      <Link
                        href={`/citizens/${e.barangay.id}`}
                        className={`shrink-0 rounded-full bg-blue-50 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#0039A6] dark:text-blue-300 hover:bg-[#0039A6] hover:text-white dark:hover:bg-[#0039A6] dark:hover:text-white transition-all ${focusRing}`}
                      >
                        {e.barangay.name} &rarr;
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Column 2: Announcements */}
          <section
            className={`${card} flex flex-col bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-500`}
            aria-labelledby="ann-title"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-600 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </span>
                <div>
                  <h2 id="ann-title" className="text-xl font-bold text-slate-900 dark:text-white">
                    Barangay Announcements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official notices, advisories and circulars</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                Latest feeds
              </span>
            </div>

            <ul className="mt-4 space-y-3 flex-1">
              {loading ? (
                <li><EmptyNote>Loading announcements&hellip;</EmptyNote></li>
              ) : announcements.length === 0 ? (
                <li><EmptyNote>No announcements posted yet.</EmptyNote></li>
              ) : (
                announcements.slice(0, 3).map((a) => (
                  <li
                    key={a.id}
                    className="group rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 hover:border-amber-500 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {a.is_pinned && (
                          <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            PINNED
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatLongDate(a.published_at)}
                        </span>
                      </div>
                      {a.barangay && (
                        <Link
                          href={`/citizens/${a.barangay.id}`}
                          className={`text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline ${focusRing}`}
                        >
                          {a.barangay.name}
                        </Link>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {a.title}
                    </h3>
                    {a.body && (
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {a.body}
                      </p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* ================================================================ */}
        {/* ROW 3: "How Talaghayan Works for Citizens" (Landscape Columns)  */}
        {/* ================================================================ */}
        <section
          className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
          aria-labelledby="how-it-works-title"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0039A6]">
              Portal Guide &amp; Features
            </span>
            <h2 id="how-it-works-title" className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              How the Citizens View works for you
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Designed for public access and civic engagement without account barriers or complicated portals.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="flex flex-col justify-between rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10 hover:border-[#0039A6] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-black tracking-widest px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.step}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* ROW 4: Barangays of Makati Directory (Landscape Grid)           */}
        {/* ================================================================ */}
        <section
          id="barangays"
          className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
          aria-labelledby="barangays-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0039A6]">
                Makati Barangay Directory
              </span>
              <h2 id="barangays-title" className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Select your barangay
              </h2>
              <p className="mt-1 max-w-[56ch] text-sm text-slate-600 dark:text-slate-300">
                Click any barangay card to view its calendar, direct hotline, location, and community programs.
              </p>
            </div>

            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Search barangays</span>
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search barangay name or code..."
                className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#0039A6]"
              />
            </label>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-12 text-center text-slate-500 dark:text-slate-400" role="status">
              Loading barangay directory&hellip;
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-10 text-center" role="alert">
              <p className="font-medium text-slate-800 dark:text-slate-200">Couldn&apos;t load barangay directory.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <button onClick={retry} className={`mt-3 rounded-full bg-[#0039A6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#002B7F] transition-colors ${focusRing}`}>
                Try again
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-10 text-center" role="status">
              <p className="font-medium text-slate-800 dark:text-slate-200">No barangay matches &ldquo;{query}&rdquo;.</p>
              <button onClick={() => setQuery("")} className={`mt-2 text-sm font-semibold text-[#0039A6] underline underline-offset-4 ${focusRing}`}>
                Show all {barangays.length} barangays
              </button>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((b) => {
                const av = AVATARS[barangays.indexOf(b) % AVATARS.length];
                return (
                  <li key={b.id}>
                    <Link
                      href={`/citizens/${b.id}`}
                      className={`group flex w-full items-center gap-3.5 rounded-2xl bg-white dark:bg-[#181126] shadow-sm p-3.5 pr-4 border border-slate-200 dark:border-white/10 hover:border-[#0039A6] dark:hover:border-[#0039A6] transition-colors ${focusRing}`}
                    >
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-sm"
                        style={{ backgroundColor: av.bg, color: av.fg }}
                        aria-hidden="true"
                      >
                        {initials(b.name)}
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-semibold text-slate-900 dark:text-white group-hover:text-[#0039A6] transition-colors">
                          {b.name}
                        </span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                          {b.code}
                        </span>
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[#0039A6] dark:bg-white/10 dark:text-white group-hover:bg-[#0039A6] group-hover:text-white transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing {shown.length} of {barangays.length} barangays in Makati City</span>
            <span>Click any tile to open barangay view</span>
          </div>
        </section>

        {/* ================================================================ */}
        {/* ROW 5: What Barangays Report to DILG (Landscape Categories)     */}
        {/* ================================================================ */}
        {categories.length > 0 && (
          <section
            className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
            aria-labelledby="cat-title"
          >
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0039A6]">
                Governance Compliance
              </span>
              <h2 id="cat-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                What barangays report to DILG
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Every barangay files these official reports so the city and national government maintain public transparency.
              </p>
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                  <div className="mt-1.5">
                    <Chip bg="#DBEAFE" fg="#0039A6">{CYCLE_LABEL[c.cycle] ?? c.cycle}</Chip>
                  </div>
                  {c.description && (
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {c.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ================================================================ */}
        {/* ROW 6: Citizens FAQ Section (Collapsible Accordion)             */}
        {/* ================================================================ */}
        <section
          id="faqs"
          className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
          aria-labelledby="faq-title"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0039A6]">
              Help &amp; Information
            </span>
            <h2 id="faq-title" className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Quick answers about public access, barangay services, and DILG Makati reporting.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {CITIZEN_FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-200"
              >
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-slate-100 ${focusRing}`}>
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-[#0039A6] dark:bg-blue-950 dark:text-blue-300 text-lg font-bold transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/10 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </PublicFrame>
  );
}

function LandscapeStatTile({
  value,
  label,
  subtext,
  icon,
  color,
}: {
  value: number | string;
  label: string;
  subtext: string;
  icon: "buildings" | "calendar";
  color: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white/80 dark:bg-black/30 p-4 ring-1 ring-white/60 dark:ring-white/10 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-white font-semibold"
          style={{ backgroundColor: color }}
        >
          {icon === "buildings" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
              <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          )}
        </span>
        <span className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtext}</p>
      </div>
    </div>
  );
}
