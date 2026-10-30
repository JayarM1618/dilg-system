"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useBarangays } from "@/hooks/useBarangays";
import { ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";
import { ROLE_INFO } from "@/lib/roles";
import type { Role, User } from "@/types";

type Filter = "all" | "pending" | "active" | "pending_verification" | "rejected" | "deactivated";
type Issued = { user: User; activation_link: string; emailed: boolean; email_error?: string | null };

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_verification", label: "Awaiting Activation" },
  { value: "pending", label: "Waiting for user" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "deactivated", label: "Deactivated" },
];

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-ok dark:bg-emerald-500/20 dark:text-emerald-300" },
  pending: { label: "Waiting to activate", cls: "bg-[#FFF8E6] text-[#7A5B00] dark:bg-amber-400/15 dark:text-amber-200" },
  pending_verification: { label: "Awaiting Activation", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  deactivated: { label: "Deactivated", cls: "bg-bad-bg text-bad dark:bg-rose-500/20 dark:text-rose-300" },
};

function maskContactNumber(num?: string | null): string {
  if (!num) return "—";
  const s = num.trim();
  if (s.length <= 4) return "****";
  const start = s.slice(0, 4);
  const end = s.slice(-3);
  return `${start}****${end}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return "****";
  if (user.length <= 3) return `${user[0]}****@${domain}`;
  const start = user.slice(0, 3);
  const end = user.slice(-2);
  return `${start}****${end}@${domain}`;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";
const field =
  "mt-1.5 w-full rounded-xl bg-white dark:bg-[#1E293B] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none ring-1 ring-[#CBD5E1] dark:ring-[#334155] placeholder:text-slate-400 focus:ring-2 focus:ring-[#0039A6]";

export default function AccountsPage() {
  const { user: currentUser } = useAuth();
  const { data, loading, error, retry } = useApi<{ data: User[] }>(currentUser ? "/api/users" : null);
  const { barangays } = useBarangays();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Photo & verification modals (Account File)
  const [photoUser, setPhotoUser] = useState<User | null>(null);
  const [revealDetails, setRevealDetails] = useState(false);
  const [rejectUser, setRejectUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  // Permanent Delete Modal
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("barangay_rep");
  const [barangayId, setBarangayId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const users = useMemo(() => data?.data ?? [], [data]);
  const withoutAccount = useMemo(() => {
    const taken = new Set(users.filter((u) => u.role === "barangay_rep" && u.is_active).map((u) => u.barangay_id));
    return barangays.filter((b) => !taken.has(b.id)).length;
  }, [users, barangays]);

  const pendingVerificationCount = useMemo(() => users.filter((u) => u.status === "pending_verification").length, [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.status !== filter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.barangay?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await apiSend<Issued>("/api/users", "POST", {
        name: name.trim(),
        email: email.trim(),
        role,
        barangay_id: role === "barangay_rep" ? Number(barangayId) || null : null,
      });
      setIssued(res);
      setName("");
      setEmail("");
      setBarangayId("");
      setShowForm(false);
      retry();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setSaving(false);
    }
  }

  async function run(u: User, fn: () => Promise<unknown>, after?: (r: unknown) => void) {
    setActionError(null);
    setBusyId(u.id);
    try {
      const r = await fn();
      after?.(r);
      retry();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "That did not work. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const sendLink = (u: User) =>
    run(u, () => apiSend<Issued>(`/api/users/${u.id}/invite`, "POST"), (r) => {
      setIssued(r as Issued);
      setCopied(false);
    });

  const toggleActive = (u: User) => run(u, () => apiSend(`/api/users/${u.id}`, "PATCH", { is_active: !u.is_active }));

  const verifyUser = (u: User) =>
    run(u, () => apiSend(`/api/users/${u.id}/verify`, "POST"), () => {
      setActionSuccess(`Account ${u.name} successfully activated.`);
      setPhotoUser(null);
    });

  async function rejectSubmit() {
    if (!rejectUser) return;
    setRejectBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/users/${rejectUser.id}/reject`, "POST", { reason: rejectReason.trim() || null });
      setRejectUser(null);
      setRejectReason("");
      retry();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Rejection failed.");
    } finally {
      setRejectBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleteBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiSend<{ message: string }>(`/api/users/${deleteUser.id}`, "DELETE");
      setActionSuccess(res?.message ?? `Account ${deleteUser.name} was permanently deleted from the database.`);
      setDeleteUser(null);
      retry();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to delete account.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900 dark:text-white sm:text-3xl">Accounts</h1>
          <p className="mt-1 max-w-[60ch] text-sm text-muted dark:text-slate-400 sm:text-base">
            DILG issues every account. Add the email, and the owner only opens the activation link to choose a password.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className={`rounded-full bg-[#0039A6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002B7F] ${focusRing}`}
        >
          {showForm ? "Close" : "Issue a new account"}
        </button>
      </div>

      {/* Pending activation alert */}
      {!loading && pendingVerificationCount > 0 && (
        <div className="mt-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 px-4 py-3 flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
              {pendingVerificationCount} account{pendingVerificationCount > 1 ? "s" : ""} awaiting super admin activation
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              User completed their activation form and selfie. Review their Account File and activate their account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilter("pending_verification")}
            className={`rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 ${focusRing}`}
          >
            Review & Activate
          </button>
        </div>
      )}

      <section className="mt-5 grid gap-3 md:grid-cols-3" aria-label="What each role can do">
        {(["barangay_rep", "office_supervisor", "super_admin"] as Role[]).map((r) => (
          <div key={r} className="rounded-2xl bg-white p-4 ring-1 ring-[#CBD5E1] dark:bg-[#1B1430] dark:ring-white/10">
            <p className="text-sm font-bold text-[#1B1235] dark:text-white">{ROLE_INFO[r].label}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{ROLE_INFO[r].description}</p>
          </div>
        ))}
      </section>

      {!loading && barangays.length > 0 && withoutAccount > 0 && (
        <p className="mt-4 rounded-2xl bg-[#FFF8E6] px-4 py-3 text-sm text-[#7A5B00] dark:bg-amber-400/10 dark:text-amber-200">
          {withoutAccount} of {barangays.length} barangays do not have an active representative account yet.
        </p>
      )}

      {issued && (
        <section className="mt-4 rounded-3xl bg-[#E6FBF3] p-5 dark:bg-emerald-400/10" aria-live="polite">
          <h2 className="font-medium text-[#0E2B24] dark:text-emerald-100">
            Activation link for {issued.user.name} ({issued.user.email})
          </h2>
          <p className="mt-1 text-sm text-[#2C5A4D] dark:text-emerald-200/80">
            {issued.emailed
              ? "It was emailed to them. You can also share it yourself. It works once and expires in 7 days."
              : issued.email_error
              ? `Email delivery failed: ${issued.email_error}. You can copy and send this link to them manually.`
              : "Email delivery is not set up on this server, so send this link to them yourself. It works once and expires in 7 days."}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={issued.activation_link} onFocus={(e) => e.currentTarget.select()} aria-label="Activation link" className="min-w-0 flex-1 rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-800 ring-1 ring-[#BDF3DE] dark:bg-[#1E293B] dark:text-slate-100 dark:ring-white/10" />
            <button type="button" onClick={() => void copy(issued.activation_link)} className={`rounded-full bg-[#0B6B52] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#095742] ${focusRing}`}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={() => setIssued(null)} className={`rounded-full px-4 py-2.5 text-sm font-medium text-[#0B6B52] dark:text-emerald-200 ${focusRing}`}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <form onSubmit={create} className="mt-4 grid gap-4 rounded-3xl bg-[#EBF2FF] p-5 dark:bg-white/5 sm:grid-cols-2" aria-label="Issue a new account">
          <label className="block text-sm font-medium text-[#1B1235] dark:text-slate-200">
            Full name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" className={field} />
          </label>
          <label className="block text-sm font-medium text-[#1B1235] dark:text-slate-200">
            Email (this becomes their sign-in)
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={field} />
          </label>
          <label className="block text-sm font-medium text-[#1B1235] dark:text-slate-200">
            Account type
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={field}>
              <option value="barangay_rep">{ROLE_INFO.barangay_rep.label}</option>
              <option value="office_supervisor">{ROLE_INFO.office_supervisor.label}</option>
              <option value="super_admin">{ROLE_INFO.super_admin.label}</option>
            </select>
          </label>
          {role === "barangay_rep" && (
            <label className="block text-sm font-medium text-[#1B1235] dark:text-slate-200">
              Barangay
              <select required value={barangayId} onChange={(e) => setBarangayId(e.target.value)} className={field}>
                <option value="">Choose a barangay</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          )}
          {formError && <p role="alert" className="text-sm font-medium text-bad dark:text-rose-400 sm:col-span-2">{formError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={`rounded-full bg-[#0039A6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002B7F] disabled:opacity-60 ${focusRing}`}>
              {saving ? "Creating..." : "Create and send activation link"}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search accounts"
            placeholder="Search name, email or barangay"
            className="w-full rounded-md border border-line bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0039A6] focus:ring-2 focus:ring-[#0039A6]/25 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-80"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
                  filter === f.value
                    ? "border-[#0039A6] bg-[#002B7F] text-white dark:bg-[#0039A6]"
                    : "border-line bg-white text-navy-800 hover:bg-navy-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {f.label}
                {f.value === "pending_verification" && pendingVerificationCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{pendingVerificationCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {actionError && <p role="alert" className="mt-4 text-sm font-medium text-bad dark:text-rose-400">{actionError}</p>}
      {actionSuccess && (
        <div role="status" className="mt-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-[920px] text-left text-sm">
          <caption className="sr-only">Accounts</caption>
          <thead className="bg-navy-50 text-navy-800 dark:bg-white/5 dark:text-[#93C5FD]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Email</th>
              <th scope="col" className="px-4 py-3 font-semibold">Type</th>
              <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted dark:text-slate-400">Loading accounts...</td></tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="font-medium text-bad dark:text-rose-400">{error}</p>
                  <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 underline underline-offset-4 dark:text-slate-300">Try again</button>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted dark:text-slate-400">{users.length === 0 ? "No accounts yet." : "No accounts match."}</td></tr>
            ) : (
              visible.map((u) => {
                const st = STATUS_STYLE[u.status ?? (u.is_active ? "active" : "deactivated")] ?? STATUS_STYLE.deactivated;
                const busy = busyId === u.id;
                const isPV = u.status === "pending_verification";
                const isRej = u.status === "rejected";
                return (
                  <tr key={u.id} className={isPV ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-navy-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {/* Profile photo thumbnail or placeholder */}
                        {u.profile_photo_url ? (
                          <button
                            type="button"
                            onClick={() => { setPhotoUser(u); setRevealDetails(false); }}
                            className={`shrink-0 h-9 w-9 rounded-full overflow-hidden ring-2 ${isPV ? "ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 animate-pulse" : isRej ? "ring-rose-300 dark:ring-rose-600" : "ring-emerald-300 dark:ring-emerald-600"} cursor-pointer hover:ring-[#0039A6] transition-all`}
                            title="Click to view Account File"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u.profile_photo_url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setPhotoUser(u); setRevealDetails(false); }}
                            className="shrink-0 grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-[#0039A6] hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                            title="Click to view Account File"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setPhotoUser(u); setRevealDetails(false); }}
                          className="text-left group/u"
                          title="Click to view Account File"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white group-hover/u:text-[#0039A6] transition-colors">
                            {u.name}
                          </span>
                          {u.first_name && u.last_name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">{u.first_name} {u.last_name}</p>
                          )}
                        </button>
                      </div>
                    </th>
                    <td className="px-4 py-3.5 text-muted dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">{ROLE_INFO[u.role]?.tag ?? u.role}</td>
                    <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">{u.barangay?.name ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPV ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void verifyUser(u)}
                              className={`rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1 text-xs font-bold text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1 transition-all ${focusRing}`}
                              title="Activate account immediately"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Activate
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => { setPhotoUser(u); setRevealDetails(false); }}
                              className={`rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-900/20 inline-flex items-center gap-1 ${focusRing}`}
                              title="Open full Account File"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              Account File
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => { setRejectUser(u); setRejectReason(""); }}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-900/20 ${focusRing}`}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => { setPhotoUser(u); setRevealDetails(false); }}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10 inline-flex items-center gap-1 ${focusRing}`}
                              title="View official account file"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              Account File
                            </button>
                            <button type="button" disabled={busy} onClick={() => void sendLink(u)} className={`rounded-full px-3 py-1 text-xs font-semibold text-[#002B7F] hover:bg-[#EBF2FF] disabled:opacity-50 dark:text-[#93C5FD] dark:hover:bg-white/10 ${focusRing}`}>
                              {u.status === "pending" ? "New link" : "Reset access"}
                            </button>
                            <button type="button" disabled={busy} onClick={() => void toggleActive(u)} className={`rounded-full px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10 ${u.is_active ? "text-bad dark:text-rose-300" : "text-ok dark:text-emerald-300"} ${focusRing}`}>
                              {u.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                          </>
                        )}
                        {currentUser?.id !== u.id && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => { setDeleteUser(u); setActionError(null); setActionSuccess(null); }}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 ${focusRing}`}
                            title="Delete directly from database"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && users.length > 0 && (
        <p className="mt-3 text-sm text-muted dark:text-slate-400">
          Showing {visible.length} of {users.length} {users.length === 1 ? "account" : "accounts"}.
        </p>
      )}

      {/* ── Official Account File & Activation Modal ── */}
      {photoUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setPhotoUser(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#150F24] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header banner */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0039A6]/15 text-[#0039A6] dark:text-[#93C5FD]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Account File
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official registration & verification dossier</p>
                </div>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${(STATUS_STYLE[photoUser.status ?? ""] ?? STATUS_STYLE.active).cls}`}>
                {(STATUS_STYLE[photoUser.status ?? ""] ?? STATUS_STYLE.active).label}
              </span>
            </div>

            {/* Profile Photo / Selfie Preview */}
            {photoUser.profile_photo_url ? (
              <div className="relative bg-slate-950 flex items-center justify-center py-5 px-6 border-b border-slate-100 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUser.profile_photo_url}
                  alt={`${photoUser.name}'s photo`}
                  className="max-h-64 w-auto max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
                />
                <span className="absolute bottom-4 right-6 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white flex items-center gap-1.5 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Selfie Photo Submitted
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-white/[0.02] text-slate-400 border-b border-slate-100 dark:border-white/10">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-200/70 dark:bg-white/10 mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="text-xs font-medium">No selfie photo uploaded</p>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{photoUser.name}</h4>
                  <p className="text-xs font-semibold text-[#0039A6] dark:text-[#93C5FD]">
                    {ROLE_INFO[photoUser.role]?.tag ?? photoUser.role} &bull; {photoUser.barangay?.name ?? "Makati DILG"}
                  </p>
                </div>

                {/* Confidential data masking toggle */}
                <button
                  type="button"
                  onClick={() => setRevealDetails((v) => !v)}
                  className="shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                  title={revealDetails ? "Mask confidential info with ****" : "Reveal full confidential info"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {revealDetails ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                  <span>{revealDetails ? "Mask (****)" : "Show details"}</span>
                </button>
              </div>

              {/* Data Grid with requested **** masking */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/60 dark:border-white/5">
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Position / Designation</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{photoUser.position || "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/60 dark:border-white/5">
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Assigned Barangay</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{photoUser.barangay?.name || "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/60 dark:border-white/5">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Contact Number</span>
                    {!revealDetails && <span className="text-[10px] text-slate-400 font-mono">(masked ****)</span>}
                  </p>
                  <p className="mt-0.5 text-sm font-mono font-medium text-slate-900 dark:text-white">
                    {revealDetails ? (photoUser.contact_number || "—") : maskContactNumber(photoUser.contact_number)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/60 dark:border-white/5">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Email Address</span>
                    {!revealDetails && <span className="text-[10px] text-slate-400 font-mono">(masked ****)</span>}
                  </p>
                  <p className="mt-0.5 text-sm font-mono font-medium text-slate-900 dark:text-white truncate" title={photoUser.email}>
                    {revealDetails ? photoUser.email : maskEmail(photoUser.email)}
                  </p>
                </div>
              </div>

              {/* Activation & Terms Timestamps */}
              <div className="mt-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 p-3 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                {photoUser.terms_accepted_at && (
                  <p className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Terms & Conditions accepted on: <strong>{new Date(photoUser.terms_accepted_at).toLocaleString()}</strong></span>
                  </p>
                )}
                {photoUser.activated_at && (
                  <p className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Activation form submitted on: <strong>{new Date(photoUser.activated_at).toLocaleString()}</strong></span>
                  </p>
                )}
                {photoUser.verified_at && photoUser.verifier && (
                  <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Activated by <strong>{photoUser.verifier.name}</strong> on {new Date(photoUser.verified_at).toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Rejection Reason if any */}
              {photoUser.status === "rejected" && photoUser.rejection_reason && (
                <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                  <p className="font-bold">Rejection Reason</p>
                  <p className="mt-0.5">{photoUser.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-3">
                {photoUser.status === "pending_verification" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === photoUser.id}
                      onClick={() => void verifyUser(photoUser)}
                      className={`flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2 ${focusRing}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {busyId === photoUser.id ? "Activating..." : "Activate Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectUser(photoUser); setRejectReason(""); setPhotoUser(null); }}
                      className={`rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-5 py-3 text-sm font-semibold transition-colors ${focusRing}`}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUser(null)}
                      className={`rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors ${focusRing}`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhotoUser(null)}
                    className={`flex-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors ${focusRing}`}
                  >
                    Close Account File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRejectUser(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject Account</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Rejecting <strong>{rejectUser.name}</strong> ({rejectUser.email}). Optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional, visible to the user)"
              rows={3}
              className="mt-4 w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-rose-400"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={rejectBusy}
                onClick={() => void rejectSubmit()}
                className={`flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 ${focusRing}`}
              >
                {rejectBusy ? "Rejecting..." : "Confirm Rejection"}
              </button>
              <button
                type="button"
                onClick={() => setRejectUser(null)}
                className={`flex-1 rounded-full bg-slate-100 dark:bg-white/10 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 ${focusRing}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permanent Delete Modal ── */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !deleteBusy && setDeleteUser(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-rose-200 dark:border-rose-900/40 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account Directly</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Permanent Database Deletion</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteUser.name}</strong> (<span className="text-slate-700 dark:text-slate-200 font-mono text-xs">{deleteUser.email}</span>)?
            </p>
            <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-3 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              <strong>Warning:</strong> This will directly and permanently remove this user record from the database. Their access credentials, sessions, and uploaded photo will be destroyed. This action cannot be undone.
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDelete()}
                className={`flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors ${focusRing}`}
              >
                {deleteBusy ? "Deleting from database..." : "Delete from Database"}
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteUser(null)}
                className={`flex-1 rounded-full bg-slate-100 dark:bg-white/10 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 disabled:opacity-50 transition-colors ${focusRing}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
