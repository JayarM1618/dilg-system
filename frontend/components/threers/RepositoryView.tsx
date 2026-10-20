"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend, apiUrl } from "@/lib/http";
import { useConfirm } from "@/components/ConfirmModal";
import ThreeRsTabs from "./ThreeRsTabs";
import {
  Notice,
  PageTitle,
  Pager,
  btn,
  btnGhost,
  field,
  formatBytes,
  formatDateTime,
} from "./ui";
import type {
  DocumentCategory,
  Paged,
  RepositoryDoc,
  RepositorySummary,
} from "./types";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.csv,.txt,.zip";

/* ------------------------------------------------------------------ */
/* Shared helpers (exported so BarangayReports can still import them)  */
/* ------------------------------------------------------------------ */

export type Flash = { kind: "ok" | "error"; text: string } | null;

/** Reusable empty-table-row placeholder. */
export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-muted dark:text-slate-400">{children}</td>
    </tr>
  );
}

/**
 * UploadButton kept for BarangayReports.tsx which still imports it.
 * It uploads to /api/submissions (Reports), NOT /api/repository.
 */
export function UploadButton({
  submission,
  label,
  onFlash,
  onDone,
}: {
  submission: { id: number; report_category_id: number; period_label: string; category?: { id: number; name: string } | null };
  label: string;
  onFlash: (f: Flash) => void;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".doc", ".docx", ".xls", ".xlsx"].includes(ext))
      return onFlash({ kind: "error", text: "Only PDF, Word or Excel files are accepted." });
    if (file.size > MAX_BYTES)
      return onFlash({ kind: "error", text: "That file is larger than 10 MB." });

    const body = new FormData();
    body.append("report_category_id", String(submission.report_category_id));
    body.append("period_label", submission.period_label);
    body.append("file", file);

    setBusy(true);
    try {
      await apiSend("/api/submissions", "POST", body);
      onFlash({ kind: "ok", text: `Uploaded "${file.name}" for ${submission.category?.name ?? "the report"} (${submission.period_label}).` });
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        className="sr-only"
        aria-label={`${label}: ${submission.category?.name ?? "report"} ${submission.period_label}`}
        onChange={(e) => onPick(e.target.files?.[0])}
        tabIndex={-1}
      />
      <button className={btn} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "Uploading..." : label}
      </button>
    </>
  );
}

/* ================================================================== */
/* Main view                                                           */
/* ================================================================== */

export default function RepositoryView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageTitle
        title="Repository"
        subtitle={
          user.role === "super_admin"
            ? "Governance & audit archive: inspect, review, and manage official records across all barangays and DILG."
            : "Centralized document storage for official records, policies, compliance documents, and barangay files."
        }
      />
      <ThreeRsTabs />
      <RepositoryDashboard />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard: summary cards + document list                            */
/* ------------------------------------------------------------------ */

