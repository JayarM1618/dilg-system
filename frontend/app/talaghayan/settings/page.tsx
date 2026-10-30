"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ConfirmProvider, useConfirm } from "@/components/ConfirmModal";
import SystemAdminTabs from "@/components/SystemAdminTabs";
import { btn, btnGhost, field, PageTitle, formatDateTime } from "@/components/threers/ui";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { SystemBroadcast, ErrorLog, Paginated } from "@/types";

/* ──────────────────────────── constants ──────────────────────────── */

const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm";
const TABS = ["General Settings", "System Broadcasts", "Error Logs"] as const;
type Tab = (typeof TABS)[number];

const GROUP_LABELS: Record<string, string> = {
  upload: "Upload Limits",
  password: "Password Policy",
  twofa: "Two-Factor Authentication",
  security: "Security",
  maintenance: "Maintenance",
  general: "General",
};

const TYPE_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  maintenance: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
};

const TARGET_LABELS: Record<string, string> = {
  all: "Everyone",
  super_admin: "Super Admins",
  office_supervisor: "Office Supervisors",
  barangay_rep: "Barangay Reps",
};

/* ──────────────────────────── toggle ──────────────────────────── */

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0039A6]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
        value ? "bg-[#0039A6]" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? "translate-x-5" : "translate-x-0.5"
        } mt-0.5`}
      />
    </button>
  );
}

/* ──────────────────────────── notice ──────────────────────────── */

function Notice({ type, message, onDismiss }: { type: "success" | "error"; message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

/* ══════════════════════ TAB 1: General Settings ══════════════════════ */

interface SettingItem {
  key: string;
  value: string | number | boolean;
  type: "string" | "integer" | "boolean" | "json";
  description?: string | null;
}

function GeneralSettingsTab() {
  const { data, isLoading, mutate } = useApi<{ data: Record<string, SettingItem[]> }>("/api/admin/settings");
  const [edits, setEdits] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const grouped = data?.data ?? {};
  const isDirty = Object.keys(edits).length > 0;

  const getVal = (item: SettingItem) => (item.key in edits ? edits[item.key] : item.value);

  const setVal = (item: SettingItem, val: string | number | boolean) => {
    setEdits((prev) => {
      const next = { ...prev };
      // If value is back to original, remove from edits
      if (val === item.value) {
        delete next[item.key];
      } else {
        next[item.key] = val;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await api.patch("/api/admin/settings", { settings: edits });
      setEdits({});
      mutate();
      setNotice({ type: "success", message: "Settings saved successfully." });
    } catch (e: unknown) {
      setNotice({ type: "error", message: e instanceof Error ? e.message : "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading settings…</div>;
  }

  const groupOrder = ["general", "upload", "password", "twofa", "security", "maintenance"];

  return (
    <div className="space-y-6">
      {notice && <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}

      {groupOrder.map((group) => {
        const items = grouped[group];
        if (!items?.length) return null;
        return (
          <div key={group} className={`${card} p-5`}>
            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {GROUP_LABELS[group] ?? group}
            </h3>
            <div className="space-y-4">
              {items.map((item) => {
                const v = getVal(item);
                return (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                      {item.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <div className="w-full sm:w-52 shrink-0">
                      {item.type === "boolean" ? (
                        <Toggle value={!!v} onChange={(nv) => setVal(item, nv)} />
                      ) : item.type === "integer" ? (
                        <input
                          type="number"
                          className={field + " w-full"}
                          value={v as number}
                          onChange={(e) => setVal(item, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <input
                          type="text"
                          className={field + " w-full"}
                          value={v as string}
                          onChange={(e) => setVal(item, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save bar */}
      <div className="flex justify-end gap-3 pt-2">
        {isDirty && (
          <button className={btnGhost} onClick={() => setEdits({})}>
            Discard
          </button>
        )}
        <button className={btn} disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════ TAB 2: System Broadcasts ══════════════════════ */

const EMPTY_BROADCAST = {
  title: "",
  message: "",
  type: "info" as SystemBroadcast["type"],
  target: "all" as SystemBroadcast["target"],
  is_dismissible: true,
  starts_at: "",
  ends_at: "",
};

function BroadcastsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useApi<Paginated<SystemBroadcast>>(`/api/admin/broadcasts?page=${page}`);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_BROADCAST);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const confirm = useConfirm();

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_BROADCAST);
    setFormOpen(true);
  };

  const openEdit = (b: SystemBroadcast) => {
    setEditId(b.id);
    setForm({
      title: b.title,
      message: b.message,
      type: b.type,
      target: b.target,
      is_dismissible: b.is_dismissible,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.starts_at) delete payload.starts_at;
      if (!payload.ends_at) delete payload.ends_at;

      if (editId) {
        await api.patch(`/api/admin/broadcasts/${editId}`, payload);
        setNotice({ type: "success", message: "Broadcast updated." });
      } else {
        await api.post("/api/admin/broadcasts", payload);
        setNotice({ type: "success", message: "Broadcast created." });
      }
      setFormOpen(false);
      mutate();
    } catch (e: unknown) {
      setNotice({ type: "error", message: e instanceof Error ? e.message : "Failed to save broadcast." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: SystemBroadcast) => {
    const ok = await confirm(`Delete broadcast "${b.title}"?`);
    if (!ok) return;
    try {
      await api.delete(`/api/admin/broadcasts/${b.id}`);
      mutate();
      setNotice({ type: "success", message: "Broadcast deleted." });
    } catch {
      setNotice({ type: "error", message: "Failed to delete broadcast." });
    }
  };

  const handleToggleActive = async (b: SystemBroadcast) => {
    try {
      await api.patch(`/api/admin/broadcasts/${b.id}`, { is_active: !b.is_active });
      mutate();
    } catch {
      setNotice({ type: "error", message: "Failed to toggle broadcast." });
    }
  };

  const broadcasts = data?.data ?? [];

  return (
    <div className="space-y-4">
      {notice && <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{data?.total ?? 0} broadcast(s)</p>
        <button className={btn} onClick={openNew}>+ New Broadcast</button>
      </div>

      {/* Form panel */}
      {formOpen && (
        <div className={`${card} p-5 space-y-4`}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {editId ? "Edit Broadcast" : "New Broadcast"}
          </h3>
          <input
            className={field + " w-full"}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className={field + " w-full min-h-[80px]"}
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className={field + " w-full"}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as SystemBroadcast["type"] }))}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              className={field + " w-full"}
              value={form.target}
              onChange={(e) => setForm((p) => ({ ...p, target: e.target.value as SystemBroadcast["target"] }))}
            >
              <option value="all">Everyone</option>
              <option value="super_admin">Super Admins</option>
              <option value="office_supervisor">Office Supervisors</option>
              <option value="barangay_rep">Barangay Reps</option>
            </select>
            <div className="flex items-center gap-2">
              <Toggle value={form.is_dismissible} onChange={(v) => setForm((p) => ({ ...p, is_dismissible: v }))} />
              <span className="text-xs text-slate-600 dark:text-slate-300">Dismissible</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Start date (optional)</label>
              <input
                type="datetime-local"
                className={field + " w-full"}
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">End date (optional)</label>
              <input
                type="datetime-local"
                className={field + " w-full"}
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button className={btnGhost} onClick={() => setFormOpen(false)}>Cancel</button>
            <button className={btn} disabled={submitting || !form.title.trim()} onClick={handleSubmit}>
              {submitting ? "Saving…" : editId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading broadcasts…</div>
      ) : broadcasts.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-slate-400`}>No broadcasts yet.</div>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Target</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Active</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Schedule</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white max-w-[200px] truncate">{b.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE[b.type] ?? ""}`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{TARGET_LABELS[b.target] ?? b.target}</td>
                  <td className="px-4 py-3 text-center">
                    <Toggle value={b.is_active} onChange={() => handleToggleActive(b)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {b.starts_at || b.ends_at
                      ? `${b.starts_at ? formatDateTime(b.starts_at) : "—"} → ${b.ends_at ? formatDateTime(b.ends_at) : "—"}`
                      : "Always"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className={btnGhost + " !px-2 !py-1"} onClick={() => openEdit(b)} title="Edit">
                        ✏️
                      </button>
                      <button
                        className={btnGhost + " !px-2 !py-1 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20"}
                        onClick={() => handleDelete(b)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            className={btnGhost}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {data.current_page} of {data.last_page}
          </span>
          <button
            className={btnGhost}
            disabled={page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════ TAB 3: Error Logs ══════════════════════ */

const LEVEL_BADGE: Record<string, string> = {
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  debug: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};

function ErrorLogsTab() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    if (level) p.set("level", level);
    if (search) p.set("q", search);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [page, level, search, from, to]);

  const { data, isLoading } = useApi<Paginated<ErrorLog>>(`/api/admin/error-logs?${params}`);
  const logs = data?.data ?? [];

  const applyFilters = useCallback(() => setPage(1), []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`${card} p-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select className={field + " w-full"} value={level} onChange={(e) => { setLevel(e.target.value); applyFilters(); }}>
            <option value="">All levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <input
            type="text"
            className={field + " w-full sm:col-span-2"}
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
          <input type="date" className={field + " w-full"} value={from} onChange={(e) => { setFrom(e.target.value); applyFilters(); }} />
          <input type="date" className={field + " w-full"} value={to} onChange={(e) => { setTo(e.target.value); applyFilters(); }} />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading error logs…</div>
      ) : logs.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-slate-400`}>No error logs found.</div>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">File</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold ${LEVEL_BADGE[log.level] ?? LEVEL_BADGE.debug}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[300px] truncate">{log.message}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell font-mono max-w-[200px] truncate">
                      {log.file ? `${log.file.split("/").pop()}:${log.line}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">{log.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.logged_at)}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr key={`${log.id}-detail`} className="border-b border-slate-100 dark:border-white/5">
                      <td colSpan={5} className="px-4 py-4 bg-slate-50/50 dark:bg-white/5">
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Full message:</span>
                            <p className="mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-all">{log.message}</p>
                          </div>
                          {log.file && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">File:</span>{" "}
                              <span className="font-mono text-slate-500">{log.file}:{log.line}</span>
                            </div>
                          )}
                          {log.url && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">URL:</span>{" "}
                              <span className="font-mono text-slate-500">{log.method} {log.url}</span>
                            </div>
                          )}
                          {log.ip_address && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">IP:</span>{" "}
                              <span className="text-slate-500">{log.ip_address}</span>
                            </div>
                          )}
                          {log.trace && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Stack trace:</span>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-slate-100 dark:bg-[#0F172A] p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                                {log.trace}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ← Prev
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {data.current_page} of {data.last_page}
          </span>
          <button className={btnGhost} disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════ Main Page ══════════════════════ */

function SettingsContent() {
  const [tab, setTab] = useState<Tab>("General Settings");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageTitle
        title="Settings & Config"
        sub="System configuration, broadcasts, and error monitoring"
      />

      <SystemAdminTabs />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-[#0F172A] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-white dark:bg-[#0F172A] text-[#0039A6] shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "General Settings" && <GeneralSettingsTab />}
      {tab === "System Broadcasts" && <BroadcastsTab />}
      {tab === "Error Logs" && <ErrorLogsTab />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ConfirmProvider>
      <SettingsContent />
    </ConfirmProvider>
  );
}
