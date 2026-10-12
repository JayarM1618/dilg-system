"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend } from "@/lib/http";
import { ApiError } from "@/lib/api";
import {
  CATEGORIES, categoryOf, eventWhen, formatLongDate, localInputToIso,
  type PublicBarangayDetail,
} from "@/lib/publicInfo";

const field =
  "w-full rounded-xl border border-line dark:border-white/10 bg-white dark:bg-[#1E1735] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 transition-all dark:[color-scheme:dark]";
const btn =
  "rounded-full bg-[#5A18C9] dark:bg-[#7B4DFF] hover:bg-[#7B2FF7] dark:hover:bg-[#6A3CF0] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60";

/**
 * Where a barangay representative writes what citizens see in the Citizens View.
 * Every save goes to Laravel, which checks the rep may only edit their own barangay.
 */
export default function CommunityManager() {
  const { user, loading: authLoading } = useAuth();
  const barangayId = user?.barangay_id ?? null;
  const { data, loading, error, reload } = useFetch<PublicBarangayDetail>(
    barangayId ? `/api/public/barangays/${barangayId}` : null,
  );

  if (authLoading) return <p className="mx-auto max-w-6xl p-8 text-muted dark:text-slate-400" role="status">Loading&hellip;</p>;
  if (!barangayId) return <p className="mx-auto max-w-6xl p-8 text-muted dark:text-slate-400">This account is not linked to a barangay.</p>;
  if (loading) return <p className="mx-auto max-w-6xl p-8 text-muted dark:text-slate-400" role="status">Loading&hellip;</p>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl p-8" role="alert">
        <p className="text-bad dark:text-rose-400">{error ?? "Could not load your barangay."}</p>
        <button onClick={reload} className={`${btn} mt-3`}>Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">Announcements &amp; programs</h1>
        <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-[#C9BCEB] transition-colors duration-500 ease-out">
          What you write here appears to citizens in the Citizens View of Barangay {data.barangay.name}.
        </p>
      </header>

      {/* ── 3-Column Layout ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Column 1: Barangay Profile */}
        <div className="lg:col-span-1">
          <SectionLabel icon={<ProfileIcon />} label="Barangay Profile" />
          <ProfileForm barangayId={barangayId} initial={data.barangay} />
        </div>

        {/* Column 2: Announcements */}
        <div className="lg:col-span-1">
          <SectionLabel icon={<MegaphoneIcon />} label="Announcements" />
          <Announcements barangayId={barangayId} items={data.announcements} onChange={reload} />
        </div>

        {/* Column 3: Events & Programs */}
        <div className="lg:col-span-1">
          <SectionLabel icon={<CalendarIcon />} label="Events & Programs" />
          <Programs barangayId={barangayId} events={data.events} programs={data.programs} onChange={reload} />
        </div>
      </div>
    </div>
  );
}

/* ── Section Label ── */

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">
      {icon}
      {label}
    </h2>
  );
}

/* ── Panel ── */

