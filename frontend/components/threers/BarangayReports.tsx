"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate, isPastDue } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ThreeRsTabs from "./ThreeRsTabs";
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

  const { data, loading, error, reload } = useFetch<Paged<RepoSubmission>>(`/api/submissions?${qs}`);
  const summary = useFetch<Paged<RepoSubmission>>("/api/submissions?per_page=200");
  const templates = useFetch<CategoryWithTemplate[]>("/api/resources");

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

      {all.length > 0 && (
        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:grid-cols-4">
          <Stat label="To file" value={count("pending")} />
          <Stat label="Waiting for review" value={count("submitted", "under_review")} />
          <Stat label="Compliant" value={count("compliant")} tone="text-ok" />
          <Stat label="Needs fixing" value={count("non_compliant")} tone="text-bad" />
        </dl>
      )}

      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-900">My reports</h2>
        <label className="text-sm">
          <span className="sr-only">Filter by status</span>
          <select
            className={field}
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
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Reports to submit</caption>
          <thead className="bg-navy-50 text-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Report</th>
              <th scope="col" className="px-4 py-3 font-semibold">Period</th>
              <th scope="col" className="px-4 py-3 font-semibold">Due date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && rows.length === 0 ? (
              <EmptyRow cols={5}>Loading your reports...</EmptyRow>
            ) : error ? (
              <EmptyRow cols={5}>
                <span className="font-medium text-bad">{error}</span>{" "}
                <button onClick={reload} className="underline underline-offset-4">Try again</button>
              </EmptyRow>
            ) : rows.length === 0 ? (
              <EmptyRow cols={5}>No reports here yet. Your DILG Makati office will open report periods.</EmptyRow>
            ) : (
              rows.map((s) => {
                const canUpload = ["pending", "submitted", "non_compliant"].includes(s.status);
                const tpl = templateFor(s.report_category_id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3.5 font-medium">
                      {s.category?.name ?? "Report"}
                      {tpl && s.status !== "compliant" && (
                        <a
                          className="mt-0.5 block text-xs font-normal text-navy-700 underline underline-offset-4"
                          href={apiUrl(`/api/resources/${tpl.id}/download`)}
                        >
                          Get the current form (v{tpl.version})
                        </a>
                      )}
                    </td>
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
                    <td className="px-4 py-3.5">
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
                        <span className="text-xs text-muted">{s.status === "compliant" ? "Approved" : "Being reviewed"}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}
      <p className="mt-3 max-w-prose text-xs text-muted">
        Accepted files: PDF, Word or Excel, up to 10 MB. Filed reports are kept in the Repository tab.
      </p>

      <IncidentSection onFlash={setFlash} />
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

const INCIDENT_TYPES: [string, string][] = [
  ["phishing_attempt", "Phishing email or message"],
  ["suspicious_login", "Suspicious login"],
  ["data_leak_suspicion", "Possible data leak"],
  ["malware", "Virus or malware"],
  ["other", "Something else"],
];

function IncidentSection({ onFlash }: { onFlash: (f: Flash) => void }) {
  const incidents = useFetch<Paged<Incident>>("/api/security-incidents");
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
    <section aria-labelledby="h-incident" className="mt-12">
      <h2 id="h-incident" className="text-lg font-semibold text-navy-900">Report a security concern</h2>
      <p className="mb-4 mt-1 max-w-prose text-sm text-muted">
        Received a suspicious email, link or call? Tell the office here instead of forwarding it informally. Do not open
        attachments or links from the message.
      </p>

      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">What happened?</span>
          <select name="type" required className={`${field} w-full`} defaultValue="phishing_attempt">
            {INCIDENT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">How serious does it look?</span>
          <select name="severity" required className={`${field} w-full`} defaultValue="low">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical (data may already be exposed)</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Describe it</span>
          <textarea name="description" required rows={3} maxLength={5000} className={`${field} w-full`} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Screenshot or file (optional: PNG, JPG, PDF or TXT, up to 10 MB)</span>
          <input ref={fileRef} name="evidence" type="file" accept=".png,.jpg,.jpeg,.pdf,.txt" className="block w-full text-sm" />
        </label>
        <div className="sm:col-span-2">
          <button className={btn} disabled={busy} type="submit">{busy ? "Sending..." : "Send report"}</button>
        </div>
      </form>

      {incidents.data && incidents.data.data.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-navy-800">Your earlier reports</h3>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white text-sm">
            {incidents.data.data.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span>
                  <span className="font-medium">{i.type.replaceAll("_", " ")}</span>
                  <span className="text-muted"> &middot; {formatDateTime(i.created_at)}</span>
                </span>
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-semibold text-navy-800">
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
