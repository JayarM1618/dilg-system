"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import ThreeRsTabs from "./ThreeRsTabs";
import SubmitReport from "./SubmitReport";
import { EmptyRow, UploadButton } from "./RepositoryView";
import {
  Notice,
  PageTitle,
  Pager,
  btn,
  field,
  formatDateTime,
  CYCLE_LABEL,
  SECTOR_ICON,
} from "./ui";
import type {
  CategoryWithTemplate,
  Incident,
  Paged,
  RepoSubmission,
} from "./types";

/* ================================================================== */
/* Constants                                                           */
/* ================================================================== */

const INCIDENT_TYPES = ["phishing_attempt", "suspicious_login", "data_leak_suspicion", "malware", "other"] as const;
const INCIDENT_TYPE_LABEL: Record<string, string> = {
  phishing_attempt: "Phishing Attempt",
  suspicious_login: "Suspicious Login",
  data_leak_suspicion: "Data Leak Suspicion",
  malware: "Malware",
  other: "Other",
};
const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

type Flash = { kind: "ok" | "error"; text: string } | null;
type CycleKey = "weekly" | "monthly" | "quarterly" | "semestral" | "annual";

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

interface BarangayReportsProps {
  sectorFilter?: string;
}

export default function BarangayReports({ sectorFilter }: BarangayReportsProps = {}) {
  const { user } = useAuth();
  const [flash, setFlash] = useState<Flash>(null);
  const [page, setPage] = useState(1);
  const [cycleFilter, setCycleFilter] = useState<CycleKey | "">("");

  const { data: submissionsData, loading, reload } = useFetch<Paged<RepoSubmission>>(
    user ? `/api/submissions?page=${page}${cycleFilter ? `&cycle=${cycleFilter}` : ""}${sectorFilter ? `&sector=${sectorFilter}` : ""}` : null
  );
  const filings = submissionsData?.data ?? [];

  /* Group filings by cycle for the grouped view */
  const cycles: CycleKey[] = ["weekly", "monthly", "quarterly", "semestral", "annual"];
  const grouped: Record<CycleKey, RepoSubmission[]> = {
    weekly: [], monthly: [], quarterly: [], semestral: [], annual: [],
  };
  for (const f of filings) {
    const cycle = (f.category?.cycle ?? "monthly") as CycleKey;
    if (grouped[cycle]) grouped[cycle].push(f);
    else grouped.monthly.push(f);
  }

  /* Stats */
  const stats = {
    toFile: filings.filter((f) => f.status === "pending").length,
    underReview: filings.filter((f) => f.status === "under_review").length,
    compliant: filings.filter((f) => f.status === "compliant").length,
    needsFix: filings.filter((f) => f.status === "non_compliant").length,
    overdue: filings.filter((f) => f.is_overdue).length,
  };

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {/* Submit Report form */}
      <SubmitReport onFlash={setFlash} onDone={reload} />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="To file" value={stats.toFile} color="amber" />
        <Stat label="Under review" value={stats.underReview} color="blue" />
        <Stat label="Compliant" value={stats.compliant} color="emerald" />
        <Stat label="Needs fixing" value={stats.needsFix} color="rose" />
        <Stat label="Overdue" value={stats.overdue} color="red" />
      </div>

      {/* Cycle filter */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Show:</span>
        <button
          onClick={() => { setCycleFilter(""); setPage(1); }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            !cycleFilter
              ? "bg-[#7B4DFF] text-white"
              : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20"
          }`}
        >
          All
        </button>
        {cycles.map((c) => (
          <button
            key={c}
            onClick={() => { setCycleFilter(c); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              cycleFilter === c
                ? "bg-[#7B4DFF] text-white"
                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20"
            }`}
          >
            {CYCLE_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      {/* Filings table — grouped by cycle */}
      {cycleFilter ? (
        /* Flat table when a single cycle is filtered */
        <FilingsTable
          title={CYCLE_LABEL[cycleFilter] ?? cycleFilter}
          filings={filings}
          loading={loading}
          onFlash={setFlash}
          onDone={reload}
        />
      ) : (
        /* Grouped sections when showing all */
        <div className="space-y-6">
          {cycles.filter((c) => grouped[c].length > 0).map((cycle) => (
            <FilingsTable
              key={cycle}
              title={CYCLE_LABEL[cycle]}
              filings={grouped[cycle]}
              loading={false}
              onFlash={setFlash}
              onDone={reload}
            />
          ))}
          {loading && filings.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">Loading your filings...</p>
          )}
          {!loading && filings.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              No filings yet. Use the form above to submit a report.
            </p>
          )}
        </div>
      )}

      {submissionsData && (
        <Pager page={submissionsData.current_page} last={submissionsData.last_page} total={submissionsData.total} onPage={setPage} />
      )}

      {/* Incident section */}
      <IncidentSection onFlash={setFlash} />
    </>
  );
}

/* ================================================================== */
/* Filings table for a single cycle group                              */
/* ================================================================== */

