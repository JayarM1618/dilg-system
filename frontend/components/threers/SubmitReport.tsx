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
      className="mb-8 rounded-3xl bg-[#F3EDFE] p-5 dark:border dark:border-white/10 dark:bg-[#2A233D]/70 sm:p-6"
    >
      <h2 id="h-submit" className="text-lg font-semibold text-navy-900 dark:text-[#E9DFFF]">Submit a report</h2>
      <p className="mt-1 max-w-prose text-sm text-muted dark:text-slate-400">
        Choose the report, attach your file and send it. DILG Makati sees it right away and will mark it compliant or
        tell you what to fix.
      </p>

      {error ? (
        <p className="mt-4 text-sm font-medium text-bad dark:text-rose-400">
          {error} <button onClick={reload} className="underline underline-offset-4">Try again</button>
        </p>
      ) : loading && options.length === 0 ? (
        <p className="mt-4 text-sm text-muted dark:text-slate-400">Loading...</p>
      ) : options.length === 0 ? (
        <p className="mt-4 text-sm text-muted dark:text-slate-400">DILG Makati has not set up any report types yet.</p>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Which report?</span>
            <select required value={categoryId} onChange={(e) => pickCategory(e.target.value)} className={`${field} w-full`}>
              <option value="">Choose a report...</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.cycle})</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">For which period?</span>
            <select required disabled={!category} value={period} onChange={(e) => setPeriod(e.target.value)} className={`${field} w-full`}>
              {!category && <option value="">Pick a report first</option>}
              {category?.periods.map((p) => (
                <option key={p.period_label} value={p.period_label} disabled={!p.can_upload}>
                  {p.period_label}{p.is_current ? " (current)" : ""} · due {formatDate(p.due_date)} · {STATUS_NOTE[p.status] ?? p.status}
                </option>
              ))}
            </select>
          </label>

          {category?.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">{category.description}</p>
          )}

          {category?.template && (
            <p className="text-sm sm:col-span-2">
              <a
                className="font-medium text-[#5A18C9] underline underline-offset-4 dark:text-[#CDBBFF]"
                href={apiUrl(`/api/resources/${category.template.id}/download`)}
              >
                Download the current DILG form (v{category.template.version})
              </a>{" "}
              <span className="text-muted dark:text-slate-400">and fill it in before uploading.</span>
            </p>
          )}

          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">
              Your file (PDF, Word or Excel, up to 10 MB)
            </span>
            <input
              key={inputKey}
              type="file"
              required
              accept={ALLOWED.join(",")}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#7B4DFF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:text-slate-300"
            />
          </label>

          <div className="sm:col-span-2">
            <button type="submit" className={`${btn} w-full sm:w-auto`} disabled={busy || !category || !chosen?.can_upload || !file}>
              {busy ? "Sending..." : chosen && chosen.status !== "pending" ? "Send new version" : "Send report"}
            </button>
            {chosen && !chosen.can_upload && (
              <p className="mt-2 text-xs text-muted dark:text-slate-400">This report is locked while DILG reviews it or after it was approved.</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
