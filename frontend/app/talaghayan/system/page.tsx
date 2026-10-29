"use client";

import { useState, useCallback } from "react";
import SystemAdminTabs from "@/components/SystemAdminTabs";
import {
  btn,
  btnGhost,
  field,
  PageTitle,
  formatDateTime,
  formatBytes,
} from "@/components/threers/ui";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { SystemInfo, SystemHealth } from "@/types";

/* ────────────────────────────────────────────── constants ── */

const card =
  "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1F1733] shadow-sm";

const TABS = [
  { key: "info", label: "System Info" },
  { key: "health", label: "API Health" },
  { key: "storage", label: "Storage" },
  { key: "analytics", label: "Analytics" },
  { key: "export", label: "Export Center" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const EXPORT_TYPES = [
  { value: "users", label: "Users" },
  { value: "activity_logs", label: "Activity Logs" },
  { value: "login_attempts", label: "Login Attempts" },
  { value: "submissions", label: "Submissions" },
  { value: "barangays", label: "Barangays" },
  { value: "report_categories", label: "Report Categories" },
  { value: "requirements", label: "Requirements" },
  { value: "resources", label: "Resources" },
  { value: "repository_documents", label: "Repository Documents" },
];

/* ────────────────────────────────────────────── helpers ── */

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-red-500"
      }`}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-xs font-medium text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-slate-200 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${card} h-48 p-5`} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────── tab: System Info ── */

interface StorageData {
  database: {
    name: string;
    total_size: number;
    tables: { table: string; size: number; rows: number }[];
  };
  uploads: { path: string; size: number };
  barangay_storage: { barangay: string; file_count: number }[];
}

interface AnalyticsData {
  daily_active_users: { date: string; active_users: number }[];
  monthly_active_users: { month: string; active_users: number }[];
  top_actions: { action: string; count: number }[];
  peak_hours: { hour: number; count: number }[];
  user_activity: {
    id: number;
    name: string;
    email: string;
    role: string;
    action_count: number;
    last_active: string | null;
  }[];
  dormant_users: {
    id: number;
    name: string;
    email: string;
    role: string;
    last_active: string | null;
  }[];
  barangay_compliance: {
    id: number;
    name: string;
    total_submissions: number;
    compliant_count: number;
  }[];
}

