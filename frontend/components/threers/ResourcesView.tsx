"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { useConfirm } from "@/components/ConfirmModal";
import ThreeRsTabs from "./ThreeRsTabs";
import FormTemplateManager from "./FormTemplateManager";
import { Notice, PageTitle, TYPE_LABEL, RESOURCE_GROUP_LABEL, btn, btnGhost, field } from "./ui";
import type { Category, ResourceItem } from "./types";

const RESOURCE_GROUPS = [
  "standard_formats",
  "sectoral_toolkits",
  "citizen_charts",
  "drive_links",
  "bneo",
  "bois",
  "report_templates",
  "governance_templates",
] as const;
const TYPES = ["template", "guideline", "sop", "toolkit", "citizen_chart", "drive_link", "security_advisory", "other"] as const;

export default function ResourcesView() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [resourceTab, setResourceTab] = useState<"files" | "templates">("files");
  const [type, setType] = useState("");
  const [history, setHistory] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const isOffice = user ? user.role !== "barangay_rep" : false;
  const isSupervisor = user?.role === "office_supervisor";

  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (history && isOffice) qs.set("history", "1");

  const { data, loading, error, reload } = useFetch<{ data: ResourceItem[] }>(
    user ? `/api/resources/library?${qs}` : null,
  );
  const categories = useFetch<Category[]>(user ? "/api/resources" : null);

  const items = data?.data ?? [];

  // Group items by resource_group from the PDF architecture
  const groupedBySection = useMemo(() => {
    return RESOURCE_GROUPS.map((g) => ({
      group: g,
      label: RESOURCE_GROUP_LABEL[g] || g,
      items: items.filter((i) => i.resource_group === g),
    })).filter((g) => g.items.length > 0);
  }, [items]);

  // Fallback: items that don't match any group (legacy data)
  const ungrouped = useMemo(() => {
    const knownGroups = new Set(RESOURCE_GROUPS as readonly string[]);
    return items.filter((i) => !knownGroups.has(i.resource_group ?? ""));
  }, [items]);

  async function archive(r: ResourceItem) {
    const ok = await confirm(`Withdraw "${r.title}" v${r.version}? Barangays will no longer see it.`);
    if (!ok) return;
    try {
      await apiSend(`/api/resources/${r.id}/archive`, "PATCH");
      setFlash({ kind: "ok", text: `"${r.title}" v${r.version} was withdrawn.` });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "Could not withdraw this resource." });
    }
  }

  if (!user) return null;

  return (
    <>
      <PageTitle
        title="Resources"
        subtitle={
          user?.role === "super_admin"
            ? "Kagamitan, Gabay, at Sanggunian — resource lifecycle oversight for DILG Makati."
            : "Standard Formats & Templates, Sectoral Toolkits, Makati Citizen Charts, and shared Google Drive links."
        }
      />
      <ThreeRsTabs />

      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {/* DILG Supervisor Sub-Tab: Uploaded Files vs Official Form Templates (Word / Docs Format) */}
      {isSupervisor && (
        <div className="mb-6 inline-flex rounded-xl bg-slate-100 dark:bg-black/30 p-1 border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setResourceTab("files")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              resourceTab === "files"
                ? "bg-white dark:bg-[#0F172A] text-[#0039A6] dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Uploaded Resource Files &amp; SOPs</span>
          </button>

          <button
            type="button"
            onClick={() => setResourceTab("templates")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              resourceTab === "templates"
                ? "bg-white dark:bg-[#0F172A] text-[#0039A6] dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Official Form Formats (Word / Docs)</span>
          </button>
        </div>
      )}

      {isSupervisor && resourceTab === "templates" ? (
        <FormTemplateManager setFlash={setFlash} />
      ) : (
        <>
          {/* Upload Form (office_supervisor) */}
          {user?.role === "office_supervisor" && (
            <UploadForm
              categories={categories.data ?? []}
              onDone={(text) => {
                setFlash({ kind: "ok", text });
                reload();
              }}
              onError={(text) => setFlash({ kind: "error", text })}
            />
          )}

          {/* ── Filters ── */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <label className="text-sm w-full sm:w-auto">
              <span className="mb-1 block text-muted dark:text-slate-400">Type</span>
              <select className={`${field} w-full sm:w-auto`} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="" className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">All types</option>
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </label>
            {isOffice && (
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} className="rounded border-line dark:border-white/20 text-[#0039A6] focus:ring-[#0039A6] bg-white dark:bg-black/30" />
                Show older and withdrawn versions
              </label>
            )}
          </div>

          {/* ── Content ── */}
          {loading && items.length === 0 ? (
            <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading resources...</p>
          ) : error ? (
            <p className="py-10 text-center font-medium text-rose-500 dark:text-rose-400">
              {error}{" "}
              <button onClick={reload} className="underline underline-offset-4">Try again</button>
            </p>
          ) : groupedBySection.length === 0 && ungrouped.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] py-12 text-center text-slate-500 dark:text-slate-400">
              {isOffice ? "Nothing has been uploaded yet. Use the form above to add the first resource." : "No resources have been published yet."}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBySection.map((section) => (
                <ResourceSection
                  key={section.group}
                  title={section.label}
                  items={section.items}
                  isOffice={isOffice}
                  onArchive={archive}
                />
              ))}
              {ungrouped.length > 0 && (
                <ResourceSection
                  title="Other Resources"
                  items={ungrouped}
                  isOffice={isOffice}
                  onArchive={archive}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ─── Resource Section (grouped card) ─── */
function ResourceSection({
  title,
  items,
  isOffice,
  onArchive,
}: {
  title: string;
  items: ResourceItem[];
  isOffice: boolean;
  onArchive: (r: ResourceItem) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#0039A6]" />
          {title}
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
          {items.length} {items.length === 1 ? "document" : "documents"}
        </span>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-white/10">
        {items.map((r) => {
          const state = r.archived_at ? "Withdrawn" : r.is_current ? "Current Active" : "Superseded Version";
          return (
            <li key={r.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {r.title}
                  </p>
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">v{r.version}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-[#0039A6]/10 text-[#0039A6] dark:bg-[#0039A6]/20 dark:text-[#93C5FD]">
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      r.is_current && !r.archived_at
                        ? "bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD]"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                    }`}
                  >
                    {state}
                  </span>
                </div>
                {r.category && (
                  <p className="mt-1 text-xs font-medium text-[#0039A6] dark:text-[#93C5FD]">
                    Mandatory for: {r.category.name} ({r.category.cycle})
                  </p>
                )}
                {r.description && <p className="mt-1 max-w-prose text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{r.description}</p>}
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {r.effective_date ? `Effective ${formatDate(r.effective_date)} · ` : ""}
                  Published {formatDate(r.created_at)}
                  {r.uploader ? ` by ${r.uploader.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0 pt-1">
                {r.type === "drive_link" ? (
                  <a className={`${btn} flex-1 sm:flex-initial text-center`} href={r.description ?? "#"} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Open in Drive
                  </a>
                ) : (
                  <a className={`${btn} flex-1 sm:flex-initial text-center`} href={apiUrl(`/api/resources/${r.id}/download`)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </a>
                )}
                {isOffice && !r.archived_at && (
                  <button className={`${btnGhost} flex-1 sm:flex-initial text-center`} onClick={() => onArchive(r)}>Withdraw</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Upload Form (office_supervisor only) ─── */
function UploadForm({
  categories,
  onDone,
  onError,
}: {
  categories: Category[];
  onDone: (text: string) => void;
  onError: (text: string) => void;
}) {
  const [type, setType] = useState<(typeof TYPES)[number]>("template");
  const [resourceGroup, setResourceGroup] = useState<string>("standard_formats");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    if (type !== "template") body.delete("report_category_id");
    if (!body.get("effective_date")) body.delete("effective_date");
    body.set("resource_group", resourceGroup);

    setBusy(true);
    try {
      await apiSend("/api/resources", "POST", body);
      form.reset();
      setType("template");
      setResourceGroup("standard_formats");
      onDone(`"${String(body.get("title"))}" v${String(body.get("version"))} is now the current version.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details open className="mb-6 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy-800 dark:text-[#93C5FD]">
        Publish a form, guideline, toolkit, or citizen chart for the barangays
      </summary>
      <form onSubmit={submit} className="grid gap-4 border-t border-line dark:border-white/10 p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Title</span>
          <input name="title" required maxLength={255} className={`${field} w-full`} placeholder="e.g. BaRCO Monthly Form" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Resource Group</span>
          <select className={`${field} w-full`} value={resourceGroup} onChange={(e) => setResourceGroup(e.target.value)}>
            {RESOURCE_GROUPS.map((g) => (
              <option key={g} value={g} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">
                {RESOURCE_GROUP_LABEL[g]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Type</span>
          <select name="type" className={`${field} w-full`} value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </label>

        {type === "template" && (
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Report it is used for</span>
            <select name="report_category_id" required className={`${field} w-full`} defaultValue="">
              <option value="" disabled className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">Choose a report...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100">{c.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Version</span>
          <input name="version" required maxLength={20} className={`${field} w-full`} placeholder="e.g. 2.0" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Effective date (optional)</span>
          <input name="effective_date" type="date" className={`${field} w-full`} />
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">
            {type === "drive_link" ? "Google Drive URL" : "Short description (optional)"}
          </span>
          <textarea name="description" rows={2} maxLength={2000} className={`${field} w-full`}
            placeholder={type === "drive_link" ? "https://drive.google.com/drive/folders/..." : ""}
          />
        </label>

        {type !== "drive_link" && (
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">File (PDF, Word, Excel or PowerPoint, up to 10 MB)</span>
            <input name="file" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0039A6]/10 file:text-[#0039A6] dark:file:bg-[#0039A6]/20 dark:file:text-[#93C5FD]" />
          </label>
        )}

        <div className="sm:col-span-2">
          <button className={`${btn} w-full sm:w-auto`} disabled={busy} type="submit">{busy ? "Uploading..." : "Publish"}</button>
          <p className="mt-2 text-xs text-muted dark:text-slate-400">
            Publishing a new version of the same title replaces the current one for barangays. Older versions stay on record.
          </p>
        </div>
      </form>
    </details>
  );
}
