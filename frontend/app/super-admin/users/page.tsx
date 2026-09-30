"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { ROLE_INFO } from "@/lib/roles";
import type { Role, User } from "@/types";

type RoleFilter = "all" | Role;

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "super_admin", label: ROLE_INFO.super_admin.label },
  { value: "office_supervisor", label: ROLE_INFO.office_supervisor.label },
  { value: "barangay_rep", label: ROLE_INFO.barangay_rep.label },
];

export default function UsersPage() {
  const { data, loading, error, retry } = useApi<{ data: User[] }>("/api/users");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");

  const users = useMemo(() => data?.data ?? [], [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.barangay?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, role]);

  return (
    <>
      <h1 className="text-3xl font-semibold text-navy-900">Users</h1>
      <p className="mt-1 text-muted">Everyone who can sign in to the report tracker.</p>

      {!loading && !error && users.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label htmlFor="user-search" className="sr-only">
              Search users
            </label>
            <input
              id="user-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or barangay"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2 text-sm outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/25 sm:w-80"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by role">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setRole(f.value)}
                aria-pressed={role === f.value}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  role === f.value
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-line bg-white text-navy-800 hover:bg-navy-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">User accounts</caption>
          <thead className="bg-navy-50 text-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Email</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Barangay</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">Loading users...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-medium text-bad">{error}</p>
                  <button onClick={retry} className="mt-3 text-sm font-semibold text-navy-700 underline underline-offset-4">
                    Try again
                  </button>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  {users.length === 0 ? "No users yet." : "No users match your search."}
                </td>
              </tr>
            ) : (
              visible.map((u) => (
                <tr key={u.id}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left font-medium">{u.name}</th>
                  <td className="px-4 py-3.5 text-muted">{u.email}</td>
                  <td className="px-4 py-3.5">{ROLE_INFO[u.role]?.label ?? u.role}</td>
                  <td className="px-4 py-3.5">{u.barangay?.name ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active ? "bg-emerald-50 text-ok" : "bg-bad-bg text-bad"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && users.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          Showing {visible.length} of {users.length} {users.length === 1 ? "user" : "users"}.
        </p>
      )}
    </>
  );
}
