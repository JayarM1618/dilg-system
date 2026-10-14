"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import { useBarangays } from "@/hooks/useBarangays";
import { ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";
import { ROLE_INFO } from "@/lib/roles";
import type { Role, User } from "@/types";

type Filter = "all" | "pending" | "active" | "deactivated";
type Issued = { user: User; activation_link: string; emailed: boolean; email_error?: string | null };

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Waiting to activate" },
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
];

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-ok dark:bg-emerald-500/20 dark:text-emerald-300" },
  pending: { label: "Waiting to activate", cls: "bg-[#FFF8E6] text-[#7A5B00] dark:bg-amber-400/15 dark:text-amber-200" },
  deactivated: { label: "Deactivated", cls: "bg-bad-bg text-bad dark:bg-rose-500/20 dark:text-rose-300" },
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";
const field =
  "mt-1.5 w-full rounded-xl bg-white dark:bg-[#2B2542] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none ring-1 ring-[#E3DEF5] dark:ring-[#433A66] placeholder:text-slate-400 focus:ring-2 focus:ring-[#7B4DFF]";

export default function AccountsPage() {
  const { data, loading, error, retry } = useApi<{ data: User[] }>("/api/users");
  const { barangays } = useBarangays();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
          className={`rounded-full bg-[#7B4DFF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5A18C9] ${focusRing}`}
        >
          {showForm ? "Close" : "Issue a new account"}
        </button>
      </div>

      <section className="mt-5 grid gap-3 md:grid-cols-3" aria-label="What each role can do">
        {(["barangay_rep", "office_supervisor", "super_admin"] as Role[]).map((r) => (
          <div key={r} className="rounded-2xl bg-white p-4 ring-1 ring-[#E3DEF5] dark:bg-[#1B1430] dark:ring-white/10">
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
            <input readOnly value={issued.activation_link} onFocus={(e) => e.currentTarget.select()} aria-label="Activation link" className="min-w-0 flex-1 rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-800 ring-1 ring-[#BDF3DE] dark:bg-[#2B2542] dark:text-slate-100 dark:ring-white/10" />
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
        <form onSubmit={create} className="mt-4 grid gap-4 rounded-3xl bg-[#F3EDFE] p-5 dark:bg-white/5 sm:grid-cols-2" aria-label="Issue a new account">
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
            <button type="submit" disabled={saving} className={`rounded-full bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5A18C9] disabled:opacity-60 ${focusRing}`}>
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
            className="w-full rounded-md border border-line bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/25 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-80"
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
                    ? "border-[#7B4DFF] bg-[#5A18C9] text-white dark:bg-[#7B4DFF]"
                    : "border-line bg-white text-navy-800 hover:bg-navy-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {actionError && <p role="alert" className="mt-4 text-sm font-medium text-bad dark:text-rose-400">{actionError}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-[820px] text-left text-sm">
          <caption className="sr-only">Accounts</caption>
          <thead className="bg-navy-50 text-navy-800 dark:bg-white/5 dark:text-[#D1C4F9]">
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
                const st = STATUS_STYLE[u.status ?? (u.is_active ? "active" : "deactivated")];
                const busy = busyId === u.id;
                return (
                  <tr key={u.id}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-navy-900 dark:text-white">{u.name}</th>
                    <td className="px-4 py-3.5 text-muted dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">{ROLE_INFO[u.role]?.tag ?? u.role}</td>
                    <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200">{u.barangay?.name ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button type="button" disabled={busy} onClick={() => void sendLink(u)} className={`rounded-full px-3 py-1 text-xs font-semibold text-[#5A18C9] hover:bg-[#F3EDFE] disabled:opacity-50 dark:text-[#D1C4F9] dark:hover:bg-white/10 ${focusRing}`}>
                        {u.status === "pending" ? "New link" : "Reset access"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => void toggleActive(u)} className={`rounded-full px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10 ${u.is_active ? "text-bad dark:text-rose-300" : "text-ok dark:text-emerald-300"} ${focusRing}`}>
                        {u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
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
    </>
  );
}
