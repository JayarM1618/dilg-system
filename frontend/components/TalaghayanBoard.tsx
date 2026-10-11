"use client";

import { useApi } from "@/hooks/useApi";
import type { TalaghayanRow } from "@/types";
import StatusBadge from "@/components/StatusBadge";

interface Summary {
  total_barangays: number;
  pending: number;
  submitted: number;
  compliant: number;
  non_compliant: number;
}

export default function TalaghayanBoard() {
  const grid = useApi<{ data: TalaghayanRow[] }>("/api/dashboard/talaghayan");
  const totals = useApi<Summary>("/api/dashboard/summary");

  const rows = grid.data?.data ?? [];
  const summary = totals.data;
  const loading = grid.loading || totals.loading;
  const error = grid.error ?? totals.error;

  function retry() {
    if (grid.error) grid.retry();
    if (totals.error) totals.retry();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold text-navy-900 dark:text-white transition-colors duration-500 ease-out">Talaghayan</h1>
      <p className="mt-1 text-muted dark:text-slate-400">Report compliance for every active barangay.</p>

      {summary && (
        <dl className="mt-6 grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 border-y border-line dark:border-white/10 py-5 sm:grid-cols-3 md:grid-cols-5">
          <Stat label="Barangays" value={summary.total_barangays} />
          <Stat label="Pending" value={summary.pending} />
          <Stat label="Submitted" value={summary.submitted} tone="text-navy-700 dark:text-[#CDBBFF]" />
          <Stat label="Compliant" value={summary.compliant} tone="text-ok dark:text-emerald-400" />
          <Stat label="Non-compliant" value={summary.non_compliant} tone="text-bad dark:text-rose-400" />
        </dl>
      )}

      <div className="mt-8 overflow-x-auto rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Compliance rate and latest report statuses per barangay</caption>
          <thead className="bg-navy-50 dark:bg-white/5 text-navy-800 dark:text-[#D1C4F9]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
              <th scope="col" className="px-4 py-3 font-semibold">Compliance rate</th>
              <th scope="col" className="px-4 py-3 font-semibold">Latest statuses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted dark:text-slate-400">Loading the tally...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center">
                  <p className="font-medium text-bad dark:text-rose-400">{error}</p>
                  <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 dark:text-slate-300 underline underline-offset-4">
                    Try again
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted dark:text-slate-400">
                  No barangays yet. Add barangays and report periods to start the tally.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.barangay.id}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-navy-900 dark:text-white">
                    {row.barangay.name}
                  </th>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10 ring-1 ring-inset ring-line dark:ring-white/10"
                        role="img"
                        aria-label={`${row.compliance_rate} percent compliant`}
                      >
                        <div className="h-full bg-ok" style={{ width: `${row.compliance_rate}%` }} />
                      </div>
                      <span className="w-12 font-semibold tabular-nums text-slate-900 dark:text-white">{row.compliance_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {row.submissions.length === 0 ? (
                        <span className="text-muted dark:text-slate-400">No reports yet</span>
                      ) : (
                        row.submissions.map((s, i) => (
                          <StatusBadge key={i} status={s.status} label={s.category} />
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "text-ink dark:text-white" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted dark:text-slate-400">{label}</dt>
      <dd className={`mt-0.5 font-display text-3xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}
