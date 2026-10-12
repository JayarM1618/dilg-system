"use client";

import { useState, type FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { apiSend } from "@/lib/http";
import { btn, btnGhost, field, Notice } from "./ui";
import type { Category } from "./types";

const CYCLES = [
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["quarterly", "Quarterly"],
  ["semestral", "Every 6 months"],
  ["annual", "Yearly"],
] as const;

/**
 * DILG side: decide which reports the barangays must file.
 *  - "Open this period" makes the current period appear for every barangay (also happens daily on its own).
 *  - "New report type" creates a report (name + how often) and opens it for every barangay immediately.
 */
export default function ReportSetup({ onChanged }: { onChanged: () => void }) {
  const categories = useFetch<Category[]>("/api/resources");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState<"open" | "create" | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function open() {
    setBusy("open");
    try {
      const res = await apiSend<{ message: string }>("/api/submissions/open-periods", "POST", target ? { report_category_id: Number(target) } : {});
      setFlash({ kind: "ok", text: res.message });
      onChanged();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "Could not open the period." });
    } finally {
      setBusy(null);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy("create");
    try {
      await apiSend("/api/report-categories", "POST", {
        name: String(fd.get("name") ?? "").trim(),
        cycle: String(fd.get("cycle")),
        description: String(fd.get("description") ?? "").trim() || null,
      });
      form.reset();
      setFlash({ kind: "ok", text: "The new report was created and is now open for every barangay." });
      categories.reload();
      onChanged();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Could not create the report." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className="mb-8 rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy-800 dark:text-[#D1C4F9]">
        Set up reports for the barangays
      </summary>
      <div className="grid gap-6 border-t border-line p-4 dark:border-white/10 lg:grid-cols-2">
        {flash && (
          <div className="lg:col-span-2">
            <Notice kind={flash.kind} onClose={() => setFlash(null)}>{flash.text}</Notice>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-navy-900 dark:text-white">Open the current period</h3>
          <p className="mb-3 mt-1 text-sm text-muted dark:text-slate-400">
            Gives every barangay a slot to file this period&apos;s report. It also runs by itself every day, so you only need this to do it right now.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${field} w-full sm:w-auto`} aria-label="Report">
              <option value="">All reports</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" className={btn} disabled={busy !== null} onClick={open}>
              {busy === "open" ? "Opening..." : "Open for all barangays"}
            </button>
          </div>
        </div>

        <form onSubmit={create}>
          <h3 className="font-semibold text-navy-900 dark:text-white">Create a new report type</h3>
          <p className="mb-3 mt-1 text-sm text-muted dark:text-slate-400">
            Add a report the barangays must file. Upload its form under Resources so they can download it.
          </p>
          <div className="grid gap-3">
            <input name="name" required maxLength={150} placeholder="e.g. Barangay Disaster Risk Report" className={`${field} w-full`} aria-label="Report name" />
            <select name="cycle" required defaultValue="monthly" className={`${field} w-full`} aria-label="How often">
              {CYCLES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <textarea name="description" rows={2} maxLength={2000} placeholder="What should be in this report? (optional)" className={`${field} w-full`} />
            <div>
              <button type="submit" className={btn} disabled={busy !== null}>{busy === "create" ? "Creating..." : "Create report"}</button>{" "}
              <button type="reset" className={btnGhost}>Clear</button>
            </div>
          </div>
        </form>
      </div>
    </details>
  );
}
