"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { formatDate, isPastDue } from "@/lib/format";
import type { Paginated, Submission } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function BarangayDashboard() {
  const { user } = useAuth();
  const { data, loading, error, retry } = useApi<Paginated<Submission>>("/api/submissions");
  const submissions = data?.data ?? [];

  const count = (s: Submission["status"]) => submissions.filter((x) => x.status === s).length;

  return (
    <>
      <h1 className="text-3xl font-semibold text-navy-900">
        {user?.barangay?.name ?? "Your barangay"}
      </h1>
      <p className="mt-1 text-muted">Your report submissions and where each one stands.</p>

      {!loading && !error && submissions.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:grid-cols-4">
          <Stat label="To file" value={count("pending")} />
          <Stat label="Waiting for review" value={count("submitted") + count("under_review")} />
          <Stat label="Compliant" value={count("compliant")} tone="text-ok" />
          <Stat label="Needs fixing" value={count("non_compliant")} tone="text-bad" />
        </dl>
      )}

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Report submissions for your barangay</caption>
          <thead className="bg-navy-50 text-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Report</th>
              <th scope="col" className="px-4 py-3 font-semibold">Period</th>
              <th scope="col" className="px-4 py-3 font-semibold">Due date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">Loading your reports...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <p className="font-medium text-bad">{error}</p>
                  <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 underline underline-offset-4">
                    Try again
                  </button>
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No reports assigned yet. Your DILG Makati office will add report periods here.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3.5 font-medium">{s.category?.name ?? "Report"}</td>
                  <td className="px-4 py-3.5 tabular-nums">{s.period_label}</td>
                  <td className="px-4 py-3.5 tabular-nums">
                    {formatDate(s.due_date)}
                    {s.status === "pending" && isPastDue(s.due_date) && (
                      <span className="ml-2 text-xs font-semibold text-bad">Overdue</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={s.status} />
                    {s.status === "non_compliant" && s.review_remarks && (
                      <p className="mt-1.5 max-w-[36ch] text-xs text-muted">{s.review_remarks}</p>
                    )}
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
