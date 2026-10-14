"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ThreeRsTabs from "./ThreeRsTabs";
import SubmitReport from "./SubmitReport";
import { EmptyRow, UploadButton, type Flash } from "./RepositoryView";
import { Notice, PageTitle, Pager, btn, field, formatDateTime } from "./ui";
import type { CategoryWithTemplate, Incident, Paged, RepoSubmission } from "./types";

/** REPORTS for a barangay representative: what is due, submit it, follow its status, report an incident. */
export default function BarangayReports() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [flash, setFlash] = useState<Flash>(null);

  const qs = new URLSearchParams({ page: String(page) });
  if (status) qs.set("status", status);

  const { data, loading, error, reload } = useFetch<Paged<RepoSubmission>>(user ? `/api/submissions?${qs}` : null);
  const summary = useFetch<Paged<RepoSubmission>>(user ? "/api/submissions?per_page=200" : null);
  const templates = useFetch<CategoryWithTemplate[]>(user ? "/api/resources" : null);

  if (!user) return null;

  const rows = data?.data ?? [];
  const templateFor = (categoryId: number) => templates.data?.find((c) => c.id === categoryId)?.latest_resource ?? null;

  const all = summary.data?.data ?? [];
  const count = (...s: string[]) => all.filter((x) => s.includes(x.status)).length;

  return (
    <>
      <PageTitle
        title="Reports"
        subtitle={`Submit ${user?.barangay?.name ?? "your barangay"}'s reports and follow where each one stands.`}
      />
      <ThreeRsTabs />

      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      <SubmitReport
        onFlash={setFlash}
        onDone={() => {
          reload();
          summary.reload();
        }}
      />

      {all.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <Stat label="To file" value={count("pending")} icon="file" tone="text-slate-800 dark:text-slate-100" />
          <Stat label="Under review" value={count("submitted", "under_review")} icon="clock" tone="text-amber-600 dark:text-amber-400" />
          <Stat label="Compliant" value={count("compliant")} icon="check" tone="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Needs fixing" value={count("non_compliant")} icon="alert" tone="text-rose-600 dark:text-rose-400" />
        </div>
      )}

      {/* Main Table Panel */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm overflow-hidden mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7B4DFF]/10 text-[#7B4DFF] dark:text-[#CDBBFF]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Barangay Filings & Schedule</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Required regular filings and review statuses for your barangay.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
            <select
              className={`${field} py-1.5 text-xs w-full sm:w-auto font-medium`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Not filed</option>
              <option value="non_compliant">Needs fixing</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="compliant">Compliant</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Reports to submit</caption>
            <thead className="border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">Report & Form</th>
                <th scope="col" className="px-5 py-3.5">Period</th>
                <th scope="col" className="px-5 py-3.5">Due Date</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && rows.length === 0 ? (
                <EmptyRow cols={5}>Loading your reports...</EmptyRow>
              ) : error ? (
                <EmptyRow cols={5}>
                  <span className="font-medium text-bad">{error}</span>{" "}
                  <button onClick={reload} className="underline underline-offset-4 ml-1">Try again</button>
                </EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow cols={5}>No reports here yet. Use &ldquo;Submit a report&rdquo; above to file your first one.</EmptyRow>
              ) : (
                rows.map((s) => {
                  const canUpload = ["pending", "submitted", "non_compliant"].includes(s.status);
                  const tpl = templateFor(s.report_category_id);
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {s.category?.name ?? "Report"}
                        </div>
                        {tpl && s.status !== "compliant" && (
                          <a
                            className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-[#7B4DFF] dark:text-[#CDBBFF] hover:underline"
                            href={apiUrl(`/api/resources/${tpl.id}/download`)}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Official template (v{tpl.version})
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {s.period_label}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{formatDate(s.due_date)}</span>
                          {s.is_overdue && (
                            <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s.status} />
                        {s.status === "non_compliant" && s.review_remarks && (
                          <div className="mt-1.5 max-w-[34ch] rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 p-2 text-xs text-rose-700 dark:text-rose-300">
                            <span className="font-semibold block text-[11px] mb-0.5">Remarks:</span>
                            {s.review_remarks}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canUpload ? (
                          <UploadButton
                            submission={s}
                            onFlash={setFlash}
                            onDone={() => {
                              reload();
                              summary.reload();
                            }}
                            label={s.status === "pending" ? "Submit report" : s.status === "non_compliant" ? "Resubmit" : "Replace file"}
                          />
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5">
                            {s.status === "compliant" ? "Approved" : "Under review"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {data && (
          <div className="border-t border-slate-100 dark:border-white/10 p-3 bg-slate-50/30 dark:bg-white/[0.01]">
            <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />
          </div>
        )}
      </div>

      <IncidentSection onFlash={setFlash} user={user} />
    </>
  );
}

function Stat({ label, value, tone = "text-slate-900 dark:text-white", icon }: { label: string; value: number; tone?: string; icon?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        {icon === "check" && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
        {icon === "alert" && <span className="h-2 w-2 rounded-full bg-rose-500" />}
        {icon === "clock" && <span className="h-2 w-2 rounded-full bg-amber-500" />}
        {icon === "file" && <span className="h-2 w-2 rounded-full bg-slate-400" />}
      </div>
      <div className={`mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${tone}`}>
        {value}
      </div>
    </div>
  );
}

const INCIDENT_TYPES: [string, string][] = [
  ["phishing_attempt", "Phishing email or message"],
  ["suspicious_login", "Suspicious login"],
  ["data_leak_suspicion", "Possible data leak"],
  ["malware", "Virus or malware"],
  ["other", "Something else"],
];

function IncidentSection({
  onFlash,
  user,
}: {
  onFlash: (f: Flash) => void;
  user: ReturnType<typeof useAuth>["user"];
}) {
  const incidents = useFetch<Paged<Incident>>(user ? "/api/security-incidents" : null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    if (!(body.get("evidence") instanceof File) || (body.get("evidence") as File).size === 0) body.delete("evidence");

    setBusy(true);
    try {
      await apiSend("/api/security-incidents", "POST", body);
      form.reset();
      if (fileRef.current) fileRef.current.value = "";
      onFlash({ kind: "ok", text: "Thank you. Your report was sent to the DILG Makati office." });
      incidents.reload();
    } catch (err) {
      onFlash({ kind: "error", text: err instanceof Error ? err.message : "Could not send the report." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="h-incident" className="mt-8 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 id="h-incident" className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Report a Security Concern</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Received a suspicious message, phishing link, or noticed unusual activity? Inform the DILG Makati ICT and security team directly through this channel.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span className="mb-1.5 block">Concern category</span>
          <select name="type" required className={`${field} w-full`} defaultValue="phishing_attempt">
            {INCIDENT_TYPES.map(([v, l]) => (
              <option key={v} value={v} className="bg-white dark:bg-[#1E192D] text-slate-900 dark:text-slate-100">{l}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span className="mb-1.5 block">Estimated severity</span>
          <select name="severity" required className={`${field} w-full`} defaultValue="low">
            <option value="low" className="bg-white dark:bg-[#1E192D] text-slate-900 dark:text-slate-100">Low (Minor anomaly)</option>
            <option value="medium" className="bg-white dark:bg-[#1E192D] text-slate-900 dark:text-slate-100">Medium (Suspicious message or call)</option>
            <option value="high" className="bg-white dark:bg-[#1E192D] text-slate-900 dark:text-slate-100">High (Credentials might be compromised)</option>
            <option value="critical" className="bg-white dark:bg-[#1E192D] text-slate-900 dark:text-slate-100">Critical (Data breached / system lock)</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
          <span className="mb-1.5 block">Detailed incident description</span>
          <textarea
            name="description"
            required
            rows={3}
            maxLength={5000}
            placeholder="Describe what occurred, who contacted you, and any relevant details..."
            className={`${field} w-full resize-y`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
          <span className="mb-1.5 block">Screenshot or attachment (optional, up to 10 MB)</span>
          <input
            ref={fileRef}
            name="evidence"
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,.txt"
            className="block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-300 dark:file:border-white/15 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-white/10 file:text-slate-700 dark:file:text-slate-200 cursor-pointer"
          />
        </label>
        <div className="sm:col-span-2 pt-2">
          <button className={btn} disabled={busy} type="submit">
            {busy ? "Submitting concern..." : "Transmit Security Report"}
          </button>
        </div>
      </form>

      {incidents.data && incidents.data.data.length > 0 && (
        <div className="mt-8 border-t border-slate-100 dark:border-white/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Earlier Security Dispatches</h3>
          <ul className="divide-y divide-slate-100 dark:divide-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-white/[0.02] text-xs">
            {incidents.data.data.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{i.type.replaceAll("_", " ")}</span>
                  <span className="text-slate-400 ml-2 font-mono text-[11px]">{formatDateTime(i.created_at)}</span>
                </div>
                <span className="rounded-full bg-slate-200/70 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {i.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
