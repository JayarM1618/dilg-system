"use client";

import { useMemo, useState } from "react";
import { DateBadge, EmptyNote, Chip, focusRing } from "@/components/public/PublicFrame";
import { badgeParts, categoryOf, eventWhen, manilaDateKey, todayKey, type PublicProgram } from "@/lib/publicInfo";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month calendar of a barangay's upcoming events. Pick a day to see what is happening. */
export default function EventCalendar({ events }: { events: PublicProgram[] }) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, PublicProgram[]>();
    for (const e of events) {
      if (!e.starts_at) continue;
      const key = manilaDateKey(e.starts_at);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  const { y, m } = cursor;
  const first = new Date(Date.UTC(y, m, 1));
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const monthLabel = first.toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });
  const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array.from({ length: first.getUTCDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shownEvents = selected
    ? (byDay.get(selected) ?? [])
    : [...byDay.entries()].filter(([k]) => k.startsWith(monthPrefix)).sort(([a], [b]) => a.localeCompare(b)).flatMap(([, v]) => v);

  function move(delta: number) {
    const d = new Date(Date.UTC(y, m + delta, 1));
    setCursor({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    setSelected(null);
  }

  const navBtn = `grid h-9 w-9 place-items-center rounded-full bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out text-[#0039A6] ring-1 ring-[#CBD5E1] hover:bg-[#DBEAFE] ${focusRing}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#DBEAFE] transition-colors duration-500 ease-out" aria-live="polite">{monthLabel}</h3>
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} className={navBtn} aria-label="Previous month">‹</button>
          <button type="button" onClick={() => move(1)} className={navBtn} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#7C6FA3]">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const key = `${monthPrefix}-${String(day).padStart(2, "0")}`;
          const count = byDay.get(key)?.length ?? 0;
          const isToday = key === today;
          const isSel = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(isSel ? null : key)}
              aria-pressed={isSel}
              aria-label={`${new Date(Date.UTC(y, m, day)).toLocaleDateString("en-PH", { month: "long", day: "numeric", timeZone: "UTC" })}${count ? `, ${count} event${count > 1 ? "s" : ""}` : ""}`}
              className={`relative grid aspect-square place-items-center rounded-xl text-sm transition-colors ${focusRing} ${isSel ? "bg-[#0039A6] font-semibold text-white" : count ? "bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out font-semibold text-[#0F172A] ring-1 ring-[#93C5FD] hover:bg-[#DBEAFE]" : "text-slate-600 hover:bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out"
                } ${isToday && !isSel ? "ring-2 ring-[#0039A6]" : ""}`}
            >
              {day}
              {count > 0 && (
                <span aria-hidden="true" className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isSel ? "bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out" : "bg-[#0039A6]"}`} />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm font-medium text-[#0F172A] dark:text-[#93C5FD] transition-colors duration-500 ease-out">
        {selected ? "Events on this day" : `Events in ${monthLabel}`}
      </p>
      <ul className="mt-2 space-y-2">
        {shownEvents.length === 0 ? (
          <li><EmptyNote>{selected ? "Nothing scheduled on this day." : "No events scheduled this month."}</EmptyNote></li>
        ) : (
          shownEvents.map((e) => {
            const cat = categoryOf(e.category);
            const b = badgeParts(e.starts_at!);
            return (
              <li key={e.id} className="flex gap-3 rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-500 ease-out p-3">
                <DateBadge {...b} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-out">{e.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-out">{eventWhen(e)}{e.venue ? ` · ${e.venue}` : ""}</p>
                  <div className="mt-1"><Chip bg={cat.bg} fg={cat.fg}>{cat.label}</Chip></div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