function RepositoryDashboard() {
  const { user } = useAuth();
  const isOffice = user ? ["super_admin", "office_supervisor"].includes(user.role) : false;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [flash, setFlash] = useState<Flash>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Build query string
  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("search", search);
  if (categoryFilter) qs.set("category_id", categoryFilter);

  const { data, loading, error, reload } = useFetch<Paged<RepositoryDoc>>(`/api/repository?${qs}`);
  const summary = useFetch<RepositorySummary>("/api/repository/summary");
  const categories = useFetch<DocumentCategory[]>("/api/repository/categories");

  const rows = data?.data ?? [];
  const cats = categories.data ?? [];

  function applyFilter(set: (v: string) => void) {
    return (e: { target: { value: string } }) => {
      set(e.target.value);
      setPage(1);
    };
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <>
      {flash && (
        <Notice kind={flash.kind} onClose={() => setFlash(null)}>
          {flash.text}
        </Notice>
      )}

      {/* ---- Summary cards ---- */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard label="Total Documents" value={summary.data?.total ?? 0} icon={DocIcon} />
        {(summary.data?.by_category ?? []).slice(0, 4).map((c) => (
          <SummaryCard
            key={c.id}
            label={c.name}
            value={c.documents_count ?? 0}
            icon={FolderIcon}
            onClick={() => { setCategoryFilter(String(c.id)); setPage(1); }}
          />
        ))}
      </div>

      {/* ---- Actions & Filters ---- */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end flex-wrap gap-3">
        {user?.role !== "super_admin" && (
          <button className={btn} onClick={() => setShowUpload(!showUpload)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload Document
          </button>
        )}

        <form onSubmit={onSearch} className="flex gap-2 flex-1 sm:flex-initial">
          <label className="flex-1 sm:flex-initial">
            <span className="sr-only">Search documents</span>
            <input
              className={`${field} w-full sm:w-56`}
              placeholder="Search by title or filename..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <button className={btnGhost} type="submit">Search</button>
        </form>

        <label className="text-sm flex-1 min-w-[150px] sm:flex-initial sm:min-w-0">
          <span className="mb-1 block text-muted dark:text-slate-400">Category</span>
          <select className={`${field} w-full sm:w-auto`} value={categoryFilter} onChange={applyFilter(setCategoryFilter)}>
            <option value="" className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-[#2B2542] text-slate-900 dark:text-slate-100">{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ---- Upload form (collapsible, not available to super_admin) ---- */}
      {user?.role !== "super_admin" && showUpload && (
        <UploadDocumentForm
          categories={cats}
          isOffice={isOffice}
          onFlash={setFlash}
          onDone={() => { reload(); summary.reload(); setShowUpload(false); }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {/* ---- Document list ---- */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Documents</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {search ? `Results for "${search}"` : categoryFilter ? `Filtered by category` : "All documents you have access to"}
            </p>
          </div>
          {data && (
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {data.total} document{data.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <caption className="sr-only">Repository documents</caption>
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">Title</th>
                <th scope="col" className="px-5 py-3.5">Category</th>
                <th scope="col" className="px-5 py-3.5">Uploaded By</th>
                <th scope="col" className="px-5 py-3.5">Date</th>
                <th scope="col" className="px-5 py-3.5">Size</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading && rows.length === 0 ? (
                <EmptyRow cols={6}>Loading documents...</EmptyRow>
              ) : error ? (
                <EmptyRow cols={6}>
                  <span className="font-medium text-rose-500">{error}</span>{" "}
                  <button onClick={reload} className="underline underline-offset-4 ml-2">Try again</button>
                </EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow cols={6}>
                  {search || categoryFilter
                    ? "No documents match your filters."
                    : "No documents yet. Click \"Upload Document\" to add the first one."}
                </EmptyRow>
              ) : (
                rows.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    isOffice={isOffice}
                    isSuperAdmin={user?.role === "super_admin"}
                    onFlash={setFlash}
                    onDone={() => { reload(); summary.reload(); }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && <Pager page={data.current_page} last={data.last_page} total={data.total} onPage={setPage} />}

      {/* ---- Recent uploads (summary) ---- */}
      {!search && !categoryFilter && (summary.data?.recent?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Recently Added</h3>
          <div className="grid gap-2">
            {summary.data!.recent.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-[#181126] px-4 py-3 text-sm"
              >
                <FileTypeIcon mime={doc.mime_type} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.category?.name ?? "Uncategorized"} &bull; {doc.uploader?.name ?? "Unknown"} &bull; {formatDateTime(doc.created_at)}
                  </p>
                </div>
                <a className={btnGhost} href={apiUrl(`/api/repository/${doc.id}/download`)}>
                  <DownloadIcon />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Upload form                                                         */
/* ------------------------------------------------------------------ */

function UploadDocumentForm({
  categories,
  isOffice,
  onFlash,
  onDone,
  onCancel,
}: {
  categories: DocumentCategory[];
  isOffice: boolean;
  onFlash: (f: Flash) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [accessLevel, setAccessLevel] = useState("public");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return onFlash({ kind: "error", text: "Please select a file to upload." });
    if (file.size > MAX_BYTES) return onFlash({ kind: "error", text: "File is larger than 10 MB." });
    if (!categoryId) return onFlash({ kind: "error", text: "Please select a category." });

    const body = new FormData();
    body.append("title", title.trim());
    body.append("document_category_id", categoryId);
    if (description.trim()) body.append("description", description.trim());
    if (isOffice) body.append("access_level", accessLevel);
    body.append("file", file);

    setBusy(true);
    try {
      await apiSend("/api/repository", "POST", body);
      onFlash({ kind: "ok", text: `"${title.trim()}" uploaded successfully.` });
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] shadow-sm p-6">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Upload a Document</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Title <span className="text-rose-500">*</span></span>
            <input
              className={`${field} w-full`}
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Barangay Annual Report 2024"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Category <span className="text-rose-500">*</span></span>
            <select className={`${field} w-full`} required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" className="bg-white dark:bg-[#2B2542]">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#2B2542]">{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-sm block">
          <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Description</span>
          <textarea
            className={`${field} w-full`}
            rows={2}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of the document"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">File <span className="text-rose-500">*</span></span>
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED}
              required
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                file:text-sm file:font-semibold file:bg-[#7B4DFF]/10 file:text-[#7B4DFF]
                dark:file:bg-[#7B4DFF]/20 dark:file:text-[#CDBBFF]
                hover:file:bg-[#7B4DFF]/20 transition"
            />
            <span className="mt-1 block text-xs text-slate-400">Max 10 MB. PDF, Word, Excel, PowerPoint, images, CSV, ZIP.</span>
          </label>

          {isOffice && (
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Visibility</span>
              <select className={`${field} w-full`} value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}>
                <option value="public" className="bg-white dark:bg-[#2B2542]">Everyone (all barangays)</option>
                <option value="office" className="bg-white dark:bg-[#2B2542]">DILG Office only</option>
                <option value="barangay" className="bg-white dark:bg-[#2B2542]">Specific barangay</option>
              </select>
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className={btn} disabled={busy}>
            {busy ? "Uploading..." : "Upload"}
          </button>
          <button type="button" className={btnGhost} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Document row                                                        */
/* ------------------------------------------------------------------ */

function DocumentRow({
  doc,
  isOffice,
  isSuperAdmin,
  onFlash,
  onDone,
}: {
  doc: RepositoryDoc;
  isOffice: boolean;
  isSuperAdmin: boolean;
  onFlash: (f: Flash) => void;
  onDone: () => void;
}) {
  const confirmModal = useConfirm();
  const [busy, setBusy] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  async function handleArchive() {
    setBusy(true);
    try {
      await apiSend(`/api/repository/${doc.id}/archive`, "PATCH", {});
      onFlash({ kind: "ok", text: `"${doc.title}" archived.` });
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Failed to archive." });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmModal(`Permanently delete "${doc.title}"? This cannot be undone.`);
    if (!ok) return;
    setBusy(true);
    try {
      await apiSend(`/api/repository/${doc.id}`, "DELETE", {});
      onFlash({ kind: "ok", text: `"${doc.title}" permanently deleted.` });
      onDone();
    } catch (e) {
      onFlash({ kind: "error", text: e instanceof Error ? e.message : "Failed to delete." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <FileTypeIcon mime={doc.mime_type} />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[260px]">{doc.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">{doc.original_filename}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {doc.category?.name ?? "Uncategorized"}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
          <p>{doc.uploader?.name ?? "Unknown"}</p>
          {doc.barangay && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{doc.barangay.name}</p>
          )}
        </td>
        <td className="px-5 py-4 tabular-nums text-xs text-slate-600 dark:text-slate-300">
          {formatDateTime(doc.created_at)}
        </td>
        <td className="px-5 py-4 tabular-nums text-xs text-slate-600 dark:text-slate-300">
          {formatBytes(doc.size_bytes)}
        </td>
        <td className="px-5 py-4 text-right">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a className={btnGhost} href={apiUrl(`/api/repository/${doc.id}/download`)}>
              <DownloadIcon />
              Download
            </a>
            <button className={btnGhost} onClick={() => setShowDetail(!showDetail)}>
              {showDetail ? "Close" : "Details"}
            </button>
            {isOffice && doc.status === "active" && (
              <button className={btnGhost} disabled={busy} onClick={handleArchive}>
                Archive
              </button>
            )}
            {isSuperAdmin && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#181126] px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                disabled={busy}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
      {showDetail && (
        <tr>
          <td colSpan={6} className="bg-slate-50/70 dark:bg-black/20 px-6 py-4 border-t border-slate-100 dark:border-white/5">
            <DocumentDetail doc={doc} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Document detail panel (expanded row)                                */
/* ------------------------------------------------------------------ */

function DocumentDetail({ doc }: { doc: RepositoryDoc }) {
  const accessLabels: Record<string, string> = {
    public: "Everyone",
    office: "DILG Office only",
    barangay: "Barangay only",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</span>
        <p className="text-slate-800 dark:text-slate-200 mt-0.5">{doc.description || "No description provided."}</p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Level</span>
        <p className="text-slate-800 dark:text-slate-200 mt-0.5">
          <AccessBadge level={doc.access_level} />
          {doc.barangay && doc.access_level === "barangay" && (
            <span className="ml-2 text-xs text-slate-500">({doc.barangay.name})</span>
          )}
        </p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">File Type</span>
        <p className="text-slate-800 dark:text-slate-200 mt-0.5">{doc.mime_type ?? "Unknown"}</p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SHA-256 Fingerprint</span>
        <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono text-xs" title={doc.sha256 ?? undefined}>
          {doc.sha256 ? `${doc.sha256.slice(0, 20)}...` : "N/A"}
        </p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
        <p className="mt-0.5">
          <StatusBadge status={doc.status} />
        </p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Updated</span>
        <p className="text-slate-800 dark:text-slate-200 mt-0.5">{formatDateTime(doc.updated_at)}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ComponentType;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] px-4 py-4 text-left shadow-sm ${onClick ? "cursor-pointer hover:border-[#7B4DFF]/40 hover:shadow-md transition" : ""
        }`}
    >
      <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
        <Icon />
        <span className="text-xs font-semibold uppercase tracking-wider truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
    </Wrapper>
  );
}

function AccessBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    public: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    office: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    barangay: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  };
  const labels: Record<string, string> = {
    public: "Everyone",
    office: "Office only",
    barangay: "Barangay",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[level] ?? ""}`}>
      {labels[level] ?? level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    archived: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] ?? ""}`}>
      {status === "active" ? "Active" : "Archived"}
    </span>
  );
}

function FileTypeIcon({ mime }: { mime: string | null }) {
  let color = "text-slate-400";
  let label = "FILE";

  if (mime) {
    if (mime.includes("pdf")) { color = "text-rose-500"; label = "PDF"; }
    else if (mime.includes("word") || mime.includes("doc")) { color = "text-blue-500"; label = "DOC"; }
    else if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) { color = "text-emerald-500"; label = "XLS"; }
    else if (mime.includes("presentation") || mime.includes("powerpoint")) { color = "text-amber-500"; label = "PPT"; }
    else if (mime.includes("image")) { color = "text-purple-500"; label = "IMG"; }
    else if (mime.includes("zip")) { color = "text-yellow-600"; label = "ZIP"; }
  }

  return (
    <div className={`flex-shrink-0 grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-white/10 ${color}`}>
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
