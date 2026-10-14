"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import ThreeRsTabs from "./ThreeRsTabs";
import { Notice, PageTitle, btn, btnGhost, field, formatBytes, formatDateTime } from "./ui";
import {
  ASSIGNMENT_LABEL,
  KIND_LABEL,
  type AssignmentStatus,
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
  const list = useFetch<{ data: RequirementItem[] }>("/api/requirements");
  const tracker = useFetch<{ data: TrackerRow[] }>("/api/requirements/tracker");
  const [flash, setFlash] = useState<Flash>(null);
  const [view, setView] = useState<"sent" | "tracker">(isSupervisor ? "sent" : "tracker");

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
        {(["sent", "tracker"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${view === v ? "bg-white dark:bg-[#201835] text-[#5A18C9] dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
              }`}
          >
            {v === "sent" ? "Sent requirements" : "Barangay tracker"}
          </button>
        ))}
      </div>

      {view === "tracker" ? (
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
  const [open, setOpen] = useState(false);
  const p = item.progress!;

  async function act(path: string, method: "POST" | "DELETE", ok: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
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
  const list = (barangays.data ?? []).filter((b) => b.is_active !== false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    body.delete("files");
    Array.from((form.elements.namedItem("files") as HTMLInputElement).files ?? []).forEach((f) => body.append("files[]", f));
    body.set("requires_response", body.get("requires_response") ? "1" : "0");
    if (!body.get("due_date")) body.delete("due_date");
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
  const inbox = useFetch<{ data: InboxItem[] }>("/api/requirements");
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
      {inbox.loading && !inbox.data ? (
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
