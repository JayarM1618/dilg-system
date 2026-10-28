"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { useConfirm } from "@/components/ConfirmModal";
import ThreeRsTabs from "./ThreeRsTabs";
import FormFiller from "./FormFiller";
import StatusBadge from "@/components/StatusBadge";
import { Notice, PageTitle, btn, btnGhost, field, formatBytes, formatDateTime } from "./ui";
import {
  ASSIGNMENT_LABEL,
  KIND_LABEL,
  type AssignmentStatus,
  type FormField,
  type FormTemplate,
  type FormSubmissionItem,
  type InboxItem,
  type RequirementAssignmentItem,
  type RequirementItem,
  type TrackerRow,
} from "./types";

const STATUS_STYLE: Record<AssignmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  received: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  submitted: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  revision: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  complied: "bg-[#E6FBF3] text-[#0B6B52] dark:bg-[#0E352B] dark:text-[#84DEBD]",
};

const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] shadow-sm";
const label = "mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200";
const fileInput =
  "block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7B4DFF]/10 file:text-[#7B4DFF] dark:file:bg-[#7B4DFF]/20 dark:file:text-[#CDBBFF]";

function StatusPill({ status }: { status: AssignmentStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>{ASSIGNMENT_LABEL[status]}</span>;
}

function DownloadLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A18C9] dark:text-[#CDBBFF] underline underline-offset-4" href={apiUrl(href)}>
      {children}
    </a>
  );
}

type Flash = { kind: "ok" | "error"; text: string } | null;

export default function RequirementsView() {
  const { user } = useAuth();
  if (!user) return null;
  const isOffice = user.role !== "barangay_rep";

  return (
    <>
      <PageTitle
        title="Requirements"
        subtitle={
          user.role === "super_admin"
            ? "City-wide compliance matrix: audit requirement fulfillment, timelines, and response records across all barangays."
            : isOffice
              ? "Send files, report requests, complaints or memos to the barangays, then track who has complied."
              : "What DILG has sent to your barangay. Open each one, download the files and send your compliance back."
        }
      />
      <ThreeRsTabs />
      {isOffice ? <OfficeSide canDelete={user.role === "super_admin"} /> : <BarangaySide />}
    </>
  );
}

/* ===================================================================== */
/* DILG supervisor / super admin                                         */
/* ===================================================================== */

