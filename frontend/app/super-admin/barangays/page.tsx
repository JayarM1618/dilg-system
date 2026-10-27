"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { apiSend } from "@/lib/http";
import { Notice, btn, btnGhost, field } from "@/components/threers/ui";

type Row = { id: number; name: string; code: string; is_active: boolean };

/** Super admin only: add barangays, rename them, switch them on or off. */
export default function BarangaysPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<Row[]>(user ? "/api/barangays" : null);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      setFlash({ kind: "ok", text: ok });
      reload();
    } catch (e) {
      setFlash({ kind: "error", text: e instanceof Error ? e.message : "That did not work." });
    }
  }

  function add(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      await apiSend("/api/barangays", "POST", { name: name.trim(), code: code.trim() });
      setName("");
      setCode("");
    }, "Barangay added.");
  }

  const rows = data ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold text-navy-900 dark:text-white sm:text-3xl">Barangays</h1>
      <p className="mt-1 max-w-[60ch] text-sm text-muted dark:text-slate-400 sm:text-base">
        The barangays DILG works with. A switched-off barangay stops receiving requirements and disappears from the public list. Its records are kept.
      </p>

      <div className="mt-5">
        {flash && (
          <Notice kind={flash.kind} onClose={() => setFlash(null)}>
            {flash.text}
          </Notice>
        )}
      </div>

      <form onSubmit={add} className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#181126] sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          Name
          <input required className={`${field} mt-1 w-full`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barangay Example" />
        </label>
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200 sm:w-40">
          Code
          <input required className={`${field} mt-1 w-full`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BGY-25" />
        </label>
        <button className={btn}>Add barangay</button>
      </form>

      {loading && !data ? (
        <p className="py-10 text-center text-slate-500">Loading...</p>
      ) : error ? (
        <p className="py-10 text-center font-medium text-rose-500">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#181126]">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-100 dark:border-white/10">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-white/10 dark:text-slate-200">
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5 font-semibold">
                    {editing?.id === b.id ? (
                      <input className={`${field} w-full`} value={editing.name} onChange={(e) => setEditing({ id: b.id, name: e.target.value })} />
                    ) : (
                      b.name
                    )}
                  </td>
                  <td className="px-4 py-2.5">{b.code}</td>
                  <td className="px-4 py-2.5">{b.is_active ? "Active" : "Switched off"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      {editing?.id === b.id ? (
                        <>
                          <button className={btn} onClick={() => void run(async () => { await apiSend(`/api/barangays/${b.id}`, "PATCH", { name: editing.name.trim() }); setEditing(null); }, "Name updated.")}>Save</button>
                          <button className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className={btnGhost} onClick={() => setEditing({ id: b.id, name: b.name })}>Rename</button>
                          <button className={btnGhost} onClick={() => void run(() => apiSend(`/api/barangays/${b.id}`, "PATCH", { is_active: !b.is_active }), b.is_active ? "Barangay switched off." : "Barangay switched on.")}>
                            {b.is_active ? "Switch off" : "Switch on"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
