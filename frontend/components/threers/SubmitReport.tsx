"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { btn, field } from "./ui";
import type { Flash } from "./RepositoryView";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

interface Option {
  id: number;
  name: string;
  cycle: string;
  description: string | null;
  template: { id: number; version: string } | null;
  periods: { period_label: string; due_date: string; is_current: boolean; status: string; can_upload: boolean }[];
}

const STATUS_NOTE: Record<string, string> = {
  pending: "not filed yet",
  submitted: "filed, waiting for DILG",
  under_review: "being reviewed",
  compliant: "approved",
  non_compliant: "needs fixing",
};

/**
 * "Submit a report" for a barangay representative: pick the report, pick the period, attach the file.
 * Laravel works out the period and due date and creates the record, so nothing has to be opened first.
 */
export default function SubmitReport({ onFlash, onDone }: { onFlash: (f: Flash) => void; onDone: () => void }) {
  const { data, loading, error, reload } = useFetch<{ data: Option[] }>("/api/submissions/options");
  const options = useMemo(() => data?.data ?? [], [data]);

  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const category = options.find((o) => String(o.id) === categoryId) ?? null;
  const chosen = category?.periods.find((p) => p.period_label === period) ?? null;

  function pickCategory(id: string) {
    setCategoryId(id);
    const c = options.find((o) => String(o.id) === id);
    // default to the first period that can still be filed (the current one when possible)
    setPeriod(c?.periods.find((p) => p.can_upload)?.period_label ?? c?.periods[0]?.period_label ?? "");
  }

  function pickFile(f: File | null) {
    if (!f) return setFile(null);
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      onFlash({ kind: "error", text: "Only PDF, Word or Excel files are accepted." });
      return setFile(null);
    }
    if (f.size > MAX_BYTES) {
      onFlash({ kind: "error", text: "That file is larger than 10 MB." });
      return setFile(null);
    }
    setFile(f);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!category || !chosen || !file) return;

    const body = new FormData();
    body.append("report_category_id", String(category.id));
    body.append("period_label", chosen.period_label);
    body.append("file", file);

    setBusy(true);
    try {
      await apiSend("/api/submissions", "POST", body);
      onFlash({ kind: "ok", text: `Sent "${file.name}" to DILG Makati for ${category.name} (${chosen.period_label}).` });
      setFile(null);
      setInputKey((k) => k + 1);
      reload();
      onDone();
    } catch (err) {
      onFlash({ kind: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="h-submit"
      className="mb-8 rounded-2xl bg-white dark:bg-[#181126] p-6 sm:p-7 border border-slate-200 dark:border-white/10 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3 py-0.5 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
            Official Submission Portal
          </div>
          <h2 id="h-submit" className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Submit a Barangay Report
          </h2>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Select the mandatory requirement, choose the active period, and attach your signed document. Submissions are transmitted directly to the DILG Makati auditing deck.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">
          {error} <button onClick={reload} className="underline underline-offset-4">Try again</button>
        </p>
      ) : loading && options.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading requirement catalog...</p>
      ) : options.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">DILG Makati has not opened any report submission cycles yet.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* Report Category Select */}
          <label className="text-sm">
            <span className="mb-1.5 block font-semibold text-slate-800 dark:text-slate-200">
              Report Category <span className="text-rose-500">*</span>
            </span>
            <select
              required
              value={categoryId}
              onChange={(e) => pickCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20"
            >
              <option value="">Choose a report type...</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.cycle})
                </option>
              ))}
            </select>
          </label>

          {/* Period Select */}
          <label className="text-sm">
            <span className="mb-1.5 block font-semibold text-slate-800 dark:text-slate-200">
              Submission Period &amp; Due Date <span className="text-rose-500">*</span>
            </span>
            <select
              required
              disabled={!category}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!category && <option value="">Select a report category first</option>}
              {category?.periods.map((p) => (
                <option key={p.period_label} value={p.period_label} disabled={!p.can_upload}>
                  {p.period_label}{p.is_current ? " (Current Active)" : ""} &bull; Due {formatDate(p.due_date)} &bull; {STATUS_NOTE[p.status] ?? p.status}
                </option>
              ))}
            </select>
          </label>

          {/* Category Description Banner */}
          {category?.description && (
            <div className="sm:col-span-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 p-3.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-white">Guideline:</span> {category.description}
            </div>
          )}

          {/* Download Official Form Template Link */}
          {category?.template && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-[#F3EDFE]/70 dark:bg-[#7B4DFF]/10 border border-[#E3DEF5] dark:border-[#7B4DFF]/20 p-3 text-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7B4DFF] dark:text-[#CDBBFF] shrink-0">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>
                Need the official document template?{" "}
                <a
                  className="font-bold text-[#5A18C9] dark:text-[#CDBBFF] underline underline-offset-4"
                  href={apiUrl(`/api/resources/${category.template.id}/download`)}
                >
                  Download current DILG Makati template (v{category.template.version})
                </a>
              </span>
            </div>
          )}

          {/* File Attachment Dropzone / Input */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Document Attachment (PDF, Word, or Excel &bull; max 10 MB) <span className="text-rose-500">*</span>
            </span>
            <div className="relative flex items-center gap-4 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-[#1F1733]/50 p-4 transition-colors">
              <input
                key={inputKey}
                type="file"
                required
                accept={ALLOWED.join(",")}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs sm:text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#7B4DFF] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#6A3CF0] file:transition-colors file:cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="sm:col-span-2 pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={busy || !category || !chosen?.can_upload || !file}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {busy ? "Uploading Document..." : chosen && chosen.status !== "pending" ? "Submit Updated Version" : "Transmit Report to DILG"}
            </button>
            {chosen && !chosen.can_upload && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This report cycle is currently locked while under administrative review or already approved.
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
