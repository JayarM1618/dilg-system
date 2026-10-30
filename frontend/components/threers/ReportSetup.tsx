"use client";

import { useState, type FormEvent } from "react";
import { apiSend } from "@/lib/http";
import { btn, btnGhost, field, Notice } from "./ui";

const CYCLES = [
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["quarterly", "Quarterly"],
  ["semestral", "Every 6 months"],
  ["annual", "Yearly"],
] as const;

/**
 * DILG side: decide which reports the barangays must file.
 * Creates a report type (name + how often) and opens it for every barangay automatically.
 */
export default function ReportSetup({ onChanged }: { onChanged?: () => void }) {
  const [busy, setBusy] = useState<boolean>(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await apiSend("/api/report-categories", "POST", {
        name: String(fd.get("name") ?? "").trim(),
        cycle: String(fd.get("cycle")),
        description: String(fd.get("description") ?? "").trim() || null,
      });
      form.reset();
      setFlash({ kind: "ok", text: "The new report was created and is now open for every barangay." });
      onChanged?.();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Could not create the report." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mb-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md shadow-sm overflow-hidden transition-all">
      <summary className="cursor-pointer px-5 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#93C5FD] hover:text-[#0039A6] dark:hover:text-white transition-colors select-none flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-[#0039A6]/10 text-[#0039A6] dark:text-[#93C5FD]">
            +
          </span>
          Create a new report type for barangays
        </span>
      </summary>
      <div className="border-t border-slate-100 dark:border-white/10 p-5 max-w-2xl">
        {flash && (
          <div className="mb-4">
            <Notice kind={flash.kind} onClose={() => setFlash(null)}>{flash.text}</Notice>
          </div>
        )}

        <form onSubmit={create}>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">New Report Category</h3>
          <p className="mb-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
            Define a required periodic report that barangays must submit. Official templates can be uploaded under the Resources tab.
          </p>
          <div className="grid gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Report Name
              </label>
              <input
                name="name"
                required
                maxLength={150}
                placeholder="e.g. Barangay Disaster Risk Report"
                className={`${field} w-full`}
                aria-label="Report name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Filing Cycle
              </label>
              <select
                name="cycle"
                required
                defaultValue="monthly"
                className={`${field} w-full cursor-pointer`}
                aria-label="Filing cycle"
              >
                {CYCLES.map(([v, l]) => (
                  <option key={v} value={v} className="bg-white dark:bg-[#0F172A]">{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Description / Guidelines (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                maxLength={2000}
                placeholder="What should be in this report? (optional)"
                className={`${field} w-full`}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className={btn} disabled={busy}>
                {busy ? "Creating..." : "Create report"}
              </button>
              <button type="reset" className={btnGhost}>Clear</button>
            </div>
          </div>
        </form>
      </div>
    </details>
  );
}
