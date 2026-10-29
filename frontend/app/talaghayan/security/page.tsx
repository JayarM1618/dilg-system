"use client";

import { useState, useCallback } from "react";
import { ConfirmProvider, useConfirm } from "@/components/ConfirmModal";
import SystemAdminTabs from "@/components/SystemAdminTabs";
import { btn, btnGhost, field, PageTitle, Pager, formatDateTime } from "@/components/threers/ui";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { LoginAttempt, IpBlock, SessionInfo, Paginated } from "@/types";

/* ───────── constants ───────── */

const TABS = ["Login History", "Failed Attempts", "Suspicious Activity", "IP Blocking", "Sessions"] as const;
type Tab = (typeof TABS)[number];

const pill = (active: boolean) =>
  `px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors select-none ${
    active
      ? "bg-[#7B4DFF] text-white shadow-sm"
      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
  }`;

const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1F1733] shadow-sm";

const thClass = "px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
const tdClass = "px-3 py-2.5 text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-white/5";

/* ───────── page ───────── */

export default function SecurityPage() {
  return (
    <ConfirmProvider>
      <SecurityContent />
    </ConfirmProvider>
  );
}

function SecurityContent() {
  const [tab, setTab] = useState<Tab>("Login History");

  return (
    <div className="space-y-6">
      <PageTitle
        title="Security & Access Control"
        subtitle="Security event monitoring, failed login tracking, IP blocking, and active sessions"
      />

      <SystemAdminTabs />

      {/* ── Tab pills ── */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t} className={pill(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Login History" && <LoginHistoryTab />}
      {tab === "Failed Attempts" && <FailedAttemptsTab />}
      {tab === "Suspicious Activity" && <SuspiciousTab />}
      {tab === "IP Blocking" && <IpBlockingTab />}
      {tab === "Sessions" && <SessionsTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   1. Login History
   ═══════════════════════════════════════════ */

function LoginHistoryTab() {
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState<"" | "true" | "false">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams({ per_page: "25", page: String(page) });
  if (email) params.set("email", email);
  if (ip) params.set("ip", ip);
  if (status) params.set("successful", status);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const { data, isLoading } = useApi<Paginated<LoginAttempt>>(`/api/admin/security/login-history?${params}`);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`${card} p-4`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input className={field} placeholder="Filter email…" value={email} onChange={(e) => { setEmail(e.target.value); setPage(1); }} />
          <input className={field} placeholder="Filter IP…" value={ip} onChange={(e) => { setIp(e.target.value); setPage(1); }} />
          <select className={field} value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
          <input className={field} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <input className={field} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          <button className={btnGhost} onClick={() => { setEmail(""); setIp(""); setStatus(""); setFrom(""); setTo(""); setPage(1); }}>
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${card} overflow-x-auto`}>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.data?.length ? (
          <p className="p-6 text-sm text-slate-400">No login attempts found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thClass}>Email</th>
                <th className={thClass}>IP</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Reason</th>
                <th className={thClass}>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className={tdClass}>{a.email}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{a.ip_address}</td>
                  <td className={tdClass}>
                    {a.successful ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">✓ Success</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">✗ Failed</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-xs text-slate-500 dark:text-slate-400`}>{a.failure_reason ?? "—"}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(a.attempted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.last_page > 1 && (
        <Pager page={data.current_page} lastPage={data.last_page} onPage={setPage} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. Failed Attempts
   ═══════════════════════════════════════════ */

interface FailedData {
  period_minutes: number;
  total_failed: number;
  by_ip: { ip_address: string; attempts: number; last_attempt: string }[];
  by_email: { email: string; attempts: number; last_attempt: string }[];
}

function FailedAttemptsTab() {
  const [minutes, setMinutes] = useState(60);
  const { data, isLoading } = useApi<FailedData>(`/api/admin/security/failed-attempts?minutes=${minutes}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 dark:text-slate-400">Time window:</span>
        <select className={field} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
          {[15, 30, 60, 120, 360].map((m) => (
            <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : !data ? null : (
        <>
          {/* Summary */}
          <div className={`${card} p-5`}>
            <p className="text-3xl font-bold text-red-500 dark:text-red-400">{data.total_failed}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">failed attempts in the last {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? "s" : ""}`}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* By IP */}
            <div className={`${card} overflow-x-auto`}>
              <h3 className="px-4 pt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">By IP Address</h3>
              {!data.by_ip.length ? (
                <p className="p-4 text-xs text-slate-400">None</p>
              ) : (
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr>
                      <th className={thClass}>IP</th>
                      <th className={thClass}>Attempts</th>
                      <th className={thClass}>Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_ip.map((r) => (
                      <tr key={r.ip_address}>
                        <td className={`${tdClass} font-mono text-xs`}>{r.ip_address}</td>
                        <td className={tdClass}>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.attempts >= 10 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                            {r.attempts}
                          </span>
                        </td>
                        <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.last_attempt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* By Email */}
            <div className={`${card} overflow-x-auto`}>
              <h3 className="px-4 pt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">By Email</h3>
              {!data.by_email.length ? (
                <p className="p-4 text-xs text-slate-400">None</p>
              ) : (
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr>
                      <th className={thClass}>Email</th>
                      <th className={thClass}>Attempts</th>
                      <th className={thClass}>Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_email.map((r) => (
                      <tr key={r.email}>
                        <td className={tdClass}>{r.email}</td>
                        <td className={tdClass}>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.attempts >= 10 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                            {r.attempts}
                          </span>
                        </td>
                        <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.last_attempt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. Suspicious Activity
   ═══════════════════════════════════════════ */

interface SuspiciousData {
  period_hours: number;
  multi_ip_accounts: { user_id: number; ip_count: number; user?: { id: number; name: string; email: string } }[];
  brute_force_ips: { ip_address: string; attempts: number; targeted_accounts: number }[];
  off_hours_logins: LoginAttempt[];
  multi_ip_count: number;
  brute_force_count: number;
  off_hours_count: number;
}

function SuspiciousTab() {
  const [hours, setHours] = useState(24);
  const { data, isLoading } = useApi<SuspiciousData>(`/api/admin/security/suspicious?hours=${hours}`);

  const alertCard = (color: string) =>
    `rounded-2xl border p-5 shadow-sm ${
      color === "red"
        ? "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20"
        : color === "amber"
        ? "border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20"
        : "border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 dark:text-slate-400">Time window:</span>
        <select className={field} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
          {[6, 12, 24, 48, 72].map((h) => (
            <option key={h} value={h}>{h} hours</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Multi-IP Accounts */}
          <div className={alertCard("amber")}>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="text-base">⚠</span> Multi-IP Accounts
              <span className="ml-auto text-xs font-normal text-amber-600 dark:text-amber-400">{data.multi_ip_count} flagged</span>
            </h3>
            {!data.multi_ip_accounts.length ? (
              <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/70">No accounts accessed from multiple IPs in this window.</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-amber-700 dark:text-amber-300 pb-1">User</th>
                    <th className="text-left text-xs font-semibold text-amber-700 dark:text-amber-300 pb-1">Distinct IPs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.multi_ip_accounts.map((r) => (
                    <tr key={r.user_id}>
                      <td className="py-1 text-amber-900 dark:text-amber-200">{r.user?.name ?? `User #${r.user_id}`} <span className="text-xs text-amber-600 dark:text-amber-400">({r.user?.email})</span></td>
                      <td className="py-1 font-mono font-semibold text-amber-800 dark:text-amber-200">{r.ip_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Brute Force IPs */}
          <div className={alertCard("red")}>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
              <span className="text-base">🛑</span> Brute Force IPs
              <span className="ml-auto text-xs font-normal text-red-600 dark:text-red-400">{data.brute_force_count} flagged</span>
            </h3>
            {!data.brute_force_ips.length ? (
              <p className="mt-2 text-xs text-red-600/80 dark:text-red-400/70">No brute force patterns detected.</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-red-700 dark:text-red-300 pb-1">IP</th>
                    <th className="text-left text-xs font-semibold text-red-700 dark:text-red-300 pb-1">Attempts</th>
                    <th className="text-left text-xs font-semibold text-red-700 dark:text-red-300 pb-1">Targeted Accounts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.brute_force_ips.map((r) => (
                    <tr key={r.ip_address}>
                      <td className="py-1 font-mono text-xs text-red-900 dark:text-red-200">{r.ip_address}</td>
                      <td className="py-1 font-semibold text-red-800 dark:text-red-200">{r.attempts}</td>
                      <td className="py-1 text-red-700 dark:text-red-300">{r.targeted_accounts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Off-Hours Logins */}
          <div className={alertCard("blue")}>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <span className="text-base">🌙</span> Off-Hours Logins
              <span className="ml-auto text-xs font-normal text-blue-600 dark:text-blue-400">{data.off_hours_count} found</span>
            </h3>
            {!data.off_hours_logins.length ? (
              <p className="mt-2 text-xs text-blue-600/80 dark:text-blue-400/70">No off-hours logins detected.</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-blue-700 dark:text-blue-300 pb-1">User</th>
                    <th className="text-left text-xs font-semibold text-blue-700 dark:text-blue-300 pb-1">IP</th>
                    <th className="text-left text-xs font-semibold text-blue-700 dark:text-blue-300 pb-1">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.off_hours_logins.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1 text-blue-900 dark:text-blue-200">{r.user?.name ?? r.email}</td>
                      <td className="py-1 font-mono text-xs text-blue-800 dark:text-blue-300">{r.ip_address}</td>
                      <td className="py-1 whitespace-nowrap text-blue-700 dark:text-blue-300">{formatDateTime(r.attempted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   4. IP Blocking
   ═══════════════════════════════════════════ */

function IpBlockingTab() {
  const [statusFilter, setStatusFilter] = useState<"active" | "expired" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [formIp, setFormIp] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formExpires, setFormExpires] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  const { data, isLoading, mutate } = useApi<Paginated<IpBlock>>(`/api/admin/ip-blocks?status=${statusFilter}`);

  const handleBlock = useCallback(async () => {
    if (!formIp) return;
    setSaving(true);
    try {
      await api.post("/api/admin/ip-blocks", {
        ip_address: formIp,
        reason: formReason || undefined,
        expires_at: formExpires || undefined,
      });
      setFormIp("");
      setFormReason("");
      setFormExpires("");
      setShowForm(false);
      mutate();
    } catch (e: any) {
      alert(e?.message ?? "Failed to block IP");
    } finally {
      setSaving(false);
    }
  }, [formIp, formReason, formExpires, mutate]);

  const handleUnblock = useCallback(async (block: IpBlock) => {
    const yes = await confirm({
      title: "Unblock IP address?",
      message: `Remove block on ${block.ip_address}?`,
      confirmLabel: "Unblock",
    });
    if (!yes) return;
    try {
      await api.delete(`/api/admin/ip-blocks/${block.id}`);
      mutate();
    } catch (e: any) {
      alert(e?.message ?? "Failed to unblock");
    }
  }, [confirm, mutate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter pills */}
        {(["active", "expired", "all"] as const).map((s) => (
          <button key={s} className={pill(statusFilter === s)} onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="ml-auto">
          <button className={btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Block IP"}
          </button>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className={`${card} p-4`}>
          <div className="grid sm:grid-cols-4 gap-3">
            <input className={field} placeholder="IP address" value={formIp} onChange={(e) => setFormIp(e.target.value)} />
            <input className={field} placeholder="Reason (optional)" value={formReason} onChange={(e) => setFormReason(e.target.value)} />
            <input className={field} type="datetime-local" value={formExpires} onChange={(e) => setFormExpires(e.target.value)} title="Expires at (optional)" />
            <button className={btn} disabled={!formIp || saving} onClick={handleBlock}>
              {saving ? "Blocking…" : "Block"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`${card} overflow-x-auto`}>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.data?.length ? (
          <p className="p-6 text-sm text-slate-400">No IP blocks found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thClass}>IP Address</th>
                <th className={thClass}>Reason</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Blocked At</th>
                <th className={thClass}>Expires</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className={`${tdClass} font-mono text-xs`}>{b.ip_address}</td>
                  <td className={`${tdClass} text-xs max-w-[200px] truncate`}>{b.reason ?? "—"}</td>
                  <td className={tdClass}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      b.type === "auto"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    }`}>
                      {b.type}
                    </span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(b.blocked_at)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{b.expires_at ? formatDateTime(b.expires_at) : "Never"}</td>
                  <td className={tdClass}>
                    {b.is_active && (
                      <button className={`${btnGhost} !py-1 !px-2 !text-xs text-red-600 dark:text-red-400`} onClick={() => handleUnblock(b)}>
                        Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   5. Sessions
   ═══════════════════════════════════════════ */

function SessionsTab() {
  const confirm = useConfirm();
  const { data, isLoading, mutate } = useApi<{ data: SessionInfo[]; total: number }>("/api/admin/sessions");

  const handleForceLogout = useCallback(async (s: SessionInfo) => {
    const yes = await confirm({
      title: "Force logout?",
      message: `Terminate ${s.type} session for ${s.user_name} (${s.user_email})?`,
      confirmLabel: "Force Logout",
    });
    if (!yes) return;
    try {
      await api.delete(`/api/admin/sessions/${s.id}?type=${s.type}`);
      mutate();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    }
  }, [confirm, mutate]);

  const handleForceLogoutAll = useCallback(async (userId: number, name: string) => {
    const yes = await confirm({
      title: "Force logout ALL sessions?",
      message: `Terminate every active session for ${name}? They will be signed out immediately.`,
      confirmLabel: "Logout All",
    });
    if (!yes) return;
    try {
      await api.post("/api/admin/sessions/force-logout-all", { user_id: userId });
      mutate();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    }
  }, [confirm, mutate]);

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      office_supervisor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      barangay_rep: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    };
    return colors[role] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";
  };

  return (
    <div className="space-y-4">
      <div className={`${card} p-4`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data ? `${data.total} active session${data.total !== 1 ? "s" : ""}` : "Loading…"}
        </p>
      </div>

      <div className={`${card} overflow-x-auto`}>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.data?.length ? (
          <p className="p-6 text-sm text-slate-400">No active sessions.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>IP / Agent</th>
                <th className={thClass}>Last Active</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((s, i) => (
                <tr key={`${s.type}-${s.id}-${i}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className={tdClass}>
                    <div className="font-medium">{s.user_name}</div>
                    <div className="text-xs text-slate-400">{s.user_email}</div>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge(s.user_role)}`}>
                      {s.user_role?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.type === "session"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    }`}>
                      {s.type}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {s.ip_address && <div className="font-mono text-xs">{s.ip_address}</div>}
                    {s.user_agent && <div className="text-xs text-slate-400 truncate max-w-[200px]" title={s.user_agent}>{s.user_agent}</div>}
                    {s.token_name && <div className="text-xs text-slate-400">Token: {s.token_name}</div>}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(s.last_activity)}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1.5">
                      <button className={`${btnGhost} !py-1 !px-2 !text-xs text-red-600 dark:text-red-400`} onClick={() => handleForceLogout(s)}>
                        Logout
                      </button>
                      <button className={`${btnGhost} !py-1 !px-2 !text-xs text-red-600 dark:text-red-400`} onClick={() => handleForceLogoutAll(s.user_id, s.user_name)} title="Force logout all sessions for this user">
                        All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
