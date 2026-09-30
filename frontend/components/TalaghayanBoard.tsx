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
      <h1 className="text-3xl font-semibold text-navy-900">Talaghayan</h1>
      <p className="mt-1 text-muted">Report compliance for every active barangay.</p>

      {summary && (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 md:grid-cols-5">
          <Stat label="Barangays" value={summary.total_barangays} />
          <Stat label="Pending" value={summary.pending} />
          <Stat label="Submitted" value={summary.submitted} tone="text-navy-700" />
          <Stat label="Compliant" value={summary.compliant} tone="text-ok" />
          <Stat label="Non-compliant" value={summary.non_compliant} tone="text-bad" />
        </dl>
      )}

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Compliance rate and latest report statuses per barangay</caption>
          <thead className="bg-navy-50 text-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
              <th scope="col" className="px-4 py-3 font-semibold">Compliance rate</th>
              <th scope="col" className="px-4 py-3 font-semibold">Latest statuses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted">Loading the tally...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center">
                  <p className="font-medium text-bad">{error}</p>
                  <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 underline underline-offset-4">
                    Try again
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted">
                  No barangays yet. Add barangays and report periods to start the tally.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.barangay.id}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left font-medium">
                    {row.barangay.name}
                  </th>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-28 overflow-hidden rounded-full bg-paper ring-1 ring-inset ring-line"
                        role="img"
                        aria-label={`${row.compliance_rate} percent compliant`}
                      >
                        <div className="h-full bg-ok" style={{ width: `${row.compliance_rate}%` }} />
                      </div>
                      <span className="w-12 font-semibold tabular-nums">{row.compliance_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {row.submissions.length === 0 ? (
                        <span className="text-muted">No reports yet</span>
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

function Stat({ label, value, tone = "text-ink" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-0.5 font-display text-3xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}