function FilingsTable({
  title,
  filings,
  loading,
  onFlash,
  onDone,
}: {
  title: string;
  filings: RepoSubmission[];
  loading: boolean;
  onFlash: (f: Flash) => void;
  onDone: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#7B4DFF]/10 dark:bg-[#7B4DFF]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#7B4DFF] dark:text-[#CDBBFF] uppercase tracking-wider">
          {title}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{filings.length} filing(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <caption className="sr-only">{title} filings</caption>
          <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3">Report & Form</th>
              <th scope="col" className="px-5 py-3">Sector</th>
              <th scope="col" className="px-5 py-3">Period</th>
              <th scope="col" className="px-5 py-3">Due Date</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {loading && filings.length === 0 ? (
              <EmptyRow cols={6}>Loading...</EmptyRow>
            ) : filings.length === 0 ? (
              <EmptyRow cols={6}>No filings in this cycle.</EmptyRow>
            ) : (
              filings.map((sub) => {
                const sectorIcon = SECTOR_ICON[sub.category?.sector ?? ""] ?? "";
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                          {sub.category?.name ?? `Category #${sub.report_category_id}`}
                        </p>
                        {sub.category?.deadline_description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[240px]">
                            {sub.category.deadline_description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {sub.category?.sector ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          {sectorIcon && <span>{sectorIcon}</span>}
                          {sub.category.sector}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700 dark:text-slate-300 font-medium">{sub.period_label}</td>
                    <td className="px-5 py-3 text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      <span className={sub.is_overdue ? "text-rose-600 dark:text-rose-400 font-semibold" : ""}>
                        {formatDate(sub.due_date)}
                        {sub.is_overdue && " (Overdue)"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {sub.status === "pending" || sub.status === "non_compliant" ? (
                        <UploadButton
                          submission={sub}
                          label={sub.status === "non_compliant" ? "Resubmit" : "Upload"}
                          onFlash={onFlash}
                          onDone={onDone}
                        />
                      ) : sub.latest_file ? (
                        <a
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          href={apiUrl(`/api/submissions/${sub.id}/download`)}
                        >
                          View file
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Stat card                                                           */
/* ================================================================== */

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const bgMap: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40",
    rose: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40",
    red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40",
  };
  const textMap: Record<string, string> = {
    amber: "text-amber-700 dark:text-amber-400",
    blue: "text-blue-700 dark:text-blue-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    rose: "text-rose-700 dark:text-rose-400",
    red: "text-red-700 dark:text-red-400",
  };

  return (
    <div className={`rounded-2xl border p-4 ${bgMap[color] ?? bgMap.amber}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${textMap[color] ?? textMap.amber}`}>{value}</p>
    </div>
  );
}

/* ================================================================== */
/* Incident section                                                    */
/* ================================================================== */

function IncidentSection({ onFlash }: { onFlash: (f: Flash) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<string>(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: incidents, reload } = useFetch<Paged<Incident>>(user ? "/api/security-incidents?per_page=5" : null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return onFlash({ kind: "error", text: "Please provide a description." });

    const body = new FormData();
    body.append("type", type);
    body.append("severity", severity);
    body.append("description", description.trim());
    const file = fileRef.current?.files?.[0];
    if (file) body.append("evidence", file);

    setBusy(true);
    try {
      await apiSend("/api/security-incidents", "POST", body);
      onFlash({ kind: "ok", text: "Security concern reported. DILG will review it." });
      setDescription("");
      setType(INCIDENT_TYPES[0]);
      setSeverity("medium");
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      reload();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Failed to report incident." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security Concerns</h3>
        <button
          className={btn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Report Incident"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="block mb-1 font-medium text-slate-700 dark:text-slate-300">Type</span>
                <select className={`${field} w-full`} value={type} onChange={(e) => setType(e.target.value)}>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white dark:bg-[#2B2542]">{INCIDENT_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block mb-1 font-medium text-slate-700 dark:text-slate-300">Severity</span>
                <select className={`${field} w-full`} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-white dark:bg-[#2B2542] capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm block">
              <span className="block mb-1 font-medium text-slate-700 dark:text-slate-300">Description <span className="text-rose-500">*</span></span>
              <textarea
                className={`${field} w-full`}
                rows={3}
                required
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
              />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 font-medium text-slate-700 dark:text-slate-300">Attachment (optional)</span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                  file:text-sm file:font-semibold file:bg-[#7B4DFF]/10 file:text-[#7B4DFF]
                  dark:file:bg-[#7B4DFF]/20 dark:file:text-[#CDBBFF]
                  hover:file:bg-[#7B4DFF]/20 transition"
              />
            </label>
            <button type="submit" className={btn} disabled={busy}>
              {busy ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      )}

      {/* Recent incidents */}
      {(incidents?.data?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {incidents!.data.map((inc) => (
            <div
              key={inc.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-[#181126] px-4 py-3 text-sm"
            >
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                inc.severity === "critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                : inc.severity === "high" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              }`}>
                {inc.severity}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{INCIDENT_TYPE_LABEL[inc.type] ?? inc.type}</span>
              <span className="flex-1 text-xs text-slate-500 dark:text-slate-400 truncate">{inc.description}</span>
              <span className="text-xs text-slate-400 tabular-nums">{formatDateTime(inc.created_at)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                inc.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : inc.status === "open" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              }`}>
                {inc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