function Panel({ title, hint, accent, children }: { title: string; hint?: string; accent?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 ease-out overflow-hidden ${accent ?? ""}`}>
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">{title}</h3>
        {hint && <p className="mt-1 text-sm text-slate-500 dark:text-[#A99BD4] transition-colors duration-500 ease-out">{hint}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

/* ── Helpers ── */

function useSaver(onDone?: () => void) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: () => Promise<unknown>, successText: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: successText });
      onDone?.();
      return true;
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Something went wrong. Please try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, run };
}

function Note({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {message.text}
    </p>
  );
}

/* ── Profile Form ── */

function ProfileForm({ barangayId, initial }: { barangayId: number; initial: PublicBarangayDetail["barangay"] }) {
  const [about, setAbout] = useState(initial.about ?? "");
  const [hall, setHall] = useState(initial.hall_address ?? "");
  const [hotline, setHotline] = useState(initial.hotline ?? "");
  const [hours, setHours] = useState(initial.office_hours ?? "");
  const { busy, message, run } = useSaver();

  function submit(e: FormEvent) {
    e.preventDefault();
    void run(
      () => apiSend(`/api/barangays/${barangayId}/profile`, "PATCH", {
        about: about.trim() || null,
        hall_address: hall.trim() || null,
        hotline: hotline.trim() || null,
        office_hours: hours.trim() || null,
      }),
      "Saved. Citizens can now see these details.",
    );
  }

  return (
    <Panel title="Profile details" hint="Shown at the top of your page in the Citizens View." accent="bg-gradient-to-br from-emerald-500/5 to-teal-400/5 dark:from-emerald-500/10 dark:to-teal-400/5">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">About the barangay
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} maxLength={2000} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Barangay hall address
          <input value={hall} onChange={(e) => setHall(e.target.value)} maxLength={255} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hotline
          <input value={hotline} onChange={(e) => setHotline(e.target.value)} maxLength={50} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Office hours
          <input value={hours} onChange={(e) => setHours(e.target.value)} maxLength={255} className={`${field} mt-1.5`} />
        </label>
        <div className="flex flex-col gap-3 pt-1">
          <button type="submit" disabled={busy} className={`${btn} w-full`}>{busy ? "Saving…" : "Save profile"}</button>
          <Note message={message} />
        </div>
      </form>
    </Panel>
  );
}

/* ── Announcements ── */

function Announcements({
  barangayId, items, onChange,
}: { barangayId: number; items: PublicBarangayDetail["announcements"]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const { busy, message, run } = useSaver(onChange);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(
      () => apiSend(`/api/barangays/${barangayId}/announcements`, "POST", { title: title.trim(), body: body.trim(), is_pinned: pinned }),
      "Announcement posted.",
    );
    if (ok) { setTitle(""); setBody(""); setPinned(false); }
  }

  function remove(id: number, name: string) {
    if (!window.confirm(`Delete the announcement "${name}"? Citizens will no longer see it.`)) return;
    void run(() => apiSend(`/api/announcements/${id}`, "DELETE"), "Announcement deleted.");
  }

  return (
    <div className="space-y-5">
      <Panel title="Post new" hint="News and reminders for residents." accent="bg-gradient-to-br from-amber-500/5 to-orange-400/5 dark:from-amber-500/10 dark:to-orange-400/5">
        <form onSubmit={submit} className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} placeholder="Title" aria-label="Announcement title" className={field} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={5000} rows={3} placeholder="What do residents need to know?" aria-label="Announcement text" className={field} />
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-line dark:border-white/20 text-[#7B4DFF] focus:ring-[#7B4DFF] bg-white dark:bg-[#1E1735]" /> Pin to the top
            </label>
            <button type="submit" disabled={busy} className={`${btn} w-full`}>{busy ? "Posting…" : "Post announcement"}</button>
            <Note message={message} />
          </div>
        </form>
      </Panel>

      {/* Existing announcements list */}
      <Panel title="Posted" hint={`${items.length} announcement${items.length !== 1 ? "s" : ""}`} accent="bg-gradient-to-br from-amber-500/5 to-yellow-400/5 dark:from-amber-500/10 dark:to-yellow-400/5">
        <ul className="divide-y divide-[#EDE7FA]/40 dark:divide-white/5">
          {items.length === 0 ? (
            <li className="py-4 text-sm text-slate-400 dark:text-[#7C6FA3]">Nothing posted yet.</li>
          ) : (
            items.map((a) => (
              <li key={a.id} className="group flex items-start justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">{a.is_pinned ? "📌 " : ""}{a.title}</p>
                  <p className="text-xs text-slate-400 dark:text-[#7C6FA3] mt-0.5">{formatLongDate(a.published_at)}</p>
                </div>
                <button type="button" onClick={() => remove(a.id, a.title)} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">Delete</button>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}

/* ── Events & Programs ── */

function Programs({
  barangayId, events, programs, onChange,
}: { barangayId: number; events: PublicBarangayDetail["events"]; programs: PublicBarangayDetail["programs"]; onChange: () => void }) {
  const [kind, setKind] = useState<"event" | "program">("event");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [venue, setVenue] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [schedule, setSchedule] = useState("");
  const [description, setDescription] = useState("");
  const { busy, message, run } = useSaver(onChange);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const isEvent = kind === "event";
    const ok = await run(
      () => apiSend(`/api/barangays/${barangayId}/programs`, "POST", {
        kind,
        title: title.trim(),
        category,
        venue: venue.trim() || null,
        description: description.trim() || null,
        starts_at: isEvent ? localInputToIso(starts) : null,
        ends_at: isEvent ? localInputToIso(ends) : null,
        schedule_note: isEvent ? null : schedule.trim() || null,
      }),
      isEvent ? "Event added — it will show on the Citizens View calendar." : "Program added.",
    );
    if (ok) { setTitle(""); setVenue(""); setStarts(""); setEnds(""); setSchedule(""); setDescription(""); }
  }

  function remove(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? Citizens will no longer see it.`)) return;
    void run(() => apiSend(`/api/programs/${id}`, "DELETE"), "Deleted.");
  }

  const rows = [...events, ...programs];

  return (
    <div className="space-y-5">
      <Panel
        title={kind === "event" ? "Add event" : "Add program"}
        hint={kind === "event" ? "Events appear on the Citizens View calendar." : "Programs are ongoing services."}
        accent="bg-gradient-to-br from-violet-500/5 to-purple-400/5 dark:from-violet-500/10 dark:to-purple-400/5"
      >
        <form onSubmit={submit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1">
            <button
              type="button"
              onClick={() => setKind("event")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-300 ${
                kind === "event"
                  ? "bg-white dark:bg-[#7B4DFF]/20 text-[#5A18C9] dark:text-[#CDBBFF] shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              📅 Event
            </button>
            <button
              type="button"
              onClick={() => setKind("program")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-300 ${
                kind === "program"
                  ? "bg-white dark:bg-[#7B4DFF]/20 text-[#5A18C9] dark:text-[#CDBBFF] shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              🏢 Program
            </button>
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} mt-1.5`}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-white dark:bg-[#1E1735] text-slate-900 dark:text-white">{c.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} className={`${field} mt-1.5`} />
          </label>

          {kind === "event" ? (
            <>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Starts (Philippine time)
                <input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} required className={`${field} mt-1.5`} />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ends (optional)
                <input type="datetime-local" value={ends} min={starts || undefined} onChange={(e) => setEnds(e.target.value)} className={`${field} mt-1.5`} />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Venue
                <input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={150} className={`${field} mt-1.5`} />
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Schedule (e.g. Every Saturday, 8 AM)
              <input value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={150} className={`${field} mt-1.5`} />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Details (optional)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={3000} className={`${field} mt-1.5`} />
          </label>
          <div className="flex flex-col gap-3 pt-1">
            <button type="submit" disabled={busy} className={`${btn} w-full`}>{busy ? "Saving…" : kind === "event" ? "Add event" : "Add program"}</button>
            <Note message={message} />
          </div>
        </form>
      </Panel>

      {/* Existing items list */}
      <Panel title="Your items" hint={`${events.length} event${events.length !== 1 ? "s" : ""}, ${programs.length} program${programs.length !== 1 ? "s" : ""}`} accent="bg-gradient-to-br from-violet-500/5 to-indigo-400/5 dark:from-violet-500/10 dark:to-indigo-400/5">
        <ul className="divide-y divide-[#EDE7FA]/40 dark:divide-white/5">
          {rows.length === 0 ? (
            <li className="py-4 text-sm text-slate-400 dark:text-[#7C6FA3]">Nothing added yet.</li>
          ) : (
            rows.map((p) => (
              <li key={p.id} className="group flex items-start justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.kind === "event"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                        : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                    }`}>
                      {p.kind}
                    </span>
                    <span className="font-medium text-[#1B1235] dark:text-white transition-colors duration-500 ease-out">{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-[#7C6FA3] mt-0.5">
                    {p.kind === "event" && p.starts_at ? `${formatLongDate(p.starts_at)}, ${eventWhen(p)}` : p.schedule_note ?? "Program"}
                    {" · "}{categoryOf(p.category).label}
                  </p>
                </div>
                <button type="button" onClick={() => remove(p.id, p.title)} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">Delete</button>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}

/* ── Icons ── */

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