function OfficeSide({ canDelete }: { canDelete: boolean }) {
  const { user } = useAuth();
  const isSupervisor = user?.role === "office_supervisor";
  const list = useFetch<{ data: RequirementItem[] }>(user ? "/api/requirements" : null);
  const tracker = useFetch<{ data: TrackerRow[] }>(user ? "/api/requirements/tracker" : null);
  const [flash, setFlash] = useState<Flash>(null);
  const [view, setView] = useState<"sent" | "tracker" | "forms">(isSupervisor ? "sent" : "tracker");

  function refresh() {
    list.reload();
    tracker.reload();
  }

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {isSupervisor && (
        <SendForm
          onDone={(text) => {
            setFlash({ kind: "ok", text });
            refresh();
          }}
          onError={(text) => setFlash({ kind: "error", text })}
        />
      )}

      <div className="mb-4 inline-flex rounded-xl bg-slate-100 dark:bg-black/30 p-1 border border-slate-200 dark:border-white/10">
        {(["sent", "tracker", "forms"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${view === v ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
              }`}
          >
            {v === "sent" ? "Sent requirements" : v === "tracker" ? "Barangay tracker" : "Form Templates"}
          </button>
        ))}
      </div>

      {view === "forms" ? (
        <FormTemplateManager onSendRequirement={refresh} setFlash={setFlash} />
      ) : view === "tracker" ? (
        <Tracker rows={tracker.data?.data ?? []} loading={tracker.loading} />
      ) : list.loading && !list.data ? (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p>
      ) : list.error ? (
        <p className="py-10 text-center font-medium text-rose-500">{list.error}</p>
      ) : (list.data?.data ?? []).length === 0 ? (
        <div className={`${card} py-12 text-center text-slate-500 dark:text-slate-400`}>
          Nothing has been sent yet. Use the form above to send the first requirement.
        </div>
      ) : (
        <ul className="space-y-3">
          {(list.data?.data ?? []).map((r) => (
            <SentRow key={r.id} item={r} canDelete={canDelete} onChanged={refresh} setFlash={setFlash} />
          ))}
        </ul>
      )}
    </>
  );
}

function Tracker({ rows, loading }: { rows: TrackerRow[]; loading: boolean }) {
  if (loading && rows.length === 0) return <p className="py-10 text-center text-slate-500">Loading...</p>;
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr className="border-b border-slate-100 dark:border-white/10">
            <th className="px-4 py-3">Barangay</th>
            <th className="px-3 py-3">Sent to them</th>
            <th className="px-3 py-3">Complied</th>
            <th className="px-3 py-3">To review</th>
            <th className="px-3 py-3">Revision</th>
            <th className="px-3 py-3">Not yet sent back</th>
            <th className="px-3 py-3">Overdue</th>
            <th className="px-4 py-3 w-40">Compliance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-slate-800 dark:text-slate-200">
          {rows.map((r) => (
            <tr key={r.barangay_id}>
              <td className="px-4 py-2.5 font-semibold">{r.barangay}</td>
              <td className="px-3 py-2.5">{r.total}</td>
              <td className="px-3 py-2.5">{r.complied}</td>
              <td className="px-3 py-2.5">{r.submitted}</td>
              <td className="px-3 py-2.5">{r.revision}</td>
              <td className="px-3 py-2.5">{r.waiting}</td>
              <td className={`px-3 py-2.5 ${r.overdue ? "font-bold text-rose-600 dark:text-rose-400" : ""}`}>{r.overdue}</td>
              <td className="px-4 py-2.5">
                {r.percent === null ? (
                  <span className="text-xs text-slate-400">Nothing sent</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#06D6A0]" style={{ width: `${r.percent}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-9 text-right">{r.percent}%</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentRow({
  item,
  canDelete,
  onChanged,
  setFlash,
}: {
  item: RequirementItem;
  canDelete: boolean;
  onChanged: () => void;
  setFlash: (f: Flash) => void;
}) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const p = item.progress!;

  async function act(path: string, method: "POST" | "DELETE", ok: string, confirmText?: string) {
    if (confirmText) {
      const confirmed = await confirm(confirmText);
      if (!confirmed) return;
    }
    try {
      await apiSend(path, method);
      setFlash({ kind: "ok", text: ok });
      onChanged();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "That did not work." });
    }
  }

  return (
    <li className={card}>
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{KIND_LABEL[item.kind]}</span>
            {item.status === "closed" && <span className="rounded-full bg-slate-200 dark:bg-white/15 px-2 py-0.5 text-[10px] font-bold">Closed</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sent {formatDate(item.created_at)} &middot; {item.audience === "all" ? "All barangays" : `${p.total} selected barangays`}
            {item.due_date ? ` · Due ${formatDate(item.due_date)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <span><b className="text-[#0B6B52] dark:text-[#84DEBD]">{p.complied}</b>/{p.total} complied</span>
          {p.submitted > 0 && <span className="font-semibold text-violet-700 dark:text-violet-300">{p.submitted} to review</span>}
          {p.overdue > 0 && <span className="font-semibold text-rose-600 dark:text-rose-400">{p.overdue} overdue</span>}
          <span className="w-12 text-right font-bold">{p.percent}%</span>
        </div>
      </button>
      {open && (
        <Detail id={item.id} canDelete={canDelete} closed={item.status === "closed"} onChanged={onChanged} act={act} setFlash={setFlash} />
      )}
    </li>
  );
}

function Detail({
  id,
  closed,
  canDelete,
  onChanged,
  act,
  setFlash,
}: {
  id: number;
  closed: boolean;
  canDelete: boolean;
  onChanged: () => void;
  act: (path: string, method: "POST" | "DELETE", ok: string, confirmText?: string) => void;
  setFlash: (f: Flash) => void;
}) {
  const { data, loading, reload } = useFetch<RequirementItem>(`/api/requirements/${id}`);
  if (loading && !data) return <p className="px-5 pb-5 text-sm text-slate-500">Loading...</p>;
  if (!data) return null;

  return (
    <div className="border-t border-slate-100 dark:border-white/10 px-5 py-4 space-y-4">
      {data.description && <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{data.description}</p>}
      {(data.formTemplate || data.form_template) && (
        <div className="flex items-center gap-2 rounded-xl border border-[#7B4DFF]/30 bg-[#7B4DFF]/10 px-4 py-2.5 text-xs text-[#5A18C9] dark:text-[#CDBBFF]">
          <span className="font-semibold">Attached Online Form:</span>
          <span>{(data.formTemplate || data.form_template)?.title}</span>
          <span className="text-slate-400">({(data.formTemplate || data.form_template)?.fields?.length ?? 0} fields · v{(data.formTemplate || data.form_template)?.version})</span>
        </div>
      )}
      {(data.files ?? []).length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {data.files!.map((f) => (
            <DownloadLink key={f.id} href={`/api/requirements/${data.id}/files/${f.id}/download`}>
              {f.original_filename} ({formatBytes(f.size_bytes)})
            </DownloadLink>
          ))}
        </div>
      )}
      {!data.requires_response && <p className="text-xs text-slate-500 dark:text-slate-400">For information only: a barangay complies by acknowledging it.</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-100 dark:border-white/10">
              <th className="py-2 pr-3">Barangay</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Sent back</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-slate-800 dark:text-slate-200">
            {(data.assignments ?? []).map((a) => (
              <AssignmentRow
                key={a.id}
                a={a}
                onChanged={() => {
                  reload();
                  onChanged();
                }}
                setFlash={setFlash}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {closed ? (
          <button className={btnGhost} onClick={() => act(`/api/requirements/${id}/reopen`, "POST", "Requirement reopened.")}>Reopen</button>
        ) : (
          <button className={btnGhost} onClick={() => act(`/api/requirements/${id}/close`, "POST", "Requirement closed. Barangays can no longer respond.", "Close this requirement? Barangays will no longer be able to respond.")}>
            Close requirement
          </button>
        )}
        {canDelete && (
          <button className={`${btnGhost} !text-rose-600`} onClick={() => act(`/api/requirements/${id}`, "DELETE", "Requirement deleted.", "Delete this requirement and every file sent back for it? This cannot be undone.")}>
            Delete (super admin)
          </button>
        )}
      </div>
    </div>
  );
}

function AssignmentRow({ a, onChanged, setFlash }: { a: RequirementAssignmentItem; onChanged: () => void; setFlash: (f: Flash) => void }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const responses = a.responses ?? [];
  const latestVersion = responses.reduce((m, r) => Math.max(m, r.version), 0);
  const latest = responses.filter((r) => r.version === latestVersion);

  async function review(decision: "complied" | "revision") {
    if (decision === "revision" && !notes.trim()) {
      setFlash({ kind: "error", text: "Tell the barangay what to fix before asking for a revision." });
      return;
    }
    setBusy(true);
    try {
      await apiSend(`/api/requirement-assignments/${a.id}/review`, "PATCH", { decision, notes: notes.trim() || undefined });
      setFlash({ kind: "ok", text: `${a.barangay?.name}: marked ${decision === "complied" ? "complied" : "for revision"}.` });
      setNotes("");
      onChanged();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "Could not save the review." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="align-top">
      <td className="py-2.5 pr-3 font-semibold">{a.barangay?.name}</td>
      <td className="py-2.5 pr-3 space-y-1">
        <StatusPill status={a.status} />
        {a.is_overdue && <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Overdue</div>}
        {a.review_notes && <div className="max-w-[16rem] text-[11px] text-slate-500 dark:text-slate-400">Note: {a.review_notes}</div>}
      </td>
      <td className="py-2.5 pr-3 text-xs">
        {latest.length === 0 ? (
          <span className="text-slate-400">-</span>
        ) : (
          <div className="space-y-1">
            {latest.map((r) => (
              <div key={r.id}>
                {r.original_filename ? (
                  <DownloadLink href={`/api/requirement-responses/${r.id}/download`}>{r.original_filename}</DownloadLink>
                ) : (
                  <span className="text-slate-500">Acknowledged</span>
                )}
                {r.note && <div className="text-slate-500 dark:text-slate-400">&ldquo;{r.note}&rdquo;</div>}
              </div>
            ))}
            <div className="text-slate-400">v{latestVersion} &middot; {formatDateTime(a.submitted_at)}</div>
          </div>
        )}
      </td>
      <td className="py-2.5">
        {a.status === "submitted" ? (
          <div className="space-y-2 min-w-[14rem]">
            <textarea className={`${field} w-full`} rows={2} placeholder="Note (required if asking for a revision)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <button className={btn} disabled={busy} onClick={() => review("complied")}>Accept</button>
              <button className={btnGhost} disabled={busy} onClick={() => review("revision")}>Ask to revise</button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </td>
    </tr>
  );
}

function SendForm({ onDone, onError }: { onDone: (t: string) => void; onError: (t: string) => void }) {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const barangays = useFetch<{ id: number; name: string; is_active?: boolean }[]>("/api/barangays");
  const templates = useFetch<{ data: FormTemplate[] }>("/api/form-templates");
  const list = (barangays.data ?? []).filter((b) => b.is_active !== false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    body.delete("files");
    Array.from((form.elements.namedItem("files") as HTMLInputElement).files ?? []).forEach((f) => body.append("files[]", f));
    body.set("requires_response", body.get("requires_response") ? "1" : "0");
    if (!body.get("due_date")) body.delete("due_date");
    if (!body.get("form_template_id")) body.delete("form_template_id");
    if (audience === "selected") picked.forEach((id) => body.append("barangay_ids[]", String(id)));

    setBusy(true);
    try {
      await apiSend("/api/requirements", "POST", body);
      onDone(`"${String(body.get("title"))}" was sent to ${audience === "all" ? "all barangays" : `${picked.length} barangay(s)`}.`);
      form.reset();
      setAudience("all");
      setPicked([]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={`${card} mb-6`}>
      <summary className="cursor-pointer px-5 py-3.5 text-sm font-semibold text-[#5A18C9] dark:text-[#D1C4F9]">Send something to the barangays</summary>
      <form onSubmit={submit} className="grid gap-4 border-t border-slate-100 dark:border-white/10 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={label}>Title</span>
          <input name="title" required maxLength={255} className={`${field} w-full`} placeholder="e.g. Submit your barangay SK roster" />
        </label>
        <label>
          <span className={label}>What is it?</span>
          <select name="kind" className={`${field} w-full`} defaultValue="file">
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k} className="bg-white dark:bg-[#2B2542]">{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={label}>Deadline (optional)</span>
          <input name="due_date" type="date" className={`${field} w-full`} />
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Attach Form Template (optional)</span>
          <select name="form_template_id" className={`${field} w-full`} defaultValue="">
            <option value="" className="bg-white dark:bg-[#2B2542]">-- None (Standard document / report) --</option>
            {(templates.data?.data ?? []).filter((t) => t.is_active).map((t) => (
              <option key={t.id} value={t.id} className="bg-white dark:bg-[#2B2542]">
                {t.title} ({t.fields.length} fields · v{t.version})
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Details / instructions</span>
          <textarea name="description" rows={3} maxLength={5000} className={`${field} w-full`} />
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Attach files (PDF, Office, image or ZIP, up to 10 MB each)</span>
          <input name="files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" className={fileInput} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 sm:col-span-2">
          <input type="checkbox" name="requires_response" defaultChecked className="rounded border-slate-300 text-[#7B4DFF]" />
          Barangays must send a file back (untick for information only; they just acknowledge)
        </label>

        <fieldset className="sm:col-span-2">
          <legend className={label}>Send to</legend>
          <input type="hidden" name="audience" value={audience} />
          <div className="flex gap-4 text-sm text-slate-800 dark:text-slate-200">
            <label className="flex items-center gap-2"><input type="radio" checked={audience === "all"} onChange={() => setAudience("all")} /> All barangays</label>
            <label className="flex items-center gap-2"><input type="radio" checked={audience === "selected"} onChange={() => setAudience("selected")} /> Selected barangays</label>
          </div>
          {audience === "selected" && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4 text-sm text-slate-800 dark:text-slate-200">
              {list.map((b) => (
                <label key={b.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={picked.includes(b.id)}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, b.id] : picked.filter((x) => x !== b.id))}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="sm:col-span-2">
          <button className={`${btn} w-full sm:w-auto`} disabled={busy || (audience === "selected" && picked.length === 0)}>
            {busy ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </details>
  );
}

/* ===================================================================== */
/* Barangay representative                                               */
/* ===================================================================== */

function BarangaySide() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "forms">("inbox");
  const inbox = useFetch<{ data: InboxItem[] }>(user ? "/api/requirements" : null);
  const [flash, setFlash] = useState<Flash>(null);
  const items = inbox.data?.data ?? [];
  const todo = items.filter((i) => ["pending", "received", "revision"].includes(i.status) && i.requirement.status === "open");
  const rest = items.filter((i) => !todo.includes(i));

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {/* Directives Inbox vs Editable Forms */}
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 dark:bg-black/30 p-1 border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setTab("inbox")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "inbox" ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Directives Inbox
        </button>
        <button
          onClick={() => setTab("forms")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "forms" ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Editable Forms &amp; E-Sign
        </button>
      </div>

      {tab === "forms" ? (
        <FormsList />
      ) : inbox.loading && !inbox.data ? (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p>
      ) : inbox.error ? (
        <p className="py-10 text-center font-medium text-rose-500">{inbox.error}</p>
      ) : items.length === 0 ? (
        <div className={`${card} py-12 text-center text-slate-500 dark:text-slate-400`}>DILG has not sent anything to your barangay yet.</div>
      ) : (
        <div className="space-y-6">
          <Group title={`To do (${todo.length})`} rows={todo} onChanged={inbox.reload} setFlash={setFlash} defaultOpen />
          <Group title={`Done or with DILG (${rest.length})`} rows={rest} onChanged={inbox.reload} setFlash={setFlash} />
        </div>
      )}
    </>
  );
}

function Group({ title, rows, onChanged, setFlash, defaultOpen }: { title: string; rows: InboxItem[]; onChanged: () => void; setFlash: (f: Flash) => void; defaultOpen?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C6FA3]">{title}</h2>
      <ul className="space-y-3">
        {rows.map((r) => (
          <InboxRow key={r.id} item={r} onChanged={onChanged} setFlash={setFlash} defaultOpen={defaultOpen && r.status === "pending"} />
        ))}
      </ul>
    </section>
  );
}

function InboxRow({ item, onChanged, setFlash, defaultOpen }: { item: InboxItem; onChanged: () => void; setFlash: (f: Flash) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const r = item.requirement;
  return (
    <li className={card}>
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{r.title}</span>
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{KIND_LABEL[r.kind]}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            From {r.creator?.name ?? "DILG"} &middot; {formatDate(r.created_at)}
            {r.due_date ? ` · Due ${formatDate(r.due_date)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {item.is_overdue && <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Overdue</span>}
          {r.status === "closed" && <span className="rounded-full bg-slate-200 dark:bg-white/15 px-2 py-0.5 text-[10px] font-bold">Closed</span>}
          <StatusPill status={item.status} />
        </div>
      </button>
      {open && <InboxDetail id={r.id} onChanged={onChanged} setFlash={setFlash} />}
    </li>
  );
}

function InboxDetail({ id, onChanged, setFlash }: { id: number; onChanged: () => void; setFlash: (f: Flash) => void }) {
  const { data, loading, reload } = useFetch<RequirementItem>(`/api/requirements/${id}`);
  const [busy, setBusy] = useState(false);
  const [fillingTemplate, setFillingTemplate] = useState<FormTemplate | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const attachedTemplate = data?.formTemplate || data?.form_template;
  const submissions = useFetch<{ data: FormSubmissionItem[] }>(
    attachedTemplate ? `/api/form-submissions?requirement_id=${id}` : null
  );
  const currentSubmission = (submissions.data?.data ?? [])[0] as FormSubmissionItem | undefined;

  if (loading && !data) return <p className="px-5 pb-5 text-sm text-slate-500">Loading...</p>;
  if (!data || !data.assignment) return null;
  const a = data.assignment;
  const canRespond = data.status === "open" && (a.status === "pending" || a.status === "received" || a.status === "revision");
  const responses = a.responses ?? [];

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData();
    const note = (form.elements.namedItem("note") as HTMLTextAreaElement).value;
    if (note.trim()) body.set("note", note.trim());
    Array.from((form.elements.namedItem("files") as HTMLInputElement | null)?.files ?? []).forEach((f) => body.append("files[]", f));
    setBusy(true);
    try {
      await apiSend(`/api/requirements/${id}/respond`, "POST", body);
      setFlash({ kind: "ok", text: data!.requires_response ? "Sent to DILG for review." : "Marked as complied." });
      reload();
      onChanged();
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Could not send." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-slate-100 dark:border-white/10 px-5 py-4 space-y-4">
      {data.description && <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{data.description}</p>}

      {attachedTemplate && (
        <div className="rounded-2xl border border-[#7B4DFF]/30 bg-gradient-to-br from-[#7B4DFF]/10 via-purple-500/5 to-transparent p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Form: {attachedTemplate.title}
                </h4>
                <span className="rounded-full bg-[#7B4DFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
                  {attachedTemplate.fields.length} fields · v{attachedTemplate.version}
                </span>
              </div>
              {attachedTemplate.description && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {attachedTemplate.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentSubmission && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Form Status:</span>
                  <StatusBadge status={currentSubmission.status} />
                </div>
              )}
              {canRespond && (
                <button
                  type="button"
                  onClick={() => setFillingTemplate(fillingTemplate ? null : attachedTemplate)}
                  className={`${btn} text-xs`}
                >
                  {fillingTemplate
                    ? "Hide Form"
                    : currentSubmission?.status === "revision"
                      ? "Revise Form & E-Sign →"
                      : currentSubmission?.status === "draft"
                        ? "Continue Form Draft →"
                        : currentSubmission?.status === "submitted"
                          ? "View / Edit Form →"
                          : "Fill & E-Sign Form →"}
                </button>
              )}
            </div>
          </div>

          {fillingTemplate && (
            <div className="pt-3 border-t border-[#7B4DFF]/20">
              <FormFiller
                template={attachedTemplate}
                initialData={currentSubmission?.data ?? {}}
                initialSignature={
                  currentSubmission?.has_signature
                    ? { name: currentSubmission.signature_name, position: currentSubmission.signature_position }
                    : undefined
                }
                saving={formSaving}
                onSave={async (payload) => {
                  setFormSaving(true);
                  try {
                    if (currentSubmission) {
                      await apiSend(`/api/form-submissions/${currentSubmission.id}`, "PATCH", {
                        ...payload,
                        requirement_id: id,
                        form_template_id: attachedTemplate.id,
                      });
                    } else {
                      await apiSend("/api/form-submissions", "POST", {
                        ...payload,
                        requirement_id: id,
                        form_template_id: attachedTemplate.id,
                      });
                    }
                    setFlash({
                      kind: "ok",
                      text: payload.status === "submitted" ? "Form submitted to DILG!" : "Draft saved.",
                    });
                    setFillingTemplate(null);
                    submissions.reload();
                    reload();
                    onChanged();
                  } catch (err) {
                    setFlash({
                      kind: "error",
                      text: err instanceof Error ? err.message : "Failed to save form.",
                    });
                  } finally {
                    setFormSaving(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {(data.files ?? []).length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Files from DILG</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {data.files!.map((f) => (
              <DownloadLink key={f.id} href={`/api/requirements/${data.id}/files/${f.id}/download`}>
                {f.original_filename} ({formatBytes(f.size_bytes)})
              </DownloadLink>
            ))}
          </div>
        </div>
      ) : (
        a.status === "pending" && (
          <button
            className={btnGhost}
            onClick={async () => {
              await apiSend(`/api/requirements/${id}/received`, "POST");
              reload();
              onChanged();
            }}
          >
            Mark as received
          </button>
        )
      )}

      {a.status === "revision" && a.review_notes && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-300">
          <b>DILG asks you to revise:</b> {a.review_notes}
        </div>
      )}
      {a.status === "complied" && (
        <div className="rounded-xl bg-[#E6FBF3] dark:bg-[#0E352B] px-4 py-3 text-sm text-[#0B6B52] dark:text-[#84DEBD]">
          Complied{a.reviewed_at ? ` on ${formatDateTime(a.reviewed_at)}` : ""}. Thank you.
        </div>
      )}
      {a.status === "submitted" && <p className="text-sm text-violet-700 dark:text-violet-300">Your response is with DILG for review.</p>}

      {responses.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What you sent</p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            {responses.map((r) => (
              <li key={r.id}>
                v{r.version} &middot; {formatDateTime(r.created_at)} &middot;{" "}
                {r.original_filename ? <DownloadLink href={`/api/requirement-responses/${r.id}/download`}>{r.original_filename}</DownloadLink> : "Acknowledged"}
                {r.note ? ` — “${r.note}”` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canRespond && (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.requires_response ? "Send your compliance to DILG" : "Acknowledge this"}</p>
          {data.requires_response && (
            <label>
              <span className={label}>Files (PDF, Office, image or ZIP, up to 10 MB each)</span>
              <input name="files" type="file" multiple required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" className={fileInput} />
            </label>
          )}
          <label>
            <span className={label}>Note to DILG (optional)</span>
            <textarea name="note" rows={2} maxLength={2000} className={`${field} w-full`} />
          </label>
          <div>
            <button className={btn} disabled={busy}>{busy ? "Sending..." : data.requires_response ? "Send to DILG" : "Acknowledge"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ===================================================================== */
/* Forms: Barangay list & filler                                         */
/* ===================================================================== */

function FormsList() {
  const { user } = useAuth();
  const { data: templates } = useFetch<{ data: FormTemplate[] }>(
    user ? "/api/form-templates" : null
  );
  const { data: submissions, reload } = useFetch<{ data: FormSubmissionItem[] }>(
    user ? "/api/form-submissions" : null
  );
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<FormSubmissionItem | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (payload: {
    data: Record<string, unknown>;
    status: "draft" | "submitted";
    signature_data?: string;
    signature_name?: string;
    signature_position?: string;
  }) => {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      if (activeSubmission) {
        await apiSend(`/api/form-submissions/${activeSubmission.id}`, "PATCH", {
          ...payload,
          form_template_id: activeTemplate.id,
        });
      } else {
        await apiSend("/api/form-submissions", "POST", {
          ...payload,
          form_template_id: activeTemplate.id,
        });
      }
      reload();
      setActiveTemplate(null);
      setActiveSubmission(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  if (activeTemplate) {
    return (
      <div>
        <button
          onClick={() => { setActiveTemplate(null); setActiveSubmission(null); }}
          className={`${btnGhost} mb-4 text-sm`}
        >
          &larr; Back to forms list
        </button>
        <FormFiller
          template={activeTemplate}
          initialData={activeSubmission?.data ?? {}}
          initialSignature={
            activeSubmission?.has_signature
              ? { name: activeSubmission.signature_name, position: activeSubmission.signature_position }
              : undefined
          }
          onSave={handleSave}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available form templates */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Available Forms
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(templates?.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 col-span-2">
              No editable forms available yet.
            </p>
          ) : (
            (templates?.data ?? []).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                className="text-left rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 hover:border-[#7B4DFF]/40 transition-colors"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                {t.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-[#7B4DFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
                    {t.fields.length} fields
                  </span>
                  <span className="text-[10px] text-slate-400">v{t.version}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* My submissions */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          My Form Submissions
        </h3>
        {(submissions?.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven't filled out any forms yet. Select a form above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {(submissions?.data ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {s.template?.title ?? "Form"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Status:</span>
                    <StatusBadge status={s.status} />
                    <span>&middot;</span>
                    <span>Updated {formatDateTime(s.updated_at)}</span>
                  </div>
                </div>
                {(s.status === "draft" || s.status === "revision") && (
                  <button
                    onClick={() => {
                      setActiveTemplate(s.template!);
                      setActiveSubmission(s);
                    }}
                    className={`${btn} text-xs`}
                  >
                    {s.status === "revision" ? "Revise" : "Continue"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ===================================================================== */
/* Forms: Office Template Manager & Creator                              */
/* ===================================================================== */

function FormTemplateManager({
  onSendRequirement,
  setFlash,
}: {
  onSendRequirement?: () => void;
  setFlash?: (f: Flash) => void;
}) {
  const confirm = useConfirm();
  const { data, reload } = useFetch<{ data: FormTemplate[] }>("/api/form-templates");
  const [showCreate, setShowCreate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [sendTemplate, setSendTemplate] = useState<FormTemplate | null>(null);

  const handleDelete = async (t: FormTemplate) => {
    const ok = await confirm(`Delete form template "${t.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await apiSend(`/api/form-templates/${t.id}`, "DELETE");
      setFlash?.({ kind: "ok", text: `Template "${t.title}" deleted.` });
      reload();
    } catch (err) {
      setFlash?.({ kind: "error", text: err instanceof Error ? err.message : "Failed to delete template." });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Form Templates</h3>
          <p className="text-xs text-slate-500">Formats created here can be previewed, edited, and sent directly to barangays.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className={`${btn} text-xs`}>
          {showCreate ? "Cancel" : "+ Create Form Template"}
        </button>
      </div>

      {showCreate && <FormTemplateCreator onCreated={() => { reload(); setShowCreate(false); }} />}

      <div className="space-y-3">
        {(data?.data ?? []).length === 0 ? (
          <div className={`${card} py-10 text-center text-slate-500`}>
            No form templates created yet. Click "+ Create Form Template" to build your first one.
          </div>
        ) : (
          (data?.data ?? []).map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {t.category || "General"}
                    </span>
                  </div>
                  {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    t.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  }`}>
                    {t.is_active ? "Active" : "Archived"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">v{t.version}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/10 pt-3">
                <p className="text-xs text-slate-500">
                  {t.fields.length} fields &middot; Created by {t.creator?.name ?? "DILG"} &middot; {formatDate(t.created_at)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(t)}
                    className={`${btnGhost} text-xs !py-1 !px-2.5 flex items-center gap-1.5`}
                  >
                    Preview Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTemplate(t)}
                    className={`${btn} text-xs !py-1 !px-3 !bg-[#7B4DFF] hover:!bg-[#6A3DE8] text-white flex items-center gap-1.5`}
                  >
                    Send to Barangays
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#181126] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Preview Format:</span>
                  <span>{previewTemplate.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  v{previewTemplate.version} &middot; {previewTemplate.fields.length} fields &middot; Read-only preview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <FormFiller template={previewTemplate} readOnly />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className={`${btnGhost} text-xs`}
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  setSendTemplate(t);
                }}
                className={`${btn} text-xs !bg-[#7B4DFF] hover:!bg-[#6A3DE8] text-white flex items-center gap-1.5`}
              >
                Send to Barangays
              </button>
            </div>
          </div>
        </div>
      )}

      {sendTemplate && (
        <SendTemplateModal
          template={sendTemplate}
          onClose={() => setSendTemplate(null)}
          onSent={(msg) => {
            setFlash?.({ kind: "ok", text: msg });
            onSendRequirement?.();
          }}
        />
      )}
    </div>
  );
}

function SendTemplateModal({
  template,
  onClose,
  onSent,
}: {
  template: FormTemplate;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [kind, setKind] = useState<RequirementItem["kind"]>("report");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState(template.description || "");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const barangays = useFetch<{ id: number; name: string; is_active?: boolean }[]>("/api/barangays");
  const list = (barangays.data ?? []).filter((b) => b.is_active !== false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (audience === "selected" && picked.length === 0) return;

    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        kind,
        description: description.trim() || null,
        due_date: dueDate || null,
        requires_response: true,
        form_template_id: template.id,
        audience,
      };
      if (audience === "selected") {
        payload.barangay_ids = picked;
      }
      await apiSend("/api/requirements", "POST", payload);
      onSent(`"${title}" with attached form was sent to ${audience === "all" ? "all barangays" : `${picked.length} barangay(s)`}.`);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send requirement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#181126] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Send Form to Barangays</span>
            </h3>
            <p className="text-xs text-slate-500">
              Barangays will receive an official directive to fill &amp; e-sign &ldquo;{template.title}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-[#7B4DFF]/25 bg-[#7B4DFF]/10 p-3 text-xs text-[#5A18C9] dark:text-[#CDBBFF] flex items-center gap-2">
            <span>Attached Template: <b>{template.title}</b> ({template.fields.length} fields · v{template.version})</span>
          </div>

          <label className="block">
            <span className={label}>Directive Title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${field} w-full`}
              placeholder="e.g. Monthly Accomplishment Report"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>What is it?</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RequirementItem["kind"])}
                className={`${field} w-full`}
              >
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k} className="bg-white dark:bg-[#2B2542]">{v}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={label}>Deadline (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${field} w-full`}
              />
            </label>
          </div>

          <label className="block">
            <span className={label}>Details / Instructions for Barangays</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions or reminders on how barangays should complete this form..."
              className={`${field} w-full`}
            />
          </label>

          <fieldset className="block">
            <legend className={label}>Send to</legend>
            <div className="flex gap-4 text-sm text-slate-800 dark:text-slate-200 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={audience === "all"}
                  onChange={() => setAudience("all")}
                />{" "}
                All active barangays
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={audience === "selected"}
                  onChange={() => setAudience("selected")}
                />{" "}
                Selected barangays
              </label>
            </div>
            {audience === "selected" && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 text-xs text-slate-800 dark:text-slate-200">
                {list.map((b) => (
                  <label key={b.id} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={picked.includes(b.id)}
                      onChange={(e) =>
                        setPicked(e.target.checked ? [...picked, b.id] : picked.filter((x) => x !== b.id))
                      }
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={`${btnGhost} text-xs`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim() || (audience === "selected" && picked.length === 0)}
              className={`${btn} text-xs !bg-[#7B4DFF] hover:!bg-[#6A3DE8] text-white`}
            >
              {busy ? "Sending to Barangays..." : "Send Directive Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FORM_PRESETS: Array<{
  name: string;
  title: string;
  category: string;
  description: string;
  fields: FormField[];
}> = [
  {
    name: "Barangay Accomplishment & Verification Report",
    title: "Barangay Monthly Accomplishment & Verification Report",
    category: "Audit & Compliance",
    description: "Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council.",
    fields: [
      { name: "reporting_period", type: "select", label: "Reporting Period / Quarter", required: true, options: ["1st Quarter (Jan-Mar)", "2nd Quarter (Apr-Jun)", "3rd Quarter (Jul-Sep)", "4th Quarter (Oct-Dec)"], col_span: 1 },
      { name: "date_submitted", type: "date", label: "Date of Report", required: true, col_span: 1 },
      { name: "project_name", type: "text", label: "Key Program / Project Title", required: true, placeholder: "e.g. Barangay Solid Waste & Cleanliness Drive", col_span: 2 },
      { name: "beneficiaries_count", type: "number", label: "Target Beneficiaries / Residents Served", required: true, placeholder: "e.g. 350", col_span: 1 },
      { name: "fund_source", type: "select", label: "Fund Source Utilized", required: true, options: ["Barangay General Fund", "20% Development Fund", "SK Fund", "Special Purpose Fund"], col_span: 1 },
      { name: "accomplishment_narrative", type: "textarea", label: "Detailed Accomplishment Narrative", required: true, placeholder: "Provide comprehensive narrative of project milestones, outcomes, and challenges...", col_span: 2 },
      { name: "sec_evidence", type: "section", label: "Official Means of Verification & Document Attachments", description: "Attach photo documentation, minutes, attendance sheets, or resolutions.", col_span: 2 },
      { name: "activity_photos_doc", type: "file", label: "Supporting Proof / Verification File (PDF, Office, or Images)", required: true, description: "Attach project photo album, payroll, or certificate of completion.", col_span: 2 },
      { name: "signature", type: "signature", label: "Official Certification & Electronic Signature", required: true, col_span: 2 },
    ],
  },
  {
    name: "DILG Directive / Advisory Compliance Memo",
    title: "Compliance Submission on DILG Directive",
    category: "General",
    description: "Standard compliance submission and verification report in response to issued DILG Makati memorandum, advisory, or circular.",
    fields: [
      { name: "memo_ref_no", type: "text", label: "Memorandum / Advisory Reference No.", required: true, placeholder: "e.g. DILG-MKT-MEMO-2026-042", col_span: 1 },
      { name: "date_received", type: "date", label: "Date Directive Was Received", required: true, col_span: 1 },
      { name: "action_taken", type: "textarea", label: "Barangay Actions Taken / Directive Implementation Status", required: true, placeholder: "Detail the specific actions and interventions executed by the barangay...", col_span: 2 },
      { name: "compliance_proof", type: "file", label: "Supporting Documentation / Proof of Compliance", required: true, description: "Attach transmittal letters, executive orders, or council resolutions.", col_span: 2 },
      { name: "signature", type: "signature", label: "Punong Barangay / Signatory Certification", required: true, col_span: 2 },
    ],
  },
  {
    name: "Katarungang Pambarangay Incident Docket",
    title: "Katarungang Pambarangay Case Resolution Docket",
    category: "Katarungang Pambarangay",
    description: "Summary report of disputes, conciliation proceedings, and settlements handled by the Lupon Tagapamayapa.",
    fields: [
      { name: "case_number", type: "text", label: "KP Case / Docket Number", required: true, placeholder: "e.g. KP-2026-089", col_span: 1 },
      { name: "hearing_date", type: "date", label: "Date of Conciliation Hearing", required: true, col_span: 1 },
      { name: "nature_of_dispute", type: "select", label: "Nature of Dispute", required: true, options: ["Civil / Debt Collection", "Property / Boundary Dispute", "Neighbor Altercation / Defamation", "Other Minor Offense"], col_span: 1 },
      { name: "case_status", type: "radio", label: "Settlement Status", required: true, options: ["Amicably Settled", "Certificate to File Action Issued", "Pending Hearing", "Dismissed / Withdrawn"], col_span: 1 },
      { name: "settlement_details", type: "textarea", label: "Summary of Agreement / Proceedings", required: true, placeholder: "Briefly narrate terms agreed by both parties...", col_span: 2 },
      { name: "case_file", type: "file", label: "Signed KP Form / Agreement Document", required: true, description: "Upload signed KP Form No. 16 (Amicable Settlement) or transmittal letter.", col_span: 2 },
      { name: "signature", type: "signature", label: "Lupon Chairman / Secretary Signature", required: true, col_span: 2 },
    ],
  },
];

function FormTemplateCreator({ onCreated }: { onCreated: () => void }) {
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [title, setTitle] = useState("Barangay Monthly Accomplishment & Verification Report");
  const [description, setDescription] = useState("Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council.");
  const [category, setCategory] = useState("Audit & Compliance");
  const [version, setVersion] = useState("1.0");
  const [fields, setFields] = useState<FormField[]>(FORM_PRESETS[0].fields);
  const [busy, setBusy] = useState(false);
  const [newOptionTexts, setNewOptionTexts] = useState<Record<number, string>>({});

  const applyPreset = (preset: typeof FORM_PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setFields([...preset.fields]);
  };

  const addField = (type: FormField["type"] = "text") => {
    const idx = fields.length + 1;
    const isSection = type === "section";
    const isSignature = type === "signature";
    const newField: FormField = {
      name: `field_${idx}_${Date.now().toString().slice(-4)}`,
      type,
      label: isSection ? `Section ${idx}: Title` : isSignature ? "Official Certification & Electronic Signature" : `Question / Field ${idx}`,
      required: !isSection,
      col_span: isSection || isSignature || type === "textarea" || type === "file" ? 2 : 1,
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setFields(copy);
  };

  const duplicateField = (idx: number) => {
    const orig = fields[idx];
    const copy: FormField = {
      ...orig,
      name: `${orig.name}_copy_${Date.now().toString().slice(-3)}`,
      label: `${orig.label} (Copy)`,
    };
    const newFields = [...fields];
    newFields.splice(idx + 1, 0, copy);
    setFields(newFields);
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const addOption = (fieldIdx: number) => {
    const text = (newOptionTexts[fieldIdx] ?? "").trim();
    if (!text) return;
    const current = fields[fieldIdx].options ?? [];
    updateField(fieldIdx, { options: [...current, text] });
    setNewOptionTexts({ ...newOptionTexts, [fieldIdx]: "" });
  };

  const removeOption = (fieldIdx: number, optIdx: number) => {
    const current = fields[fieldIdx].options ?? [];
    updateField(fieldIdx, { options: current.filter((_, i) => i !== optIdx) });
  };

  const handleSubmit = async () => {
    if (!title.trim() || fields.length === 0) {
      alert("Please provide a title and at least one form field.");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/form-templates", "POST", {
        title: title.trim(),
        description: description.trim() || null,
        category,
        version: version || "1.0",
        fields,
      });
      onCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setBusy(false);
    }
  };

  const previewTemplateObj: FormTemplate = {
    id: 0,
    title: title || "Untitled Form Format",
    description,
    category,
    fields,
    version,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] shadow-xl overflow-hidden space-y-0">
      {/* Top Bar with Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Form Designer &amp; Builder
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Design professional forms with custom fields, file attachment dropzones, and e-signature pads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-black/30 p-1 border border-slate-300/60 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "builder"
                  ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Form Designer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !title.trim() || fields.length === 0}
            className={`${btn} text-xs !bg-[#7B4DFF] hover:!bg-[#6A3DE8] text-white flex items-center gap-1.5`}
          >
            {busy ? "Saving Template..." : "Save & Publish Format"}
          </button>
        </div>
      </div>

      {/* Preset Quick Start */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 bg-[#FAF9FE] dark:bg-white/[0.02] flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Quick Start Templates:</span>
        {FORM_PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => applyPreset(p)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:border-[#7B4DFF]/50 hover:text-[#5A18C9] dark:hover:text-[#CDBBFF] transition-colors"
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setDescription("");
            setFields([{ name: "field_1", type: "text", label: "Field 1", required: true, col_span: 2 }]);
          }}
          className="rounded-lg border border-dashed border-slate-300 dark:border-white/10 px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          Blank Form
        </button>
      </div>

      {activeTab === "preview" ? (
        /* LIVE PREVIEW TAB */
        <div className="p-6 bg-slate-50/50 dark:bg-black/20">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="italic">
              This is a live interactive simulation of how barangay officials will see, fill, attach files, and sign your form.
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`${btnGhost} text-xs !py-0.5`}
            >
              &larr; Back to Designer
            </button>
          </div>
          <FormFiller template={previewTemplateObj} readOnly={false} />
        </div>
      ) : (
        /* BUILDER TAB */
        <div className="p-6 space-y-6">
          {/* Form Meta Section */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="sm:col-span-2 block">
              <span className={label}>Form Format Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Barangay Accomplishment Report"
                className={`${field} w-full`}
              />
            </label>

            <label className="block">
              <span className={label}>Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${field} w-full`}
              >
                <option value="Audit & Compliance" className="bg-white dark:bg-[#201835]">Audit &amp; Compliance</option>
                <option value="Peace & Order" className="bg-white dark:bg-[#201835]">Peace &amp; Order</option>
                <option value="SK Affairs" className="bg-white dark:bg-[#201835]">SK Affairs</option>
                <option value="Katarungang Pambarangay" className="bg-white dark:bg-[#201835]">Katarungang Pambarangay</option>
                <option value="GAD" className="bg-white dark:bg-[#201835]">Gender &amp; Development (GAD)</option>
                <option value="General" className="bg-white dark:bg-[#201835]">General / Administrative</option>
              </select>
            </label>

            <label className="sm:col-span-3 block">
              <span className={label}>Purpose / Instructions for Barangay Officials</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the purpose, legal reference, and instructions on how to fill out this form..."
                rows={2}
                className={`${field} w-full`}
              />
            </label>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  Form Fields &amp; Layout
                </h5>
                <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {fields.length} {fields.length === 1 ? "field" : "fields"}
                </span>
              </div>

              {/* Quick Add Bar */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 mr-1">+ Add:</span>
                <button
                  type="button"
                  onClick={() => addField("text")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add single-line text"
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => addField("textarea")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add narrative paragraph"
                >
                  Narrative
                </button>
                <button
                  type="button"
                  onClick={() => addField("number")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add number field"
                >
                  Number
                </button>
                <button
                  type="button"
                  onClick={() => addField("date")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add calendar date"
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => addField("select")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add dropdown menu"
                >
                  Dropdown
                </button>
                <button
                  type="button"
                  onClick={() => addField("file")}
                  className={`${btnGhost} text-xs !py-1 !px-2 text-[#7B4DFF] font-bold`}
                  title="Add document/file attachment zone"
                >
                  File Attachment
                </button>
                <button
                  type="button"
                  onClick={() => addField("section")}
                  className={`${btnGhost} text-xs !py-1 !px-2`}
                  title="Add section divider"
                >
                  Section Divider
                </button>
                <button
                  type="button"
                  onClick={() => addField("signature")}
                  className={`${btnGhost} text-xs !py-1 !px-2 text-[#7B4DFF] font-bold`}
                  title="Add e-signature pad"
                >
                  E-Sign Pad
                </button>
              </div>
            </div>

            {/* Field Cards */}
            <div className="space-y-3">
              {fields.map((f, i) => {
                const hasOptions = f.type === "select" || f.type === "radio" || f.type === "checkbox";

                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-4 transition-all hover:border-[#7B4DFF]/30 space-y-3"
                  >
                    {/* Field Header / Actions */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {f.label || "Untitled Field"}
                        </span>
                        <span className="rounded-full bg-[#7B4DFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
                          {f.type}
                        </span>
                        {f.required && (
                          <span className="text-rose-500 text-[11px] font-semibold">*Required</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          className="p-1 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(i, 1)}
                          disabled={i === fields.length - 1}
                          className="p-1 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(i)}
                          className="p-1 hover:text-[#7B4DFF]"
                          title="Duplicate Field"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(i)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete Field"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Field Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Field Label / Question
                        </label>
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) =>
                            updateField(i, {
                              label: e.target.value,
                              name: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50) || `field_${i + 1}`,
                            })
                          }
                          placeholder="e.g. Program Accomplishment Summary"
                          className={`${field} w-full text-xs`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Field Type
                        </label>
                        <select
                          value={f.type}
                          onChange={(e) =>
                            updateField(i, {
                              type: e.target.value as FormField["type"],
                              options: ["select", "radio", "checkbox"].includes(e.target.value) && !f.options ? ["Option 1", "Option 2"] : f.options,
                            })
                          }
                          className={`${field} w-full text-xs`}
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Narrative</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown Menu</option>
                          <option value="radio">Multiple Choice</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File Attachment</option>
                          <option value="section">Section Divider</option>
                          <option value="signature">E-Sign Pad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Layout Width
                        </label>
                        <select
                          value={f.col_span ?? 2}
                          onChange={(e) => updateField(i, { col_span: Number(e.target.value) as 1 | 2 })}
                          className={`${field} w-full text-xs`}
                        >
                          <option value={2}>Full Width (100%)</option>
                          <option value={1}>Half Width (50%)</option>
                        </select>
                      </div>

                      {f.type !== "section" && f.type !== "signature" && (
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Placeholder Text (optional)
                          </label>
                          <input
                            type="text"
                            value={f.placeholder ?? ""}
                            onChange={(e) => updateField(i, { placeholder: e.target.value })}
                            placeholder="e.g. Enter details..."
                            className={`${field} w-full text-xs`}
                          />
                        </div>
                      )}

                      <div className={f.type === "section" || f.type === "signature" ? "sm:col-span-4" : "sm:col-span-2"}>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Helper Instructions for Official (optional)
                        </label>
                        <input
                          type="text"
                          value={f.description ?? ""}
                          onChange={(e) => updateField(i, { description: e.target.value })}
                          placeholder="e.g. Upload scanned PDF copies with official dry seal."
                          className={`${field} w-full text-xs`}
                        />
                      </div>
                    </div>

                    {/* Options Editor for Select / Radio / Checkbox */}
                    {hasOptions && (
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Options List ({f.options?.length ?? 0}):
                        </label>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          {(f.options ?? []).map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => removeOption(i, optIdx)}
                                className="text-slate-400 hover:text-rose-500 ml-1"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newOptionTexts[i] ?? ""}
                            onChange={(e) =>
                              setNewOptionTexts({ ...newOptionTexts, [i]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOption(i);
                              }
                            }}
                            placeholder="Type new option..."
                            className={`${field} text-xs !py-1 !px-2.5 flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => addOption(i)}
                            className={`${btnGhost} text-xs !py-1 !px-3`}
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Required Checkbox */}
                    {f.type !== "section" && (
                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={f.required ?? false}
                            onChange={(e) => updateField(i, { required: e.target.checked })}
                            className="accent-[#7B4DFF] rounded"
                          />
                          <span>Make this field mandatory (required)</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Field Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => addField("text")}
                className={`${btnGhost} text-xs flex items-center gap-1.5`}
              >
                + Add New Field
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addField("file")}
                  className={`${btnGhost} text-xs text-[#7B4DFF] font-semibold`}
                >
                  + Add File Upload Zone
                </button>
                <button
                  type="button"
                  onClick={() => addField("signature")}
                  className={`${btnGhost} text-xs text-[#7B4DFF] font-semibold`}
                >
                  + Add E-Sign Pad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
