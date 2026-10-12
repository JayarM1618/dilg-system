"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import ThreeRsTabs from "./ThreeRsTabs";
import { Notice, PageTitle, TYPE_LABEL, btn, btnGhost, field } from "./ui";
import type { Category, ResourceItem } from "./types";

const TYPES = ["template", "guideline", "sop", "security_advisory", "other"] as const;

export default function ResourcesView() {
  const { user } = useAuth();
  const [type, setType] = useState("");
  const [history, setHistory] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const isOffice = user ? user.role !== "barangay_rep" : false;

  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (history && isOffice) qs.set("history", "1");

  const { data, loading, error, reload } = useFetch<{ data: ResourceItem[] }>(
    user ? `/api/resources/library?${qs}` : null,
  );
  const categories = useFetch<Category[]>(user ? "/api/resources" : null);

  if (!user) return null;

  const items = data?.data ?? [];
  const groups = TYPES.map((t) => ({ type: t, items: items.filter((i) => i.type === t) })).filter((g) => g.items.length > 0);

  async function archive(r: ResourceItem) {
    if (!window.confirm(`Withdraw "${r.title}" v${r.version}? Barangays will no longer see it.`)) return;
    try {
      await apiSend(`/api/resources/${r.id}/archive`, "PATCH");
      setFlash({ kind: "ok", text: `"${r.title}" v${r.version} was withdrawn.` });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "Could not withdraw this resource." });
    }
  }

  return (
    <>
      <PageTitle
        title="Resources"
        subtitle="The official templates, guidelines and procedures. This is the only place to get the current version."
      />
      <ThreeRsTabs />

      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {isOffice && (
        <UploadForm
          categories={categories.data ?? []}
          onDone={(text) => {
            setFlash({ kind: "ok", text });
            reload();
          }}
          onError={(text) => setFlash({ kind: "error", text })}
        />
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <label className="text-sm w-full sm:w-auto">
          <span className="mb-1 block text-muted dark:text-slate-400">Type</span>
          <select className={`${field} w-full sm:w-auto`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </label>
        {isOffice && (
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
            <input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} className="rounded border-line dark:border-white/20 text-[#7B4DFF] focus:ring-[#7B4DFF] bg-white dark:bg-black/30" />
            Show older and withdrawn versions
          </label>
        )}
      </div>

      {loading && items.length === 0 ? (
        <p className="py-10 text-center text-muted dark:text-slate-400">Loading resources...</p>
      ) : error ? (
        <p className="py-10 text-center font-medium text-bad dark:text-rose-400">
          {error}{" "}
          <button onClick={reload} className="underline underline-offset-4">Try again</button>
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5 py-10 text-center text-muted dark:text-slate-400">
          {isOffice ? "Nothing has been uploaded yet. Use the form above to add the first template." : "No resources have been published yet."}
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.type} aria-labelledby={`h-${g.type}`}>
              <h2 id={`h-${g.type}`} className="mb-3 text-lg font-semibold text-navy-900 dark:text-white">{TYPE_LABEL[g.type]}</h2>
              <ul className="divide-y divide-line dark:divide-white/10 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
                {g.items.map((r) => {
                  const state = r.archived_at ? "Withdrawn" : r.is_current ? "Current" : "Older version";
                  return (
                    <li key={r.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-4 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-ink dark:text-white">
                          {r.title} <span className="font-normal text-muted dark:text-slate-400">v{r.version}</span>
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              state === "Current" ? "bg-navy-50 dark:bg-emerald-950/40 text-ok dark:text-emerald-400" : "bg-bad-bg dark:bg-rose-950/40 text-bad dark:text-rose-400"
                            }`}
                          >
                            {state}
                          </span>
                        </p>
                        {r.category && <p className="mt-0.5 text-sm text-muted dark:text-slate-400">For: {r.category.name} ({r.category.cycle})</p>}
                        {r.description && <p className="mt-1 max-w-prose text-sm text-ink dark:text-slate-200">{r.description}</p>}
                        <p className="mt-1 text-xs text-muted dark:text-slate-400">
                          {r.effective_date ? `Effective ${formatDate(r.effective_date)} · ` : ""}
                          Uploaded {formatDate(r.created_at)}
                          {r.uploader ? ` by ${r.uploader.name}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <a className={`${btn} flex-1 sm:flex-initial text-center`} href={apiUrl(`/api/resources/${r.id}/download`)}>Download</a>
                        {isOffice && !r.archived_at && (
                          <button className={`${btnGhost} flex-1 sm:flex-initial text-center`} onClick={() => archive(r)}>Withdraw</button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

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
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    if (type !== "template") body.delete("report_category_id");
    if (!body.get("effective_date")) body.delete("effective_date");

    setBusy(true);
    try {
      await apiSend("/api/resources", "POST", body);
      form.reset();
      setType("template");
      onDone(`"${String(body.get("title"))}" v${String(body.get("version"))} is now the current version.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details open className="mb-6 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-white/5">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy-800 dark:text-[#D1C4F9]">
        Publish a form, guideline or advisory for the barangays
      </summary>
      <form onSubmit={submit} className="grid gap-4 border-t border-line dark:border-white/10 p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Title</span>
          <input name="title" required maxLength={255} className={`${field} w-full`} placeholder="e.g. Monthly Accomplishment Report form" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Type</span>
          <select name="type" className={`${field} w-full`} value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </label>

        {type === "template" && (
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Report it is used for</span>
            <select name="report_category_id" required className={`${field} w-full`} defaultValue="">
              <option value="" disabled className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">Choose a report...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{c.name}</option>
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
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">Short description (optional)</span>
          <textarea name="description" rows={2} maxLength={2000} className={`${field} w-full`} />
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-800 dark:text-slate-200">File (PDF, Word, Excel or PowerPoint, up to 10 MB)</span>
          <input name="file" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7B4DFF]/10 file:text-[#7B4DFF] dark:file:bg-[#7B4DFF]/20 dark:file:text-[#CDBBFF]" />
        </label>

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
