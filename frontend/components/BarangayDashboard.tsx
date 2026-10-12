"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/format";
import { apiUrl } from "@/lib/http";
import type { Paginated, Submission } from "@/types";
import StatusBadge from "@/components/StatusBadge";

/* ------------------------------------------------------------------ */
/* Status palette: one colour per status, reused by every chart below. */
/* ------------------------------------------------------------------ */

type Status = Submission["status"];

const GROUPS = [
  { key: "compliant", label: "Compliant", color: "#06D6A0", statuses: ["compliant"] },
  { key: "review", label: "Waiting for review", color: "#7B2FF7", statuses: ["submitted", "under_review"] },
  { key: "pending", label: "To file", color: "#FFD60A", statuses: ["pending"] },
  { key: "fix", label: "Needs fixing", color: "#F21D6B", statuses: ["non_compliant"] },
] as const satisfies ReadonlyArray<{ key: string; label: string; color: string; statuses: readonly Status[] }>;

type GroupKey = (typeof GROUPS)[number]["key"];

function groupOf(status: Status): GroupKey {
  return GROUPS.find((g) => (g.statuses as readonly string[]).includes(status))?.key ?? "pending";
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function BarangayDashboard() {
  const { user } = useAuth();
  // per_page=200 is the API maximum; one page is enough to cover a barangay's whole year.
  const { data, loading, error, retry } = useApi<Paginated<Submission>>("/api/submissions?per_page=200");
  const submissions = data?.data ?? [];

  const counts: Record<GroupKey, number> = { compliant: 0, review: 0, pending: 0, fix: 0 };
  submissions.forEach((s) => (counts[groupOf(s.status)] += 1));

  const total = submissions.length;
  const compliantPct = total ? Math.round((counts.compliant / total) * 100) : 0;
  const overdue = submissions.filter((s) => s.is_overdue).length;
  const recent = submissions.slice(0, 6);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-navy-900 dark:text-white transition-colors duration-500 ease-out">{user?.barangay?.name ?? "Your barangay"}</h1>
          <p className="mt-1 text-sm sm:text-base text-muted dark:text-slate-400">Your report submissions and where each one stands.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link
          href="/user/reports"
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-[#7B4DFF] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5A18C9]"
        >
          Submit a report
        </Link>
        <button
          type="button"
          onClick={() => downloadCsv(submissions, user?.barangay?.name ?? "barangay")}
          disabled={total === 0}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border-2 border-[#7B2FF7] px-5 py-2 text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors hover:bg-[#7B2FF7] hover:text-white dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B2FF7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#5A18C9]"
        >
          <DownloadIcon />
          Download report
        </button>
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-3xl bg-[#FFF0F4] dark:bg-rose-950/30 dark:border dark:border-rose-900/50 p-8 text-center" role="alert">
          <p className="font-medium text-bad dark:text-rose-400">{error}</p>
          <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 dark:text-slate-300 underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Row 1: overall, trend, breakdown */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <OverallCard total={total} done={counts.compliant} pct={compliantPct} toFile={counts.pending} overdue={overdue} />
            <TrendCard submissions={submissions} />
            <div className="sm:col-span-2 lg:col-span-1">
              <BreakdownCard counts={counts} total={total} pct={compliantPct} />
            </div>
          </div>

          {/* New from DILG: forms, guidelines and advisories the barangay can download */}
          <DilgFeedCard />

          {/* Row 2: recent table, per-report breakdown */}
          <div className="mt-5 grid gap-5 lg:grid-cols-5">
            <RecentCard rows={recent} total={total} />
            <CategoryCard submissions={submissions} />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function OverallCard({
  total, done, pct, toFile, overdue,
}: { total: number; done: number; pct: number; toFile: number; overdue: number }) {
  return (
    <section className="flex min-w-0 flex-col rounded-3xl bg-[#E6FBF3] dark:bg-[#12382C]/60 dark:border dark:border-[#06D6A0]/20 p-6 backdrop-blur-xl transition-all duration-500 ease-out" aria-labelledby="overall-title">
      <h2 id="overall-title" className="text-xl font-medium text-navy-900 dark:text-[#E8FAFF]">Overall information</h2>

      <div className="mt-5 flex items-center gap-3 text-[#2C5A4D] dark:text-[#A3EED6]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#BDF3DE] dark:bg-[#1C5243]" aria-hidden="true">
          <CheckIcon />
        </span>
        <span>{done} of {total} reports compliant</span>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#BDF3DE] dark:bg-[#1C5243]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Reports compliant"
      >
        <div className="h-full rounded-full bg-[#06D6A0]" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-4 pt-8">
        <Tile value={total} label="Reports" />
        <Tile value={toFile} label="To file" />
      </div>
      {overdue > 0 && (
        <p className="mt-4 text-sm font-semibold text-[#B0123F] dark:text-rose-400">
          {overdue} {overdue === 1 ? "report is" : "reports are"} past the due date.
        </p>
      )}
    </section>
  );
}

const RESOURCE_LABEL: Record<string, string> = {
  template: "Form",
  guideline: "Guideline",
  sop: "Procedure",
  security_advisory: "Advisory",
  other: "Other",
};

/** Latest forms, guidelines and advisories DILG Makati published. Laravel only returns the live versions. */
function DilgFeedCard() {
  const { data } = useApi<{ data: { id: number; title: string; type: string; version: string; description: string | null; created_at: string; category?: { name: string } | null }[] }>("/api/resources/library");
  const items = [...(data?.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return (
    <section className="mt-5 min-w-0 rounded-3xl bg-[#E8FAFF] dark:bg-[#12303D]/70 dark:border dark:border-[#38bdf8]/20 p-6" aria-labelledby="dilg-feed-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="dilg-feed-title" className="text-xl font-medium text-navy-900 dark:text-[#E8FAFF]">Latest from DILG Makati</h2>
        <Link href="/user/resources" className="text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] underline underline-offset-4">All resources</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted dark:text-slate-400">DILG has not published any forms or guidelines yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#CDEFF8] dark:divide-white/10">
          {items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-navy-900 dark:text-white">
                  {r.title} <span className="font-normal text-muted dark:text-slate-400">v{r.version}</span>
                </p>
                <p className="text-xs text-muted dark:text-slate-400">
                  {RESOURCE_LABEL[r.type] ?? r.type}
                  {r.category ? ` for ${r.category.name}` : ""} &middot; {formatDate(r.created_at)}
                </p>
              </div>
              <a
                href={apiUrl(`/api/resources/${r.id}/download`)}
                className="rounded-full border-2 border-[#7B2FF7] px-4 py-1.5 text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] hover:bg-[#7B2FF7] hover:text-white transition-colors"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#06D6A0] dark:bg-[#06D6A0]/90 px-4 py-5 text-center text-[#04281F] shadow-sm">
      <p className="font-display text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

/* ---- Trend line chart ---- */

type MonthPoint = { month: string; label: string; due: number; filed: number };

function monthlyPoints(submissions: Submission[]): MonthPoint[] {
  const byMonth = new Map<string, { due: number; filed: number }>();
  submissions.forEach((s) => {
    const m = String(s.due_date).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(m)) return;
    const row = byMonth.get(m) ?? { due: 0, filed: 0 };
    row.due += 1;
    if (s.status !== "pending") row.filed += 1;
    byMonth.set(m, row);
  });
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([month, v]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleString("en", { month: "short" }),
      ...v,
    }));
}

function TrendCard({ submissions }: { submissions: Submission[] }) {
  const points = monthlyPoints(submissions);
  const [hover, setHover] = useState<number | null>(null);

  const W = 360, H = 224, L = 30, R = 12, T = 46, B = 30;
  const max = niceMax(Math.max(0, ...points.map((p) => p.due)));
  const x = (i: number) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const due = points.map((p, i) => ({ x: x(i), y: y(p.due) }));
  const filed = points.map((p, i) => ({ x: x(i), y: y(p.filed) }));
  const active = hover !== null ? points[hover] : undefined;

  return (
    <section className="min-w-0 rounded-3xl bg-[#F3EDFE] dark:bg-[#2A233D]/70 dark:border dark:border-white/10 p-6 backdrop-blur-xl transition-all duration-500 ease-out" aria-labelledby="trend-title">
      <h2 id="trend-title" className="text-xl font-medium text-navy-900 dark:text-[#E9DFFF]">Reports by month</h2>
      <div className="mt-3 flex gap-5 text-sm text-navy-800 dark:text-[#D1C4F9]">
        <LegendDot color="#7B2FF7" label="Due" />
        <LegendDot color="#F21DB4" label="Filed" />
      </div>

      {points.length === 0 ? (
        <p className="py-16 text-center text-muted dark:text-slate-400">Nothing to chart yet. Reports appear here once your office opens a period.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-2 w-full"
          role="img"
          aria-label={`Reports due and filed per month. ${points.map((p) => `${p.label}: ${p.filed} of ${p.due} filed`).join(". ")}.`}
          onMouseLeave={() => setHover(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} className="stroke-[#DDD0F8] dark:stroke-[#463B63]" strokeWidth="1" />
              <text x={L - 8} y={y(max * f) + 4} textAnchor="end" fontSize="10" className="fill-[#6B5F8F] dark:fill-[#AFA2D6]">{Math.round(max * f)}</text>
            </g>
          ))}

          {points.length > 1 ? (
            <>
              <path d={smoothPath(due, T, H - B)} fill="none" stroke="#7B2FF7" strokeWidth="2.5" strokeLinecap="round" />
              <path d={smoothPath(filed, T, H - B)} fill="none" stroke="#F21DB4" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : null}
          {points.length === 1 && (
            <>
              <circle cx={due[0].x} cy={due[0].y} r="4.5" fill="#7B2FF7" />
              <circle cx={filed[0].x} cy={filed[0].y} r="4.5" fill="#F21DB4" />
            </>
          )}

          {points.map((p, i) => (
            <text key={p.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" className="fill-[#6B5F8F] dark:fill-[#AFA2D6]">{p.label}</text>
          ))}

          {hover !== null && active && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#7B2FF7" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={due[hover].x} cy={due[hover].y} r="4" fill="#7B2FF7" />
              <circle cx={filed[hover].x} cy={filed[hover].y} r="4" fill="#F21DB4" />
              <g transform={`translate(${Math.min(Math.max(x(hover) - 42, L), W - R - 84)}, ${2})`}>
                <rect width="84" height="40" rx="6" fill="#140B33" />
                <text x="8" y="16" fontSize="10" fill="#fff" fontWeight="600">{active.label}</text>
                <text x="8" y="31" fontSize="10" fill="#E9DFFF">{active.filed} filed of {active.due}</text>
              </g>
            </g>
          )}

          {points.map((p, i) => (
            <rect
              key={`hit-${p.month}`}
              x={x(i) - (W - L - R) / Math.max(points.length - 1, 1) / 2}
              y={T}
              width={(W - L - R) / Math.max(points.length - 1, 1)}
              height={H - T - B}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      )}
    </section>
  );
}

/* ---- Donut breakdown ---- */

function BreakdownCard({ counts, total, pct }: { counts: Record<GroupKey, number>; total: number; pct: number }) {
  const R = 60, C = 2 * Math.PI * R, GAP = total > 0 && GROUPS.filter((g) => counts[g.key] > 0).length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <section className="min-w-0 rounded-3xl bg-[#FFF8E6] dark:bg-[#382C10]/70 dark:border dark:border-[#FFD60A]/20 p-6 backdrop-blur-xl transition-all duration-500 ease-out" aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="text-xl font-medium text-navy-900 dark:text-[#FBE5A1]">Where your reports stand</h2>
      <p className="mt-1 text-sm text-[#7A5B00] dark:text-[#E2C775]">{pct}% compliant so far</p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <ul className="min-w-0 flex-1 space-y-2 text-xs sm:text-sm text-navy-900 dark:text-[#FBE5A1]">
          {GROUPS.map((g) => (
            <li key={g.key} className="flex items-center justify-between gap-2">
              <LegendDot color={g.color} label={g.label} />
              <span className="font-semibold tabular-nums text-navy-900 dark:text-white">{counts[g.key]}</span>
            </li>
          ))}
        </ul>

        <svg viewBox="0 0 160 160" className="h-28 w-28 sm:h-36 sm:w-36 shrink-0 -rotate-90" role="img" aria-label={`${pct}% of reports are compliant`}>
          <circle cx="80" cy="80" r={R} fill="none" className="stroke-[#F3E8C4] dark:stroke-[#544318]" strokeWidth="16" />
          {total > 0 &&
            GROUPS.map((g) => {
              const len = (counts[g.key] / total) * C;
              if (len === 0) return null;
              const el = (
                <circle
                  key={g.key}
                  cx="80" cy="80" r={R}
                  fill="none"
                  stroke={g.color}
                  strokeWidth="16"
                  strokeDasharray={`${Math.max(len - GAP, 0.5)} ${C}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
          <text x="80" y="80" transform="rotate(90 80 80)" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="600" className="fill-[#2A2000] dark:fill-[#FBE5A1]">
            {pct}%
          </text>
        </svg>
      </div>
    </section>
  );
}

/* ---- Recent reports table ---- */

function RecentCard({ rows, total }: { rows: Submission[]; total: number }) {
  return (
    <section className="min-w-0 rounded-3xl bg-[#F3EDFE] dark:bg-[#2A233D]/70 dark:border dark:border-white/10 p-6 lg:col-span-3 backdrop-blur-xl transition-all duration-500 ease-out" aria-labelledby="recent-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-title" className="text-xl font-medium text-navy-900 dark:text-[#E9DFFF]">Latest reports</h2>
        <Link
          href="/user/repository"
          className="text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B2FF7]"
        >
          Open repository
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <caption className="sr-only">Your most recent report submissions</caption>
          <thead className="text-navy-800 dark:text-[#D1C4F9]">
            <tr className="border-b border-[#DDD0F8] dark:border-[#463B63]">
              <th scope="col" className="py-2.5 pr-3 font-semibold">Report</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Period</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Due date</th>
              <th scope="col" className="py-2.5 pl-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6DCFA] dark:divide-[#3A3252]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-muted dark:text-slate-400">
                  No reports assigned yet. Your DILG Makati office will add report periods here.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 pr-3 font-medium text-navy-900 dark:text-white">{s.category?.name ?? "Report"}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-300">{s.period_label}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                    {formatDate(s.due_date)}
                    {s.is_overdue && (
                      <span className="ml-2 text-xs font-semibold text-bad dark:text-rose-400">Overdue</span>
                    )}
                  </td>
                  <td className="py-3 pl-3">
                    <StatusBadge status={s.status} />
                    {s.status === "non_compliant" && s.review_remarks && (
                      <p className="mt-1.5 max-w-[30ch] text-xs text-muted dark:text-slate-400">{s.review_remarks}</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > rows.length && <p className="mt-3 text-xs text-muted dark:text-slate-400">Showing {rows.length} of {total} reports.</p>}
    </section>
  );
}

/* ---- Per-report stacked bars ---- */

function CategoryCard({ submissions }: { submissions: Submission[] }) {
  const byCat = new Map<string, Record<GroupKey, number>>();
  submissions.forEach((s) => {
    const name = s.category?.name ?? "Report";
    const row = byCat.get(name) ?? { compliant: 0, review: 0, pending: 0, fix: 0 };
    row[groupOf(s.status)] += 1;
    byCat.set(name, row);
  });
  const rows = [...byCat.entries()]
    .map(([name, c]) => ({ name, c, sum: c.compliant + c.review + c.pending + c.fix }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 6);
  const widest = Math.max(1, ...rows.map((r) => r.sum));

  return (
    <section className="min-w-0 rounded-3xl bg-[#E8FAFF] dark:bg-[#12303D]/70 dark:border dark:border-[#38bdf8]/20 p-6 lg:col-span-2 backdrop-blur-xl transition-all duration-500 ease-out" aria-labelledby="cat-title">
      <h2 id="cat-title" className="text-xl font-medium text-navy-900 dark:text-[#E8FAFF]">Progress by report</h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-800 dark:text-[#BAE6FD]">
        {GROUPS.map((g) => <LegendDot key={g.key} color={g.color} label={g.label} />)}
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-muted dark:text-slate-400">No reports to compare yet.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-navy-900 dark:text-white" title={r.name}>{r.name}</span>
                <span className="shrink-0 tabular-nums text-muted dark:text-slate-400">{r.c.compliant}/{r.sum}</span>
              </div>
              <div
                className="mt-1.5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-black/30"
                style={{ width: `${(r.sum / widest) * 100}%`, minWidth: "2.5rem" }}
                role="img"
                aria-label={GROUPS.map((g) => `${r.c[g.key]} ${g.label.toLowerCase()}`).join(", ")}
              >
                {GROUPS.map((g) =>
                  r.c[g.key] > 0 ? (
                    <div key={g.key} style={{ flexGrow: r.c[g.key], backgroundColor: g.color }} />
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading your dashboard">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 rounded-3xl bg-[#E6FBF3] dark:bg-[#12382C]/50" />
        <div className="h-72 rounded-3xl bg-[#F3EDFE] dark:bg-[#2A233D]/50" />
        <div className="h-72 rounded-3xl bg-[#FFF8E6] dark:bg-[#382C10]/50" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="h-72 rounded-3xl bg-[#F3EDFE] dark:bg-[#2A233D]/50 lg:col-span-3" />
        <div className="h-72 rounded-3xl bg-[#E8FAFF] dark:bg-[#12303D]/50 lg:col-span-2" />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B7A5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function niceMax(n: number): number {
  if (n <= 4) return 4;
  const step = n <= 8 ? 2 : n <= 20 ? 5 : 10;
  return Math.ceil(n / step) * step;
}

/** Smooth curve through the points (Catmull-Rom converted to cubic beziers), kept inside the plot area. */
function smoothPath(pts: { x: number; y: number }[], top: number, bottom: number): string {
  if (pts.length < 2) return "";
  const clamp = (v: number) => Math.min(Math.max(v, top), bottom);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clamp(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clamp(p2.y - (p3.y - p1.y) / 6) };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(submissions: Submission[], barangay: string) {
  const header = ["Report", "Period", "Due date", "Status", "Remarks"];
  const rows = submissions.map((s) => [
    s.category?.name ?? "Report",
    s.period_label,
    s.due_date,
    s.status.replace("_", " "),
    s.review_remarks ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${barangay.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