function SystemInfoTab() {
  const { data, isLoading } = useApi<SystemInfo>("/api/admin/system/info");

  if (isLoading || !data) return <Skeleton />;

  const diskPct =
    data.disk_total > 0
      ? Math.round((data.disk_used / data.disk_total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Server */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
            Server
          </h3>
          <InfoRow label="PHP" value={data.php_version} />
          <InfoRow label="Laravel" value={data.laravel_version} />
          <InfoRow label="MySQL" value={data.mysql_version} />
          <InfoRow label="OS" value={data.server_os} />
          <InfoRow label="Uptime" value={data.server_uptime} />
        </div>

        {/* Configuration */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
            Configuration
          </h3>
          <InfoRow label="Timezone" value={data.timezone} />
          <InfoRow label="Environment" value={data.app_env} />
          <InfoRow
            label="Debug"
            value={
              <span
                className={
                  data.app_debug
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {data.app_debug ? "ON" : "OFF"}
              </span>
            }
          />
          <InfoRow label="Cache" value={data.cache_driver} />
          <InfoRow label="Queue" value={data.queue_driver} />
          <InfoRow label="Mail" value={data.mail_driver} />
        </div>

        {/* Limits */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
            Limits
          </h3>
          <InfoRow label="Memory limit" value={data.memory_limit} />
          <InfoRow
            label="Memory usage"
            value={formatBytes(data.memory_usage)}
          />
          <InfoRow label="Max upload" value={data.max_upload} />
          <InfoRow label="Post max size" value={data.post_max_size} />
        </div>
      </div>

      {/* Disk usage */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
          Disk Usage
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>
            {formatBytes(data.disk_used)} used of {formatBytes(data.disk_total)}
          </span>
          <span>{diskPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7B4DFF] to-[#5A18C9] transition-all"
            style={{ width: `${diskPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {formatBytes(data.disk_free)} free
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────── tab: API Health ── */

function HealthTab() {
  const { data, isLoading, mutate } = useApi<SystemHealth>(
    "/api/admin/system/health"
  );

  if (isLoading || !data) return <Skeleton />;

  const healthy = data.overall === "healthy";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              healthy
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            <StatusDot ok={healthy} />
            {healthy ? "All systems healthy" : "Degraded"}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Checked {formatDateTime(data.checked_at)}
          </span>
        </div>
        <button className={btnGhost} onClick={() => mutate()}>
          Check Again
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(data.checks).map(([name, check]) => (
          <div key={name} className={`${card} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <StatusDot ok={check.status === "ok"} />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white capitalize">
                {name}
              </h3>
            </div>
            <div className="space-y-1">
              <InfoRow
                label="Status"
                value={
                  <span
                    className={
                      check.status === "ok"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {check.status.toUpperCase()}
                  </span>
                }
              />
              {check.latency_ms !== undefined && (
                <InfoRow label="Latency" value={`${check.latency_ms} ms`} />
              )}
              {check.driver && <InfoRow label="Driver" value={check.driver} />}
              {check.message && (
                <p className="text-xs text-red-500 mt-2">{check.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────── tab: Storage ── */

function StorageTab() {
  const { data, isLoading } = useApi<StorageData>("/api/admin/system/storage");

  if (isLoading || !data) return <Skeleton />;

  const sortedTables = [...(data.database.tables || [])].sort(
    (a, b) => b.size - a.size
  );

  return (
    <div className="space-y-6">
      {/* DB overview */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Database: {data.database.name}
          </h3>
          <span className="text-xs font-medium text-[#7B4DFF]">
            {formatBytes(data.database.total_size)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-left text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">Table</th>
                <th className="pb-2 font-medium text-right">Rows</th>
                <th className="pb-2 font-medium text-right">Size</th>
                <th className="pb-2 font-medium w-32" />
              </tr>
            </thead>
            <tbody>
              {sortedTables.map((t) => {
                const pct =
                  data.database.total_size > 0
                    ? (t.size / data.database.total_size) * 100
                    : 0;
                return (
                  <tr
                    key={t.table}
                    className="border-b border-slate-50 dark:border-white/5"
                  >
                    <td className="py-2 text-slate-800 dark:text-white font-medium">
                      {t.table}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                      {t.rows.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                      {formatBytes(t.size)}
                    </td>
                    <td className="py-2 pl-4">
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7B4DFF]"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Uploads */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
          Uploaded Files
        </h3>
        <p className="text-2xl font-bold text-[#7B4DFF]">
          {formatBytes(data.uploads.size)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {data.uploads.path}
        </p>
      </div>

      {/* Per-barangay */}
      {data.barangay_storage?.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Files per Barangay
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.barangay_storage.map((b) => (
              <div
                key={b.barangay}
                className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2"
              >
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  {b.barangay}
                </span>
                <span className="text-xs font-semibold text-[#7B4DFF] ml-2">
                  {b.file_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────── tab: Analytics ── */

function AnalyticsTab() {
  const { data, isLoading } = useApi<AnalyticsData>("/api/admin/analytics");
  const [exporting, setExporting] = useState(false);

  const handleExportLogs = useCallback(async () => {
    setExporting(true);
    try {
      const res = await api.get(
        "/api/admin/export?type=activity_logs&format=csv"
      );
      // If it returns JSON with data, we need to download it differently
      // For CSV, the response should be text
      const blob = new Blob([JSON.stringify(res, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }, []);

  if (isLoading || !data) return <Skeleton />;

  const dau = data.daily_active_users?.slice(-14) ?? [];
  const mau = data.monthly_active_users ?? [];
  const topActs = data.top_actions?.slice(0, 10) ?? [];
  const maxDau = Math.max(...dau.map((d) => d.active_users), 1);
  const maxMau = Math.max(...mau.map((m) => m.active_users), 1);
  const maxAct = Math.max(...topActs.map((a) => a.count), 1);
  const peakHours = data.peak_hours ?? [];
  const maxPeak = Math.max(...peakHours.map((p) => p.count), 1);

  return (
    <div className="space-y-6">
      {/* DAU */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Daily Active Users (last 14 days)
          </h3>
          <button
            className={btnGhost}
            onClick={handleExportLogs}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export Logs"}
          </button>
        </div>
        <div className="flex items-end gap-1 h-32">
          {dau.map((d) => {
            const pct = (d.active_users / maxDau) * 100;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] text-slate-400">
                  {d.active_users}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#7B4DFF] to-[#9B7AFF] transition-all"
                    style={{ height: `${Math.max(pct, 3)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 truncate w-full text-center">
                  {d.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAU */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
          Monthly Active Users
        </h3>
        <div className="flex items-end gap-2 h-28">
          {mau.map((m) => {
            const pct = (m.active_users / maxMau) * 100;
            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] text-slate-400">
                  {m.active_users}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#5A18C9] to-[#7B4DFF] transition-all"
                    style={{ height: `${Math.max(pct, 3)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 truncate w-full text-center">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Actions */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Top Actions (30 days)
          </h3>
          <div className="space-y-2">
            {topActs.map((a) => {
              const pct = (a.count / maxAct) * 100;
              return (
                <div key={a.action} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {a.action}
                    </span>
                    <span className="text-slate-400 ml-2">{a.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7B4DFF]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Activity by Hour (7 days)
          </h3>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 24 }, (_, h) => {
              const entry = peakHours.find((p) => p.hour === h);
              const count = entry?.count ?? 0;
              const intensity = maxPeak > 0 ? count / maxPeak : 0;
              const opacity = Math.max(intensity, 0.08);
              return (
                <div
                  key={h}
                  className="flex flex-col items-center gap-0.5"
                  title={`${h}:00 — ${count} actions`}
                >
                  <div
                    className="w-full aspect-square rounded-lg transition-colors"
                    style={{
                      backgroundColor: `rgba(123, 77, 255, ${opacity})`,
                    }}
                  />
                  <span className="text-[9px] text-slate-400">{h}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dormant Users */}
      {data.dormant_users?.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Dormant Users (&gt;30 days inactive)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {data.dormant_users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 dark:border-white/5"
                  >
                    <td className="py-2 text-slate-800 dark:text-white">
                      {u.name}
                    </td>
                    <td className="py-2 text-slate-500 dark:text-slate-400">
                      {u.email}
                    </td>
                    <td className="py-2 text-slate-500 dark:text-slate-400 capitalize">
                      {u.role?.replace("_", " ")}
                    </td>
                    <td className="py-2 text-right text-slate-400">
                      {u.last_active
                        ? formatDateTime(u.last_active)
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────── tab: Export Center ── */

function ExportTab() {
  const [type, setType] = useState("users");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleExport = useCallback(async () => {
    setBusy(true);
    setMsg("");
    try {
      const params = new URLSearchParams({ type, format });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const url = `/api/admin/export?${params}`;

      if (format === "json") {
        const res = await api.get(url);
        const blob = new Blob([JSON.stringify(res, null, 2)], {
          type: "application/json",
        });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        // CSV — fetch as text via raw fetch with credentials
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Export failed");
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }

      setMsg("Export downloaded successfully.");
    } catch {
      setMsg("Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [type, format, from, to]);

  return (
    <div className="max-w-xl space-y-6">
      <div className={`${card} p-6 space-y-5`}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
          Export System Data
        </h3>

        {/* Data type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Data Type
          </label>
          <select
            className={field}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {EXPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Format
          </label>
          <div className="flex gap-3">
            {(["csv", "json"] as const).map((f) => (
              <label
                key={f}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="accent-[#7B4DFF]"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 uppercase">
                  {f}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              From (optional)
            </label>
            <input
              type="date"
              className={field + " w-full"}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              To (optional)
            </label>
            <input
              type="date"
              className={field + " w-full"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <button className={btn} onClick={handleExport} disabled={busy}>
          {busy ? "Exporting…" : "Export"}
        </button>

        {msg && (
          <p
            className={`text-xs ${
              msg.includes("failed")
                ? "text-red-500"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────── main page ── */

export default function SystemPage() {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageTitle
        title="System Health & Data"
        subtitle="Server information, health checks, storage and data exports"
      />

      <SystemAdminTabs />

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-white/10 pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-colors ${
              tab === t.key
                ? "bg-[#7B4DFF] text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && <SystemInfoTab />}
      {tab === "health" && <HealthTab />}
      {tab === "storage" && <StorageTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "export" && <ExportTab />}
    </div>
  );
}
