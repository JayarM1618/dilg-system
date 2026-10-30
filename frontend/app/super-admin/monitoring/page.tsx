"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

/* ---------- types (shape of Laravel's /api/monitoring/* responses) ---------- */

interface Summary {
  totals: {
    actions_today: number;
    actions_7d: number;
    active_users_7d: number;
    pending_accounts: number;
    deactivated_accounts: number;
    barangays_without_account: number;
  };
  by_role_7d: { office: number; reps: number };
  by_group_7d: { key: string; label: string; count: number }[];
  daily: { date: string; office: number; reps: number }[];
  barangays: {
    id: number;
    name: string;
    accounts: { active: number; pending: number; deactivated: number };
    last_activity_at: string | null;
    actions_30d: number;
    reports: number;
    announcements: number;
    programs: number;
  }[];
}

interface ActivityRow {
  id: number;
  action: string;
  label: string;
  group: string;
  group_label: string;
  actor: { id: number; name: string; role: string } | null;
  barangay: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

interface ActivityPage {
  data: ActivityRow[];
  current_page: number;
  last_page: number;
  total: number;
}

const ROLE_TAG: Record<string, { label: string; cls: string }> = {
  super_admin: { label: "Super admin", cls: "bg-[#FFF8E6] text-[#7A5B00] dark:bg-amber-400/15 dark:text-amber-200" },
  office_supervisor: { label: "DILG supervisor", cls: "bg-[#E8FAFF] text-[#0A5C73] dark:bg-sky-400/15 dark:text-sky-200" },
  barangay_rep: { label: "Barangay rep", cls: "bg-[#EBF2FF] text-[#002B7F] dark:bg-[#0039A6]/25 dark:text-[#93C5FD]" },
};

const GROUP_DOT: Record<string, string> = {
  auth: "#94A3B8",
  reports: "#0039A6",
  resources: "#06D6A0",
  incidents: "#D97706",
  content: "#F5B800",
  accounts: "#0EA5E9",
  exports: "#64748B",
  other: "#94A3B8",
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";
const field =
  "rounded-xl bg-white dark:bg-[#1E293B] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none ring-1 ring-[#CBD5E1] dark:ring-[#334155] placeholder:text-slate-400 focus:ring-2 focus:ring-[#0039A6]";

function when(iso: string | null): string {
  if (!iso) return "No activity yet";
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ago(iso: string | null): string {
  if (!iso) return "Never";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const summary = useApi<Summary>(user ? "/api/monitoring/summary" : null, { pollInterval: 8000 });

  const [role, setRole] = useState("");
  const [group, setGroup] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [feed, setFeed] = useState<ActivityPage | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Background real-time polling for feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setTick((n) => n + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (role) p.set("role", role);
    if (group) p.set("group", group);
    if (barangayId) p.set("barangay_id", barangayId);
    if (q.trim()) p.set("q", q.trim());
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", String(page));
    return p.toString();
  }, [role, group, barangayId, q, from, to, page]);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    api
      .get<ActivityPage>(`/api/monitoring/activity?${query}`)
      .then((res) => {
        if (cancelled) return;
        setFeed(res);
        setFeedError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFeedError(err instanceof ApiError ? err.message : "Could not load the activity feed.");
      })
      .finally(() => {
        if (!cancelled) setFeedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, tick]);

  function changeFilter(set: (v: string) => void) {
    return (v: string) => {
      set(v);
      setPage(1);
    };
  }

  const s = summary.data;
  const maxDay = Math.max(1, ...(s?.daily ?? []).map((d) => d.office + d.reps));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-navy-900 dark:text-white sm:text-3xl">Monitoring</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-sm text-muted dark:text-slate-400 sm:text-base">
            Every transaction of the DILG admins and the barangay representatives, updating in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            summary.retry();
            setTick((n) => n + 1);
          }}
          className={`rounded-full border border-[#0039A6] px-4 py-2 text-sm font-semibold text-[#002B7F] transition-colors hover:bg-[#0039A6] hover:text-white dark:text-[#93C5FD] ${focusRing}`}
        >
          Refresh
        </button>
      </div>

