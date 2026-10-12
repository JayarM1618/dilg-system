"use client";

import { Fragment, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ThreeRsTabs from "./ThreeRsTabs";
import SubmitReport from "./SubmitReport";
import {
  Notice,
  PageTitle,
  Pager,
  btn,
  btnGhost,
  field,
  formatBytes,
  formatDateTime,
} from "./ui";
import type {
  Category,
  Paged,
  Period,
  RepoSubmission,
  SubmissionFileVersion,
} from "./types";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

export type Flash = { kind: "ok" | "error"; text: string } | null;

export default function RepositoryView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageTitle
        title="Repository"
        subtitle={
          user.role === "barangay_rep"
            ? `The archive of everything ${user.barangay?.name ?? "your barangay"} has filed, with every uploaded version.`
            : "All barangay reports in one secure place, with every uploaded version kept."
        }
      />
      <ThreeRsTabs />
      {user.role === "barangay_rep" ? <BarangayRepository /> : <OfficeRepository />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Barangay: archive of what was filed (read-only). Uploading is in    */
/* the Reports tab.                                                    */
/* ------------------------------------------------------------------ */

function BarangayRepository() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch<Paged<RepoSubmission>>(`/api/submissions?has_file=1&page=${page}`);
  const [open, setOpen] = useState<number | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const rows = data?.data ?? [];

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}
      <SubmitReport onFlash={setFlash} onDone={reload} />
      <h2 className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">Filed reports</h2>
      <div className="overflow-x-auto rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">Reports your barangay has filed</caption>
          <thead className="bg-navy-50 dark:bg-white/5 text-navy-800 dark:text-[#D1C4F9]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Report</th>
              <th scope="col" className="px-4 py-3 font-semibold">Period</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Latest file</th>
              <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-white/10">
            {loading && rows.length === 0 ? (
              <EmptyRow cols={5}>Loading...</EmptyRow>
            ) : error ? (
              <EmptyRow cols={5}>
                <span className="font-medium text-bad">{error}</span>{" "}
                <button onClick={reload} className="underline underline-offset-4">Try again</button>
              </EmptyRow>
            ) : rows.length === 0 ? (
              <EmptyRow cols={5}>Nothing filed yet. Use &ldquo;Submit a report&rdquo; above and your file will be kept here.</EmptyRow>
            ) : (
              rows.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td className="px-4 py-3.5 font-medium text-navy-900 dark:text-white">{s.category?.name ?? "Report"}</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">{s.period_label}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.status} />
                      {s.status === "non_compliant" && s.review_remarks && (
                        <p className="mt-1.5 max-w-[36ch] text-xs text-muted dark:text-slate-400">{s.review_remarks}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {s.latest_file && (
                        <>
                          <span className="block max-w-[26ch] truncate text-slate-800 dark:text-slate-200" title={s.latest_file.original_filename}>
                            {s.latest_file.original_filename}
                          </span>
                          <span className="text-xs text-muted dark:text-slate-400">
                            v{s.latest_file.version} &middot; {formatBytes(s.latest_file.size_bytes)} &middot; {formatDateTime(s.latest_file.created_at)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <a className={btnGhost} href={apiUrl(`/api/submissions/${s.id}/download`)}>Download</a>
                        <button className={btnGhost} onClick={() => setOpen(open === s.id ? null : s.id)}>
                          {open === s.id ? "Hide history" : "History"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open === s.id && (
                    <tr>
                      <td colSpan={5} className="bg-navy-50/50 dark:bg-white/5 px-4 py-3">
                        <VersionHistory submissionId={s.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}
    </>
  );
}

export function UploadButton({
  submission,
  label,
  onFlash,
  onDone,
}: {
  submission: RepoSubmission;
  label: string;
  onFlash: (f: Flash) => void;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.includes(ext)) return onFlash({ kind: "error", text: "Only PDF, Word or Excel files are accepted." });
    if (file.size > MAX_BYTES) return onFlash({ kind: "error", text: "That file is larger than 10 MB." });

    const body = new FormData();
    body.append("report_category_id", String(submission.report_category_id));
    body.append("period_label", submission.period_label);
    body.append("file", file);

    setBusy(true);
    try {
      await apiSend("/api/submissions", "POST", body);
      onFlash({ kind: "ok", text: `Uploaded "${file.name}" for ${submission.category?.name ?? "the report"} (${submission.period_label}).` });
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ALLOWED.join(",")}
        className="sr-only"
        aria-label={`${label}: ${submission.category?.name ?? "report"} ${submission.period_label}`}
        onChange={(e) => onPick(e.target.files?.[0])}
        tabIndex={-1}
      />
      <button className={btn} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "Uploading..." : label}
      </button>
    </>
  );
}

export function VersionHistory({ submissionId }: { submissionId: number }) {
  const { data, loading, error } = useFetch<SubmissionFileVersion[]>(`/api/submissions/${submissionId}/files`);

  if (loading) return <p className="text-sm text-muted dark:text-slate-400">Loading history...</p>;
  if (error) return <p className="text-sm font-medium text-bad dark:text-rose-400">{error}</p>;
  if (!data || data.length === 0) return <p className="text-sm text-muted dark:text-slate-400">No uploads yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-left text-xs">
      <thead className="text-navy-800 dark:text-[#D1C4F9]">
        <tr>
          <th className="py-1 pr-4 font-semibold">Version</th>
          <th className="py-1 pr-4 font-semibold">File</th>
          <th className="py-1 pr-4 font-semibold">Uploaded</th>
          <th className="py-1 pr-4 font-semibold">By</th>
          <th className="py-1 pr-4 font-semibold">Size</th>
          <th className="py-1 pr-4 font-semibold" title="SHA-256 fingerprint: proves the file has not been altered">Fingerprint</th>
          <th className="py-1 font-semibold"><span className="sr-only">Download</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line dark:divide-white/10">
        {data.map((f) => (
          <tr key={f.id}>
            <td className="py-1.5 pr-4 tabular-nums text-slate-800 dark:text-slate-200">v{f.version}</td>
            <td className="py-1.5 pr-4 text-slate-800 dark:text-slate-200">{f.original_filename}</td>
            <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-300">{formatDateTime(f.created_at)}</td>
            <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-300">{f.uploader?.name ?? "-"}</td>
            <td className="py-1.5 pr-4 tabular-nums text-slate-700 dark:text-slate-300">{formatBytes(f.size_bytes)}</td>
            <td className="py-1.5 pr-4 font-mono text-slate-600 dark:text-slate-400" title={f.sha256}>{f.sha256.slice(0, 12)}...</td>
            <td className="py-1.5">
              <a className="font-semibold text-navy-700 dark:text-[#CDBBFF] underline underline-offset-4" href={apiUrl(`/api/submissions/${submissionId}/files/${f.id}/download`)}>
                Download
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Office: browse everything, filter, review                           */
/* ------------------------------------------------------------------ */

function OfficeRepository() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [category, setCategory] = useState("");

  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  if (period) qs.set("period_label", period);
  if (category) qs.set("report_category_id", category);

  const { data, loading, error, reload } = useFetch<Paged<RepoSubmission>>(`/api/submissions?${qs}`);
  const periods = useFetch<{ data: Period[] }>("/api/reports/periods");
  const categories = useFetch<Category[]>("/api/resources");
  const [flash, setFlash] = useState<Flash>(null);
  const [open, setOpen] = useState<number | null>(null);
  const rows = data?.data ?? [];

  function applyFilter(set: (v: string) => void) {
    return (e: { target: { value: string } }) => {
      set(e.target.value);
      setPage(1);
    };
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-end flex-wrap gap-3">
        <form onSubmit={onSearch} className="flex gap-2 w-full sm:w-auto">
          <label className="text-sm flex-1 sm:flex-initial">
            <span className="sr-only">Search barangay</span>
            <input
              className={`${field} w-full sm:w-auto`}
              placeholder="Search barangay..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <button className={btnGhost} type="submit">Search</button>
        </form>

        <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
          <label className="text-sm flex-1 min-w-[130px] sm:flex-initial sm:min-w-0">
            <span className="mb-1 block text-muted dark:text-slate-400">Period</span>
            <select className={`${field} w-full sm:w-auto`} value={period} onChange={applyFilter(setPeriod)}>
              <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">All periods</option>
              {periods.data?.data.map((p) => (
                <option key={p.period_label} value={p.period_label} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{p.period_label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm flex-1 min-w-[130px] sm:flex-initial sm:min-w-0">
            <span className="mb-1 block text-muted dark:text-slate-400">Report</span>
            <select className={`${field} w-full sm:w-auto`} value={category} onChange={applyFilter(setCategory)}>
              <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">All reports</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{c.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm flex-1 min-w-[130px] sm:flex-initial sm:min-w-0">
            <span className="mb-1 block text-muted dark:text-slate-400">Status</span>
            <select className={`${field} w-full sm:w-auto`} value={status} onChange={applyFilter(setStatus)}>
              <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">All statuses</option>
              <option value="pending" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Not filed</option>
              <option value="submitted" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Submitted</option>
              <option value="under_review" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Under review</option>
              <option value="compliant" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Compliant</option>
              <option value="non_compliant" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Needs fixing</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">All barangay reports</caption>
          <thead className="bg-navy-50 dark:bg-white/5 text-navy-800 dark:text-[#D1C4F9]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
              <th scope="col" className="px-4 py-3 font-semibold">Report</th>
              <th scope="col" className="px-4 py-3 font-semibold">Period</th>
              <th scope="col" className="px-4 py-3 font-semibold">Due date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">File</th>
              <th scope="col" className="px-4 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-white/10">
            {loading && rows.length === 0 ? (
              <EmptyRow cols={7}>Loading reports...</EmptyRow>
            ) : error ? (
              <EmptyRow cols={7}>
                <span className="font-medium text-bad dark:text-rose-400">{error}</span>{" "}
                <button onClick={reload} className="underline underline-offset-4">Try again</button>
              </EmptyRow>
            ) : rows.length === 0 ? (
              <EmptyRow cols={7}>No reports match these filters.</EmptyRow>
            ) : (
              rows.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td className="px-4 py-3.5 font-medium text-navy-900 dark:text-white">{s.barangay?.name ?? "-"}</td>
                    <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">{s.category?.name ?? "Report"}</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">{s.period_label}</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">
                      {formatDate(s.due_date)}
                      {s.is_overdue && (
                        <span className="ml-2 text-xs font-semibold text-bad dark:text-rose-400">Overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.status} />
                      {s.status === "non_compliant" && s.review_remarks && (
                        <p className="mt-1.5 max-w-[30ch] text-xs text-muted dark:text-slate-400">{s.review_remarks}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {s.latest_file ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted dark:text-slate-400">v{s.latest_file.version}</span>
                          <a className="font-semibold text-navy-700 dark:text-[#CDBBFF] underline underline-offset-4" href={apiUrl(`/api/submissions/${s.id}/download`)}>
                            Download
                          </a>
                          <button className="text-xs text-navy-700 dark:text-[#CDBBFF] underline underline-offset-4" onClick={() => setOpen(open === s.id ? null : s.id)}>
                            {open === s.id ? "Hide history" : "History"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted dark:text-slate-400">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <ReviewControls submission={s} onFlash={setFlash} onDone={reload} />
                    </td>
                  </tr>
                  {open === s.id && (
                    <tr>
                      <td colSpan={7} className="bg-navy-50/50 dark:bg-white/5 px-4 py-3">
                        <VersionHistory submissionId={s.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}
    </>
  );
}

function ReviewControls({
  submission,
  onFlash,
  onDone,
}: {
  submission: RepoSubmission;
  onFlash: (f: Flash) => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [remarks, setRemarks] = useState("");

  if (submission.status === "pending") return <span className="text-xs text-muted dark:text-slate-400">Waiting for barangay</span>;

  async function send(status: "compliant" | "non_compliant" | "under_review", review_remarks?: string) {
    setBusy(true);
    try {
      await apiSend(`/api/submissions/${submission.id}/review`, "PATCH", { status, review_remarks });
      onFlash({ kind: "ok", text: `${submission.barangay?.name ?? "Report"} marked ${status.replace("_", " ")}.` });
      setFixing(false);
      setRemarks("");
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Could not save the review." });
    } finally {
      setBusy(false);
    }
  }

  if (fixing) {
    return (
      <div className="flex min-w-[220px] flex-col gap-2">
        <label className="text-xs text-muted dark:text-slate-400" htmlFor={`rm-${submission.id}`}>What needs fixing? (required)</label>
        <textarea
          id={`rm-${submission.id}`}
          className={field}
          rows={2}
          maxLength={2000}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex gap-2">
          <button className={btn} disabled={busy || remarks.trim() === ""} onClick={() => send("non_compliant", remarks.trim())}>
            Send back
          </button>
          <button className={btnGhost} onClick={() => setFixing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {submission.status === "submitted" && (
        <button className={btnGhost} disabled={busy} onClick={() => send("under_review")}>Start review</button>
      )}
      {submission.status !== "compliant" && (
        <button className={btn} disabled={busy} onClick={() => send("compliant")}>Compliant</button>
      )}
      {submission.status !== "non_compliant" && (
        <button className={btnGhost} disabled={busy} onClick={() => setFixing(true)}>Needs fixing</button>
      )}
    </div>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-muted dark:text-slate-400">{children}</td>
    </tr>
  );
}
