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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy-900 dark:text-white transition-colors duration-500 ease-out">Announcements &amp; programs</h1>
        <p className="mt-1 text-sm sm:text-base text-muted dark:text-slate-400">
          What you write here appears to citizens in the Citizens View of Barangay {data.barangay.name}.
        </p>
      </header>

      <ProfileForm barangayId={barangayId} initial={data.barangay} />
      <Announcements barangayId={barangayId} items={data.announcements} onChange={reload} />
      <Programs barangayId={barangayId} events={data.events} programs={data.programs} onChange={reload} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line dark:border-white/10 bg-white/70 dark:bg-[#2A233D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-[#7B4DFF]/10 dark:shadow-none transition-all duration-500 ease-out">
      <h2 className="text-xl font-semibold text-navy-900 dark:text-white">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted dark:text-slate-400">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

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
    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-ok dark:text-emerald-400" : "text-bad dark:text-rose-400"}`}>
      {message.text}
    </p>
  );
}

/* ---------------- profile ---------------- */

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
    <Panel title="Barangay profile" hint="Shown at the top of your page in the Citizens View.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">About the barangay
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} maxLength={2000} className={`${field} mt-1.5`} />
        </label>
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Barangay hall address
          <input value={hall} onChange={(e) => setHall(e.target.value)} maxLength={255} className={`${field} mt-1.5`} />
        </label>
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Hotline
          <input value={hotline} onChange={(e) => setHotline(e.target.value)} maxLength={50} className={`${field} mt-1.5`} />
        </label>
        <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">Office hours
          <input value={hours} onChange={(e) => setHours(e.target.value)} maxLength={255} className={`${field} mt-1.5`} />
        </label>
        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`}>{busy ? "Saving…" : "Save profile"}</button>
          <Note message={message} />
        </div>
      </form>
    </Panel>
  );
}

/* ---------------- announcements ---------------- */

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
    <Panel title="Announcements" hint="News and reminders for residents.">
      <form onSubmit={submit} className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} placeholder="Title" aria-label="Announcement title" className={field} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={5000} rows={3} placeholder="What do residents need to know?" aria-label="Announcement text" className={field} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-line dark:border-white/20 text-[#7B4DFF] focus:ring-[#7B4DFF] bg-white dark:bg-[#1E1735]" /> Pin to the top
          </label>
          <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`}>{busy ? "Posting…" : "Post announcement"}</button>
          <Note message={message} />
        </div>
      </form>

      <ul className="mt-6 divide-y divide-line dark:divide-white/10">
        {items.length === 0 ? (
          <li className="py-4 text-sm text-muted dark:text-slate-400">Nothing posted yet.</li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="font-medium text-navy-900 dark:text-white">{a.is_pinned ? "📌 " : ""}{a.title}</p>
                <p className="text-xs text-muted dark:text-slate-400 mt-0.5">{formatLongDate(a.published_at)}</p>
              </div>
              <button type="button" onClick={() => remove(a.id, a.title)} className="shrink-0 text-sm font-semibold text-bad dark:text-rose-400 hover:underline">Delete</button>
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}

/* ---------------- programs & events ---------------- */

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
      isEvent ? "Event added to the calendar." : "Program added.",
    );
    if (ok) { setTitle(""); setVenue(""); setStarts(""); setEnds(""); setSchedule(""); setDescription(""); }
  }

  function remove(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? Citizens will no longer see it.`)) return;
    void run(() => apiSend(`/api/programs/${id}`, "DELETE"), "Deleted.");
  }

  const rows = [...events, ...programs];

  return (
    <Panel title="Events & programs" hint="Events appear on the calendar. Programs are ongoing services.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Type
          <select value={kind} onChange={(e) => setKind(e.target.value as "event" | "program")} className={`${field} mt-1.5`}>
            <option value="event" className="bg-white dark:bg-[#1E1735] text-slate-900 dark:text-white">Event (on the calendar)</option>
            <option value="program" className="bg-white dark:bg-[#1E1735] text-slate-900 dark:text-white">Program (ongoing)</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} mt-1.5`}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-white dark:bg-[#1E1735] text-slate-900 dark:text-white">{c.label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} className={`${field} mt-1.5`} />
        </label>

        {kind === "event" ? (
          <>
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Starts (Philippine time)
              <input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} required className={`${field} mt-1.5`} />
            </label>
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Ends (optional)
              <input type="datetime-local" value={ends} min={starts || undefined} onChange={(e) => setEnds(e.target.value)} className={`${field} mt-1.5`} />
            </label>
            <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">Venue
              <input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={150} className={`${field} mt-1.5`} />
            </label>
          </>
        ) : (
          <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">Schedule (e.g. Every Saturday, 8 AM)
            <input value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={150} className={`${field} mt-1.5`} />
          </label>
        )}

        <label className="sm:col-span-2 text-sm font-medium text-slate-800 dark:text-slate-200">Details (optional)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={3000} className={`${field} mt-1.5`} />
        </label>
        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`}>{busy ? "Saving…" : kind === "event" ? "Add event" : "Add program"}</button>
          <Note message={message} />
        </div>
      </form>

      <ul className="mt-6 divide-y divide-line dark:divide-white/10">
        {rows.length === 0 ? (
          <li className="py-4 text-sm text-muted dark:text-slate-400">Nothing added yet.</li>
        ) : (
          rows.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="font-medium text-navy-900 dark:text-white">{p.title}</p>
                <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                  {p.kind === "event" && p.starts_at ? `${formatLongDate(p.starts_at)}, ${eventWhen(p)}` : p.schedule_note ?? "Program"}
                  {" · "}{categoryOf(p.category).label}
                </p>
              </div>
              <button type="button" onClick={() => remove(p.id, p.title)} className="shrink-0 text-sm font-semibold text-bad dark:text-rose-400 hover:underline">Delete</button>
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}
