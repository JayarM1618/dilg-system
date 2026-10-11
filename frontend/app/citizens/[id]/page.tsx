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
  // key={id}: opening a different barangay starts fresh instead of flashing the previous one.
  return <BarangayDetail key={id} id={id} />;
}

function BarangayDetail({ id }: { id: string }) {
  const { data, loading, error, retry } = usePublicBarangay(id);

  return (
    <PublicFrame>
      <Link href="/citizens" className={`inline-flex items-center gap-2 self-start rounded-full bg-[#F1EBFF] px-4 py-2 text-sm font-semibold text-[#5A18C9] transition-colors hover:bg-[#E3D5FF] ${focusRing}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        All barangays
      </Link>

      {loading ? (
        <div className="rounded-2xl bg-[#F1F0FB]/70 dark:bg-[#1E192D]/70 border border-line/40 dark:border-white/10 px-6 py-16 text-center text-slate-500 dark:text-slate-400" role="status">Loading barangay&hellip;</div>
      ) : error || !data ? (
        <div className="rounded-2xl bg-[#F1F0FB]/70 dark:bg-[#1E192D]/70 border border-line/40 dark:border-white/10 px-6 py-16 text-center" role="alert">
          <p className="font-medium text-slate-800 dark:text-slate-200">Couldn&apos;t open this barangay.</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <button onClick={retry} className={`mt-3 rounded-full bg-[#7B4DFF] px-5 py-2 text-sm font-semibold text-white ${focusRing}`}>Try again</button>
        </div>
      ) : (
        <Detail data={data} />
      )}
    </PublicFrame>
  );
}

function Detail({ data }: { data: NonNullable<ReturnType<typeof usePublicBarangay>["data"]> }) {
  const { barangay: b, announcements, events, programs } = data;
  const av = AVATARS[b.id % AVATARS.length];
  const today = todayKey();
  const upcoming = events.filter((e) => e.starts_at && manilaDateKey(e.starts_at) >= today);

  const info = [
    { label: "Barangay hall", value: b.hall_address },
    { label: "Hotline", value: b.hotline },
    { label: "Office hours", value: b.office_hours },
  ].filter((i) => i.value);

  return (
    <>
      {/* ---------- Row 1: profile + calendar ---------- */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${card} flex flex-col bg-[#E6FBF3]/70 dark:bg-[#1C362F]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out lg:col-span-5`} aria-labelledby="b-name">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="grid h-12 w-12 sm:h-16 sm:w-16 shrink-0 place-items-center rounded-full text-lg sm:text-xl font-semibold" style={{ backgroundColor: av.bg, color: av.fg }} aria-hidden="true">
              {initials(b.name)}
            </span>
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#2C5A4D]">{b.code}</p>
              <h1 id="b-name" className="text-balance text-2xl font-semibold leading-tight text-[#0E2B24] dark:text-[#E6FBF3] transition-colors duration-500 ease-out sm:text-4xl">{b.name}</h1>
            </div>
          </div>

          <p className="mt-4 leading-7 text-[#2C5A4D] dark:text-[#A7DDC9] transition-colors duration-500 ease-out">
            {b.about ?? "This barangay hasn't added a description yet."}
          </p>

          {info.length > 0 && (
            <dl className="mt-5 space-y-2 text-sm">
              {info.map((i) => (
                <div key={i.label} className="rounded-xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md px-4 py-2.5 transition-colors duration-500 ease-out">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#2C5A4D] dark:text-[#A7DDC9] transition-colors duration-500 ease-out">{i.label}</dt>
                  <dd className="text-slate-800 dark:text-slate-200 transition-colors duration-500 ease-out">{i.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-auto grid grid-cols-3 gap-3 pt-6">
            <Mini value={upcoming.length} label="Upcoming events" />
            <Mini value={announcements.length} label="Announcements" />
            <Mini value={programs.length} label="Programs" />
          </div>
        </section>

        <section className={`${card} bg-[#F3EDFE]/70 dark:bg-[#2A233D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out lg:col-span-7`} aria-labelledby="cal-title">
          <h2 id="cal-title" className="text-xl font-medium text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Calendar of upcoming events</h2>
          <div className="mt-3">
            <EventCalendar events={events} />
          </div>
        </section>
      </div>

      {/* ---------- Row 2: announcements + next events ---------- */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${card} bg-[#FFF8E6]/70 dark:bg-[#382C10]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-4 sm:p-8 lg:col-span-7`} aria-labelledby="ann-title">
          <h2 id="ann-title" className="text-2xl font-semibold text-[#2A2000] dark:text-[#FBE5A1] transition-colors duration-500 ease-out">Announcements</h2>
          <ul className="mt-5 space-y-3">
            {announcements.length === 0 ? (
              <li><EmptyNote>No announcements from this barangay yet.</EmptyNote></li>
            ) : (
              announcements.map((a) => (
                <li key={a.id} className="rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.is_pinned && <Chip bg="#FFE9A8" fg="#7A5B00">Pinned</Chip>}
                    <span className="text-xs text-slate-500">{formatLongDate(a.published_at)}</span>
                  </div>
                  <h3 className="mt-1 font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-out">{a.title}</h3>
                  <p className="mt-1 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-out">{a.body}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={`${card} bg-[#E8FAFF]/70 dark:bg-[#15343B]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-4 sm:p-8 lg:col-span-5`} aria-labelledby="next-title">
          <h2 id="next-title" className="text-2xl font-semibold text-[#0B2A36] dark:text-[#BAE8F5] transition-colors duration-500 ease-out">Next up</h2>
          <ul className="mt-5 space-y-3">
            {upcoming.length === 0 ? (
              <li><EmptyNote>No upcoming events.</EmptyNote></li>
            ) : (
              upcoming.slice(0, 5).map((e) => {
                const cat = categoryOf(e.category);
                return (
                  <li key={e.id} className="flex gap-3 rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-3">
                    <DateBadge {...badgeParts(e.starts_at!)} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{eventWhen(e)}{e.venue ? ` · ${e.venue}` : ""}</p>
                      {e.description && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{e.description}</p>}
                      <div className="mt-1"><Chip bg={cat.bg} fg={cat.fg}>{cat.label}</Chip></div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>

      {/* ---------- Row 3: programs ---------- */}
      <section className={`${card} bg-[#F1F0FB]/70 dark:bg-[#1E192D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-4 sm:p-8`} aria-labelledby="prog-title">
        <h2 id="prog-title" className="text-2xl font-semibold text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Programs</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-out">Ongoing programs and services of {b.name}.</p>
        {programs.length === 0 ? (
          <div className="mt-5"><EmptyNote>No programs listed yet.</EmptyNote></div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const cat = categoryOf(p.category);
              return (
                <li key={p.id} className="rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-3xl transition-all duration-500 ease-out p-4 ring-1 ring-[#E8E3F7] dark:ring-white/10">
                  <Chip bg={cat.bg} fg={cat.fg}>{cat.label}</Chip>
                  <h3 className="mt-2 font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-out">{p.title}</h3>
                  {p.schedule_note && <p className="text-sm font-medium text-[#5A18C9] dark:text-[#B9A2FF] transition-colors duration-500 ease-out">{p.schedule_note}</p>}
                  {p.description && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-out">{p.description}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#06D6A0]/70 dark:bg-[#04281F]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md px-2 py-4 text-center text-[#04281F] dark:text-[#E6FBF3] transition-colors duration-500 ease-out">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-medium leading-tight">{label}</p>
    </div>
  );
}