      {/* ---------- summary cards ---------- */}
      {summary.error && <p className="mt-6 font-medium text-bad dark:text-rose-400">{summary.error}</p>}
      <section aria-label="Summary" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Actions today" value={s?.totals.actions_today} bg="bg-[#E6FBF3] dark:bg-emerald-400/10" />
        <Stat label="Actions, last 7 days" value={s?.totals.actions_7d} bg="bg-[#EBF2FF] dark:bg-[#0039A6]/15" />
        <Stat label="People active, 7 days" value={s?.totals.active_users_7d} bg="bg-[#E8FAFF] dark:bg-sky-400/10" />
        <Stat
          label="Accounts waiting to activate"
          value={s?.totals.pending_accounts}
          bg="bg-[#FFF8E6] dark:bg-amber-400/10"
          hint={s ? `${s.totals.barangays_without_account} barangays have no account` : undefined}
        />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* daily chart */}
        <section className="rounded-3xl bg-[#F1F0FB] p-5 dark:bg-white/5 lg:col-span-3" aria-label="Activity per day">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-[#1B1235] dark:text-white">Activity, last 14 days</h2>
            <span className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <Legend color="#0039A6" label={`DILG office (${s?.by_role_7d.office ?? 0} this week)`} />
              <Legend color="#06D6A0" label={`Barangay reps (${s?.by_role_7d.reps ?? 0} this week)`} />
            </span>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of actions per day">
            {(s?.daily ?? []).map((d) => (
              <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.office} office, ${d.reps} barangay`}>
                <div className="w-full rounded-t-md bg-[#06D6A0]" style={{ height: `${(d.reps / maxDay) * 100}%` }} />
                <div className={`w-full bg-[#0039A6] ${d.reps === 0 ? "rounded-t-md" : ""}`} style={{ height: `${(d.office / maxDay) * 100}%` }} />
                {d.office + d.reps === 0 && <div className="h-0.5 w-full rounded bg-slate-300 dark:bg-white/20" />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            {(s?.daily ?? []).map((d) => (
              <span key={d.date} className="flex-1 text-center">
                {d.date.slice(8)}
              </span>
            ))}
          </div>
        </section>

        {/* by kind */}
        <section className="rounded-3xl bg-[#FFF8E6] p-5 dark:bg-white/5 lg:col-span-2" aria-label="What people did">
          <h2 className="font-medium text-[#1B1235] dark:text-white">What was done this week</h2>
          <ul className="mt-4 space-y-2.5">
            {(s?.by_group_7d ?? []).map((g) => (
              <li key={g.key} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: GROUP_DOT[g.key] }} aria-hidden="true" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">{g.label}</span>
                <span className="font-semibold text-[#1B1235] dark:text-white">{g.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------- per barangay ---------- */}
      <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-[#E8E3F7] dark:bg-white/5 dark:ring-white/10" aria-labelledby="by-barangay">
        <h2 id="by-barangay" className="font-medium text-[#1B1235] dark:text-white">Barangays at a glance</h2>
        <p className="mt-1 text-sm text-muted dark:text-slate-400">Pick a barangay to filter the feed below to its representatives.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[#5B4C8A] dark:text-[#93C5FD]">
              <tr>
                <th className="py-2 pr-3 font-semibold">Barangay</th>
                <th className="py-2 pr-3 font-semibold">Account</th>
                <th className="py-2 pr-3 font-semibold">Last activity</th>
                <th className="py-2 pr-3 text-right font-semibold">Actions (30d)</th>
                <th className="py-2 pr-3 text-right font-semibold">Reports</th>
                <th className="py-2 pr-3 text-right font-semibold">Posts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE7FA] dark:divide-white/10">
              {(s?.barangays ?? []).map((b) => {
                const a = b.accounts;
                const account =
                  a.active > 0 ? { t: "Active", c: "bg-emerald-50 text-ok dark:bg-emerald-500/20 dark:text-emerald-300" }
                  : a.pending > 0 ? { t: "Waiting to activate", c: "bg-[#FFF8E6] text-[#7A5B00] dark:bg-amber-400/15 dark:text-amber-200" }
                  : a.deactivated > 0 ? { t: "Deactivated", c: "bg-bad-bg text-bad dark:bg-rose-500/20 dark:text-rose-300" }
                  : { t: "No account", c: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" };
                return (
                  <tr key={b.id} className={String(b.id) === barangayId ? "bg-[#EBF2FF]/60 dark:bg-white/5" : ""}>
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-[#1B1235] dark:text-white">
                      <button
                        type="button"
                        onClick={() => {
                          setBarangayId(String(b.id) === barangayId ? "" : String(b.id));
                          setPage(1);
                        }}
                        className={`rounded text-left underline-offset-4 hover:underline ${focusRing}`}
                      >
                        {b.name}
                      </button>
                    </th>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${account.c}`}>{account.t}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{ago(b.last_activity_at)}</td>
                    <td className="py-2.5 pr-3 text-right">{b.actions_30d}</td>
                    <td className="py-2.5 pr-3 text-right">{b.reports}</td>
                    <td className="py-2.5 pr-3 text-right">{b.announcements + b.programs}</td>
                  </tr>
                );
              })}
              {summary.loading && (
                <tr><td colSpan={6} className="py-8 text-center text-muted dark:text-slate-400">Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- activity feed ---------- */}
      <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-[#E8E3F7] dark:bg-white/5 dark:ring-white/10" aria-labelledby="feed">
        <h2 id="feed" className="font-medium text-[#1B1235] dark:text-white">Transactions</h2>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
          <input type="search" value={q} onChange={(e) => changeFilter(setQ)(e.target.value)} placeholder="Search name, email, title" aria-label="Search" className={`${field} lg:col-span-2`} />
          <select value={role} onChange={(e) => changeFilter(setRole)(e.target.value)} aria-label="Who" className={field}>
            <option value="">DILG supervisors and reps</option>
            <option value="super_admin">Super admin</option>
            <option value="office_supervisor">DILG supervisor</option>
            <option value="barangay_rep">Barangay reps</option>
          </select>
          <select value={group} onChange={(e) => changeFilter(setGroup)(e.target.value)} aria-label="What" className={field}>
            <option value="">All actions</option>
            {(s?.by_group_7d ?? []).map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => changeFilter(setFrom)(e.target.value)} aria-label="From date" className={field} />
          <input type="date" value={to} onChange={(e) => changeFilter(setTo)(e.target.value)} aria-label="To date" className={field} />
        </div>
        {barangayId && (
          <button type="button" onClick={() => changeFilter(setBarangayId)("")} className={`mt-3 rounded-full bg-[#EBF2FF] px-3 py-1 text-xs font-semibold text-[#002B7F] dark:bg-[#0039A6]/25 dark:text-[#93C5FD] ${focusRing}`}>
            Barangay: {s?.barangays.find((b) => String(b.id) === barangayId)?.name} &times; clear
          </button>
        )}

        {feedError ? (
          <p className="mt-6 font-medium text-bad dark:text-rose-400">{feedError}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#EDE7FA] dark:divide-white/10" aria-busy={feedLoading}>
            {(feed?.data ?? []).map((r) => {
              const tag = r.actor ? ROLE_TAG[r.actor.role] : null;
              return (
                <li key={r.id} className="flex items-start gap-3 py-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: GROUP_DOT[r.group] ?? GROUP_DOT.other }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-100">
                      <span className="font-semibold">{r.actor?.name ?? "Unknown user"}</span>{" "}
                      <span className="text-slate-600 dark:text-slate-300">{r.label.charAt(0).toLowerCase() + r.label.slice(1)}</span>
                      {r.detail && <span className="font-medium"> &ldquo;{r.detail}&rdquo;</span>}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {tag && <span className={`rounded-full px-2 py-0.5 font-semibold ${tag.cls}`}>{tag.label}</span>}
                      {r.barangay && <span>Barangay {r.barangay}</span>}
                      <span>{r.group_label}</span>
                      {r.ip_address && <span>IP {r.ip_address}</span>}
                    </p>
                  </div>
                  <time dateTime={r.created_at} className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {when(r.created_at)}
                  </time>
                </li>
              );
            })}
            {!feedLoading && feed && feed.data.length === 0 && (
              <li className="py-10 text-center text-sm text-muted dark:text-slate-400">No transactions match these filters.</li>
            )}
            {feedLoading && !feed && <li className="py-10 text-center text-sm text-muted dark:text-slate-400">Loading...</li>}
          </ul>
        )}

        {feed && feed.last_page > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pages">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`rounded-full px-4 py-1.5 font-semibold text-[#002B7F] disabled:opacity-40 dark:text-[#93C5FD] ${focusRing}`}>
              &larr; Newer
            </button>
            <span className="text-slate-500 dark:text-slate-400">
              Page {feed.current_page} of {feed.last_page} &middot; {feed.total} transactions
            </span>
            <button type="button" disabled={page >= feed.last_page} onClick={() => setPage((p) => p + 1)} className={`rounded-full px-4 py-1.5 font-semibold text-[#002B7F] disabled:opacity-40 dark:text-[#93C5FD] ${focusRing}`}>
              Older &rarr;
            </button>
          </nav>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, bg, hint }: { label: string; value?: number; bg: string; hint?: string }) {
  return (
    <div className={`rounded-3xl p-5 ${bg}`}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#1B1235] dark:text-white">{value ?? "–"}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
