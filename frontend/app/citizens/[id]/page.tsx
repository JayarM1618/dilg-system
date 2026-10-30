"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PublicFrame, { Chip, DateBadge, EmptyNote, card, focusRing } from "@/components/public/PublicFrame";
import EventCalendar from "@/components/public/EventCalendar";
import { usePublicBarangay } from "@/hooks/usePublicBarangay";
import { AVATARS, initials } from "@/lib/barangays";
import { badgeParts, categoryOf, eventWhen, formatLongDate, todayKey, manilaDateKey } from "@/lib/publicInfo";

export default function CitizensBarangayPage() {
  const { id } = useParams<{ id: string }>();
  return <BarangayDetail key={id} id={id} />;
}

function BarangayDetail({ id }: { id: string }) {
  const { data, loading, error, retry } = usePublicBarangay(id);

  return (
    <PublicFrame>
      <div className="space-y-6 sm:space-y-8">
        {/* Back navigation pill */}
        <div>
          <Link
            href="/citizens"
            className={`inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0039A6] dark:text-blue-300 border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors ${focusRing}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            All Makati barangays
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-20 text-center text-slate-500 dark:text-slate-400" role="status">
            Loading barangay details&hellip;
          </div>
        ) : error || !data ? (
          <div className="rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-16 text-center" role="alert">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Couldn&apos;t open this barangay.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <button onClick={retry} className={`mt-4 rounded-full bg-[#0039A6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#002B7F] transition-colors ${focusRing}`}>
              Try again
            </button>
          </div>
        ) : (
          <Detail data={data} />
        )}
      </div>
    </PublicFrame>
  );
}

