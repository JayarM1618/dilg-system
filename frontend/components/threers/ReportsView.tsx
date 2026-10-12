"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import BarangayReports from "./BarangayReports";
import ThreeRsTabs from "./ThreeRsTabs";
import ReportSetup from "./ReportSetup";
import { PageTitle, Pager, btn, btnGhost, field, formatDateTime } from "./ui";
import type { AuditEntry, ComplianceReport, Paged, Period, SecuritySummary } from "./types";

export default function ReportsView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("");

  const isOffice = user ? user.role !== "barangay_rep" : false;
  const qs = period ? `?period_label=${encodeURIComponent(period)}` : "";

  const periods = useFetch<{ data: Period[] }>(isOffice ? "/api/reports/periods" : null);
  const report = useFetch<ComplianceReport>(isOffice ? `/api/reports/compliance${qs}` : null);
  const security = useFetch<SecuritySummary>(isOffice ? "/api/reports/security" : null);

  if (!user) return null;

  if (!isOffice) return <BarangayReports />;

  const t = report.data?.totals;
  const shown = report.data?.period_label ?? period;

  return (
    <>
      <PageTitle title="Reports" subtitle="Compliance and security reporting for DILG Makati and its barangays." />
      <ThreeRsTabs />

      <ReportSetup
        onChanged={() => {
          periods.reload();
          report.reload();
        }}
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <label className="text-sm w-full sm:w-auto">
          <span className="mb-1 block text-muted dark:text-slate-400">Reporting period</span>
          <select className={`${field} w-full sm:w-auto`} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Latest period</option>
            {periods.data?.data.map((p) => (
              <option key={p.period_label} value={p.period_label} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{p.period_label}</option>
            ))}
          </select>
        </label>
        <a
          className={`${btn} w-full sm:w-auto text-center`}
          aria-disabled={!shown}
          href={shown ? apiUrl(`/api/reports/compliance/export?period_label=${encodeURIComponent(shown)}`) : undefined}
        >
          Export {shown || "period"} as CSV
        </a>
      </div>

      {/* ---------- Compliance ---------- */}
      <section aria-labelledby="h-compliance" className="mb-10">
        <h2 id="h-compliance" className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">Compliance {shown && <span className="font-normal text-muted dark:text-slate-400">&middot; {shown}</span>}</h2>

        {report.error ? (
          <p className="font-medium text-bad dark:text-rose-400">{report.error}</p>
        ) : !t ? (
          <p className="text-muted dark:text-slate-400">Loading...</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 border-y border-line dark:border-white/10 py-5 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Compliance rate" value={`${t.compliance_rate}%`} tone="text-ok dark:text-emerald-400" />
              <Kpi label="Filing rate" value={`${t.filing_rate}%`} />
              <Kpi label="Awaiting review" value={t.submitted + t.under_review} />
              <Kpi label="Needs fixing" value={t.non_compliant} tone="text-bad dark:text-rose-400" />
              <Kpi label="Overdue, not filed" value={t.overdue} tone="text-bad dark:text-rose-400" />
            </dl>

            <div className="mt-6 overflow-x-auto rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Compliance by barangay</caption>
                <thead className="bg-navy-50 dark:bg-white/5 text-navy-800 dark:text-[#D1C4F9]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Compliant</th>
                    <th scope="col" className="px-4 py-3 font-semibold">In review</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Needs fixing</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Not filed</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-white/10">
                  {report.data?.by_barangay.map((b) => (
                    <tr key={b.barangay.id}>
                      <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">{b.barangay.name}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{b.compliant}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{b.awaiting_review}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{b.non_compliant}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                        {b.not_filed}
                        {b.overdue > 0 && <span className="ml-2 text-xs font-semibold text-bad dark:text-rose-400">{b.overdue} overdue</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-navy-50 dark:bg-white/10" aria-hidden="true">
                            <div className="h-full bg-navy-700 dark:bg-[#7B4DFF]" style={{ width: `${b.compliance_rate}%` }} />
                          </div>
                          <span className="tabular-nums text-slate-900 dark:text-white font-medium">{b.compliance_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.data && report.data.overdue.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-bad dark:text-rose-400">Overdue and still not filed ({report.data.overdue.length})</h3>
                <ul className="divide-y divide-line dark:divide-white/10 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5 text-sm">
                  {report.data.overdue.map((o) => (
                    <li key={o.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5 text-slate-800 dark:text-slate-200">
                      <span><span className="font-medium text-navy-900 dark:text-white">{o.barangay}</span> &middot; {o.category}</span>
                      <span className="text-muted dark:text-slate-400">was due {formatDate(o.due_date)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------- Security ---------- */}
      <section aria-labelledby="h-security" className="mb-10">
        <h2 id="h-security" className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">Security incidents</h2>
        {security.error ? (
          <p className="font-medium text-bad dark:text-rose-400">{security.error}</p>
        ) : !security.data ? (
          <p className="text-muted dark:text-slate-400">Loading...</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 border-y border-line dark:border-white/10 py-5 sm:grid-cols-4">
              <Kpi label="Reported in total" value={security.data.total} />
              <Kpi label="Still open" value={security.data.open} tone={security.data.open > 0 ? "text-bad dark:text-rose-400" : "text-ink dark:text-white"} />
              <Kpi label="Unanswered over 24 h" value={security.data.unacknowledged_over_24h} tone={security.data.unacknowledged_over_24h > 0 ? "text-bad dark:text-rose-400" : "text-ink dark:text-white"} />
              <Kpi
                label="Avg. time to acknowledge"
                value={security.data.avg_hours_to_acknowledge === null ? "-" : `${security.data.avg_hours_to_acknowledge} h`}
              />
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Breakdown title="By type" data={security.data.by_type} />
              <Breakdown title="By severity" data={security.data.by_severity} />
              <Breakdown title="By status" data={security.data.by_status} />
            </div>
          </>
        )}
      </section>

      {user.role === "super_admin" && <AuditLog />}
    </>
  );
}

function Kpi({ label, value, tone = "text-ink dark:text-white" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted dark:text-slate-400">{label}</dt>
      <dd className={`mt-0.5 font-display text-3xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  return (
    <div className="rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5 p-4">
      <h3 className="mb-2 text-sm font-semibold text-navy-800 dark:text-[#D1C4F9]">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted dark:text-slate-400">None</p>
      ) : (
        <ul className="space-y-1 text-sm text-slate-800 dark:text-slate-200">
          {entries.map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k.replaceAll("_", " ")}</span>
              <span className="tabular-nums font-medium">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AuditLog() {
  const [page, setPage] = useState(1);
  const [actionInput, setActionInput] = useState("");
  const [action, setAction] = useState("");

  const qs = new URLSearchParams({ page: String(page) });
  if (action) qs.set("action", action);
  const { data, loading, error } = useFetch<Paged<AuditEntry>>(`/api/reports/audit-logs?${qs}`);

  return (
    <section aria-labelledby="h-audit">
      <h2 id="h-audit" className="mb-1 text-lg font-semibold text-navy-900 dark:text-white">Audit trail</h2>
      <p className="mb-3 text-sm text-muted dark:text-slate-400">Who did what, and when. Visible to the super admin only.</p>

      <form
        className="mb-3 flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAction(actionInput.trim());
          setPage(1);
        }}
      >
        <label className="w-full sm:w-auto">
          <span className="sr-only">Filter by action</span>
          <input className={`${field} w-full sm:w-80`} placeholder="Action starts with, e.g. submission." value={actionInput} onChange={(e) => setActionInput(e.target.value)} />
        </label>
        <button className={`${btnGhost} w-full sm:w-auto`} type="submit">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Audit trail</caption>
          <thead className="bg-navy-50 dark:bg-white/5 text-navy-800 dark:text-[#D1C4F9]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">When</th>
              <th scope="col" className="px-4 py-3 font-semibold">Who</th>
              <th scope="col" className="px-4 py-3 font-semibold">Action</th>
              <th scope="col" className="px-4 py-3 font-semibold">Record</th>
              <th scope="col" className="px-4 py-3 font-semibold">IP address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-white/10">
            {error ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center font-medium text-bad dark:text-rose-400">{error}</td></tr>
            ) : loading && !data ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted dark:text-slate-400">Loading...</td></tr>
            ) : data && data.data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted dark:text-slate-400">No entries.</td></tr>
            ) : (
              data?.data.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDateTime(l.created_at)}</td>
                  <td className="px-4 py-2.5 text-navy-900 dark:text-white font-medium">{l.user ? `${l.user.name}` : "System / guest"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-800 dark:text-slate-200">{l.action}</td>
                  <td className="px-4 py-2.5 text-xs text-muted dark:text-slate-400">
                    {l.subject_type ? `${l.subject_type.split("\\").pop()} #${l.subject_id}` : "-"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{l.ip_address ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}
    </section>
  );
}
