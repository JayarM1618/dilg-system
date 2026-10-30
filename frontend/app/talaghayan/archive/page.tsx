"use client";

import { useCallback, useMemo, useState } from "react";
import { ConfirmProvider, useConfirm } from "@/components/ConfirmModal";
import SystemAdminTabs from "@/components/SystemAdminTabs";
import { btn, btnGhost, field, PageTitle, Pager, formatDateTime } from "@/components/threers/ui";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { ArchiveSummary, Paginated } from "@/types";

/* ──────────────────────────── constants ──────────────────────────── */

const ARCHIVE_TYPES = [
  { key: "users", label: "Users" },
  { key: "resources", label: "Resources" },
  { key: "repository_documents", label: "Documents" },
  { key: "form_templates", label: "Form Templates" },
  { key: "requirements", label: "Requirements" },
  { key: "report_categories", label: "Report Categories" },
  { key: "document_categories", label: "Doc Categories" },
] as const;

type ArchiveType = (typeof ARCHIVE_TYPES)[number]["key"];

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  office_supervisor: "DILG Supervisor",
  barangay_rep: "Barangay Rep",
};

/* ──────────────────────────── inner page ─────────────────────────── */

function ArchivePage() {
  const confirm = useConfirm();

  const [selectedType, setSelectedType] = useState<ArchiveType>("users");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  /* ── API hooks ── */
  const { data: summary, mutate: mutateSummary } = useApi<ArchiveSummary>(
    "/api/admin/archive/summary"
  );

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({ type: selectedType, page: String(page) });
    if (appliedSearch) params.set("q", appliedSearch);
    return `/api/admin/archive?${params}`;
  }, [selectedType, page, appliedSearch]);

  const { data: items, mutate: mutateItems } = useApi<Paginated<any>>(listUrl);

  /* ── helpers ── */
  const switchType = useCallback((t: ArchiveType) => {
    setSelectedType(t);
    setPage(1);
    setSearch("");
    setAppliedSearch("");
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setAppliedSearch(search.trim());
      setPage(1);
    },
    [search]
  );

  const handleRestore = useCallback(
    async (id: number, label: string) => {
      const ok = await confirm({
        title: "Restore from archive",
        body: `Are you sure you want to restore "${label}" from the archive? It will become active again.`,
        action: "Restore",
        intent: "confirm",
      });
      if (!ok) return;

      setRestoring(id);
      try {
        await api.post(`/api/admin/archive/${selectedType}/${id}/restore`);
        setNotice(`"${label}" restored successfully.`);
        mutateSummary();
        mutateItems();
        setTimeout(() => setNotice(null), 4000);
      } catch (err: any) {
        setNotice(`Restore failed: ${err?.message ?? "Unknown error"}`);
        setTimeout(() => setNotice(null), 5000);
      } finally {
        setRestoring(null);
      }
    },
    [confirm, selectedType, mutateSummary, mutateItems]
  );

  const typeLabel = ARCHIVE_TYPES.find((t) => t.key === selectedType)?.label ?? selectedType;

  /* ──────────────────────────── render ───────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <PageTitle
        title="Archive Center"
        subtitle="View and restore archived items across the system"
      />

      <SystemAdminTabs />

      {/* ── Notice banner ── */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {notice}
        </div>
      )}

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ARCHIVE_TYPES.map(({ key, label }) => {
          const count = summary?.counts?.[key] ?? 0;
          const active = count > 0;
          return (
            <button
              key={key}
              onClick={() => switchType(key)}
              className={`rounded-2xl border p-3 text-center transition-all ${
                selectedType === key
                  ? "border-[#0039A6] bg-[#0039A6]/10 dark:bg-[#0039A6]/20 ring-2 ring-[#0039A6]/30"
                  : active
                  ? "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] hover:border-[#0039A6]/50 shadow-sm"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] opacity-60 shadow-sm"
              }`}
            >
              <p className={`text-2xl font-bold ${active ? "text-[#0039A6]" : "text-slate-400 dark:text-slate-500"}`}>
                {count}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                {label}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Type pills + search ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {ARCHIVE_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchType(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedType === key
                    ? "bg-[#0039A6] text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {label}
                {(summary?.counts?.[key] ?? 0) > 0 && (
                  <span className="ml-1 opacity-70">({summary?.counts?.[key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${typeLabel.toLowerCase()}…`}
              className={`${field} w-48`}
            />
            <button type="submit" className={btnGhost}>
              Search
            </button>
          </form>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <ColumnHeaders type={selectedType} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {items?.data?.length ? (
                items.data.map((item: any) => (
                  <ArchiveRow
                    key={item.id}
                    item={item}
                    type={selectedType}
                    restoring={restoring === item.id}
                    onRestore={handleRestore}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm font-medium">No archived {typeLabel.toLowerCase()} found</p>
                      {appliedSearch && (
                        <p className="text-xs">
                          Try a different search term or{" "}
                          <button
                            onClick={() => { setSearch(""); setAppliedSearch(""); }}
                            className="text-[#0039A6] hover:underline"
                          >
                            clear the filter
                          </button>
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {items && items.last_page > 1 && (
          <div className="border-t border-slate-100 dark:border-white/5 px-4 py-3">
            <Pager page={page} lastPage={items.last_page} onChange={setPage} />
          </div>
        )}
      </div>

      {/* ── Total summary ── */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        {summary?.total ?? 0} total archived item{(summary?.total ?? 0) !== 1 ? "s" : ""} across all categories
      </p>
    </div>
  );
}

/* ──────────────────────── column headers ─────────────────────────── */

function ColumnHeaders({ type }: { type: ArchiveType }) {
  const th = "px-4 py-3";
  switch (type) {
    case "users":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Email</th>
          <th className={th}>Role</th>
          <th className={th}>Archived At</th>
          <th className={th}>Archived By</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "resources":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Type</th>
          <th className={th}>Archived At</th>
          <th className={th}>Archived By</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "repository_documents":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Category</th>
          <th className={th}>Archived At</th>
          <th className={th}>Archived By</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "form_templates":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Archived At</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "requirements":
      return (
        <>
          <th className={th}>Title</th>
          <th className={th}>Type</th>
          <th className={th}>Archived At</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "report_categories":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Cycle</th>
          <th className={th}>Archived At</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
    case "document_categories":
      return (
        <>
          <th className={th}>Name</th>
          <th className={th}>Archived At</th>
          <th className={`${th} text-right`}>Actions</th>
        </>
      );
  }
}

/* ──────────────────────── archive table row ──────────────────────── */

function ArchiveRow({
  item,
  type,
  restoring,
  onRestore,
}: {
  item: any;
  type: ArchiveType;
  restoring: boolean;
  onRestore: (id: number, label: string) => void;
}) {
  const td = "px-4 py-3 text-slate-700 dark:text-slate-200";
  const muted = "px-4 py-3 text-slate-500 dark:text-slate-400";
  const label = item.name ?? item.title ?? `#${item.id}`;

  const restoreBtn = (
    <td className={`${td} text-right`}>
      <button
        onClick={() => onRestore(item.id, label)}
        disabled={restoring}
        className={`${btnGhost} ${restoring ? "opacity-50" : ""}`}
      >
        {restoring ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Restoring…
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Restore
          </span>
        )}
      </button>
    </td>
  );

  switch (type) {
    case "users":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}>
            <span className="font-medium">{item.name}</span>
          </td>
          <td className={muted}>{item.email}</td>
          <td className={muted}>
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
              {ROLE_LABEL[item.role] ?? item.role}
            </span>
          </td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          <td className={muted}>{item.archiver?.name ?? "—"}</td>
          {restoreBtn}
        </tr>
      );
    case "resources":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.name}</span></td>
          <td className={muted}>{item.type ?? "—"}</td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          <td className={muted}>{item.archiver?.name ?? "—"}</td>
          {restoreBtn}
        </tr>
      );
    case "repository_documents":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.name}</span></td>
          <td className={muted}>{item.category?.name ?? "—"}</td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          <td className={muted}>{item.archiver?.name ?? "—"}</td>
          {restoreBtn}
        </tr>
      );
    case "form_templates":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.name}</span></td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          {restoreBtn}
        </tr>
      );
    case "requirements":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.title ?? item.name}</span></td>
          <td className={muted}>{item.type ?? "—"}</td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          {restoreBtn}
        </tr>
      );
    case "report_categories":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.name}</span></td>
          <td className={muted}>
            <span className="capitalize">{item.cycle ?? "—"}</span>
          </td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          {restoreBtn}
        </tr>
      );
    case "document_categories":
      return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[.02]">
          <td className={td}><span className="font-medium">{item.name}</span></td>
          <td className={muted}>{formatDateTime(item.archived_at)}</td>
          {restoreBtn}
        </tr>
      );
  }
}

/* ──────────────────────── export (wrapped) ───────────────────────── */

export default function ArchiveCenterPage() {
  return (
    <ConfirmProvider>
      <ArchivePage />
    </ConfirmProvider>
  );
}
