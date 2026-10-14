"use client";

import { useState, type FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useBarangays } from "@/hooks/useBarangays";
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
 *  - "Open this period" makes the current period appear for all or specific barangays (also happens daily on its own).
 *  - "New report type" creates a report (name + how often) and opens it for every barangay immediately.
 */
export default function ReportSetup({ onChanged }: { onChanged: () => void }) {
  const categories = useFetch<Category[]>("/api/resources");
  const { barangays } = useBarangays();
  const [target, setTarget] = useState("");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState<"open" | "create" | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function open() {
    if (audience === "selected" && picked.length === 0) {
      setFlash({ kind: "error", text: "Please select at least one barangay." });
      return;
    }
    setBusy("open");
    try {
      const payload: { report_category_id?: number; barangay_ids?: number[] } = {};
      if (target) payload.report_category_id = Number(target);
      if (audience === "selected") payload.barangay_ids = picked;

      const res = await apiSend<{ message: string }>("/api/submissions/open-periods", "POST", payload);
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
            Gives barangays a slot to file this period&apos;s report. It also runs by itself every day, so you only need this to open it right now.
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Report Type
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={`${field} w-full cursor-pointer`}
                aria-label="Report"
              >
                <option value="">All report types</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Barangays
              </label>
              <div className="flex gap-4 text-sm text-slate-800 dark:text-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="report_audience"
                    checked={audience === "all"}
                    onChange={() => setAudience("all")}
                    className="text-[#7B4DFF] focus:ring-[#7B4DFF] cursor-pointer"
                  />
                  All barangays
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="report_audience"
                    checked={audience === "selected"}
                    onChange={() => setAudience("selected")}
                    className="text-[#7B4DFF] focus:ring-[#7B4DFF] cursor-pointer"
                  />
                  Specific Barangay/s
                </label>
              </div>

              {audience === "selected" && (
                <div className="mt-3 rounded-xl border border-line dark:border-white/10 bg-slate-50/50 dark:bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Select barangays ({picked.length} selected):</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPicked(barangays.map((b) => b.id))}
                        className="text-[#7B4DFF] hover:underline cursor-pointer font-medium"
                      >
                        Select all
                      </button>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => setPicked([])}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Deselect all
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3 text-xs text-slate-800 dark:text-slate-200">
                    {barangays.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 cursor-pointer hover:text-[#7B4DFF]">
                        <input
                          type="checkbox"
                          checked={picked.includes(b.id)}
                          onChange={(e) =>
                            setPicked(
                              e.target.checked
                                ? [...picked, b.id]
                                : picked.filter((x) => x !== b.id)
                            )
                          }
                          className="rounded border-slate-300 text-[#7B4DFF] focus:ring-[#7B4DFF] cursor-pointer"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                className={btn}
                disabled={busy !== null || (audience === "selected" && picked.length === 0)}
                onClick={open}
              >
                {busy === "open"
                  ? "Opening..."
                  : audience === "all"
                  ? "Open for all barangays"
                  : `Open for ${picked.length} selected barangay${picked.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={create}>
          <h3 className="font-semibold text-navy-900 dark:text-white">Create a new report type</h3>
          <p className="mb-3 mt-1 text-sm text-muted dark:text-slate-400">
            Add a report the barangays must file. Upload its form under Resources so they can download it.
          </p>
          <div className="grid gap-3">
            <input name="name" required maxLength={150} placeholder="e.g. Barangay Disaster Risk Report" className={`${field} w-full`} aria-label="Report name" />
            <select name="cycle" required defaultValue="monthly" className={`${field} w-full cursor-pointer`} aria-label="How often">
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