function Detail({ data }: { data: NonNullable<ReturnType<typeof usePublicBarangay>["data"]> }) {
  const { barangay: b, announcements, events, programs } = data;
  const av = AVATARS[b.id % AVATARS.length];
  const today = todayKey();
  const upcoming = events.filter((e) => e.starts_at && manilaDateKey(e.starts_at) >= today);

  const info = [
    {
      label: "Barangay hall",
      value: b.hall_address,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      label: "Hotline",
      value: b.hotline,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        </svg>
      ),
    },
    {
      label: "Office hours",
      value: b.office_hours,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ].filter((i) => i.value);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ================================================================ */}
      {/* TOP: Full-Width Landscape Barangay Header Card                   */}
      {/* ================================================================ */}
      <section
        className={`${card} relative overflow-hidden bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 lg:p-10 transition-all duration-500`}
        aria-labelledby="b-name"
      >
        <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Main Info: Avatar, Name, Code, Description */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="grid h-16 w-16 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-2xl text-2xl sm:text-3xl font-black shadow-sm ring-2 ring-white/80 dark:ring-white/20"
                style={{ backgroundColor: av.bg, color: av.fg }}
                aria-hidden="true"
              >
                {initials(b.name)}
              </span>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="h-2 w-2 rounded-full bg-[#059669]" />
                  {b.code} &bull; Makati City
                </div>
                <h1
                  id="b-name"
                  className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
                >
                  {b.name}
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {b.about ?? "A residential and commercial barangay in the City of Makati, committed to efficient public service and transparent community reporting."}
            </p>

            {/* Quick Stat Tiles in Landscape Strip */}
            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 max-w-md">
              <LandscapeStat
                value={upcoming.length}
                label="Upcoming Events"
                href="#calendar-events"
                color="#0039A6"
              />
              <LandscapeStat
                value={announcements.length}
                label="Announcements"
                href="#announcements"
                color="#D97706"
              />
              <LandscapeStat
                value={programs.length}
                label="Active Programs"
                href="#programs"
                color="#059669"
              />
            </div>
          </div>

          {/* Right Column: Contact, Hotline & Operating Info (Horizontal Cards) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0039A6] dark:text-blue-300">
                Barangay Information &amp; Contact
              </span>

              <div className="mt-3.5 space-y-3">
                {info.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 text-sm">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-100 text-[#0039A6] dark:bg-blue-950 dark:text-blue-300">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-slate-800 dark:text-slate-100 font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* MAIN TWO-COLUMN DASHBOARD LAYOUT                                 */}
      {/* Left Column: Calendar & Upcoming Events List                     */}
      {/* Right Column: Announcements & Programs                           */}
      {/* ================================================================ */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Calendar & Events (7 cols) */}
        <div id="calendar-events" className="lg:col-span-7 space-y-6 scroll-mt-6">
          {/* Calendar Card */}
          <section
            className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
            aria-labelledby="cal-title"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0039A6] text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </span>
              <div>
                <h2 id="cal-title" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Calendar of upcoming events
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Select a day to view community schedules and activities
                </p>
              </div>
            </div>

            <div className="mt-5">
              <EventCalendar events={events} />
            </div>
          </section>

          {/* Next Up Events List Card */}
          <section
            className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
            aria-labelledby="next-title"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div>
                  <h2 id="next-title" className="text-xl font-bold text-slate-900 dark:text-white">
                    Next up in {b.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chronological event itinerary</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                {upcoming.length} upcoming
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <li><EmptyNote>No upcoming events currently scheduled for {b.name}.</EmptyNote></li>
              ) : (
                upcoming.slice(0, 5).map((e) => {
                  const cat = categoryOf(e.category);
                  return (
                    <li
                      key={e.id}
                      className="flex items-start gap-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 hover:border-emerald-500 transition-all duration-200"
                    >
                      <DateBadge {...badgeParts(e.starts_at!)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip bg={cat.bg} fg={cat.fg}>{cat.label}</Chip>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{eventWhen(e)}</span>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white text-base">
                          {e.title}
                        </p>
                        {e.venue && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Location: {e.venue}
                          </p>
                        )}
                        {e.description && (
                          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {e.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>

        {/* Right Column: Announcements & Programs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Announcements Card */}
          <section
            id="announcements"
            className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
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
                    Announcements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official notices from {b.name}</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {announcements.length} notices
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {announcements.length === 0 ? (
                <li><EmptyNote>No announcements posted by this barangay yet.</EmptyNote></li>
              ) : (
                announcements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {a.is_pinned && (
                        <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          PINNED
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatLongDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-bold text-slate-900 dark:text-white text-base">
                      {a.title}
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {a.body}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Programs Card */}
          <section
            id="programs"
            className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all duration-500`}
            aria-labelledby="prog-title"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0039A6] text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <div>
                  <h2 id="prog-title" className="text-xl font-bold text-slate-900 dark:text-white">
                    Barangay Programs
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Community services and projects</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-[#0039A6] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {programs.length} active
              </span>
            </div>

            {programs.length === 0 ? (
              <div className="mt-4"><EmptyNote>No programs listed for {b.name} at this time.</EmptyNote></div>
            ) : (
              <ul className="mt-4 space-y-3">
                {programs.map((p) => {
                  const cat = categoryOf(p.category);
                  return (
                    <li
                      key={p.id}
                      className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Chip bg={cat.bg} fg={cat.fg}>{cat.label}</Chip>
                        {p.schedule_note && (
                          <span className="text-xs font-semibold text-[#0039A6] dark:text-blue-300">
                            {p.schedule_note}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-bold text-slate-900 dark:text-white text-base">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {p.description}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function LandscapeStat({
  value,
  label,
  href,
  color,
}: {
  value: number;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className={`group flex flex-col justify-between rounded-2xl bg-slate-50 dark:bg-white/5 p-3.5 border border-slate-200 dark:border-white/10 shadow-sm transition-colors hover:border-[#0039A6] ${focusRing}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-2xl sm:text-3xl font-black tabular-nums"
          style={{ color }}
        >
          {value}
        </span>
        <span className="text-xs text-slate-400 group-hover:text-[#0039A6] transition-colors">&rarr;</span>
      </div>
      <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
        {label}
      </p>
    </a>
  );
}
