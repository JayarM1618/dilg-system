"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/lib/format";
import { apiUrl } from "@/lib/http";
import StatusBadge from "@/components/StatusBadge";
import { btn, btnGhost, PageTitle, Notice, Pager } from "@/components/threers/ui";
import type { CategoryWithTemplate, Submission, Paged } from "@/components/threers/types";

/* ------------------------------------------------------------------ */
/* SK (Sangguniang Kabataan) Reports                                   */
/* A sub-section inside BORMS Reports for SK-specific PPAs:            */
/* - SKFDP (quarterly)                                                 */
/* - KK Assembly (semestral)                                           */
/* ------------------------------------------------------------------ */

const SK_SECTORS = ["sk"];

type Tab = "overview" | "skfdp" | "kk_assembly" | "all";

function isSkCategory(cat: CategoryWithTemplate): boolean {
  const s = (cat.sector ?? "").toLowerCase();
  return s === "sk" || s.includes("sk");
}

export default function SKReportsView() {
  const { user } = useAuth();
  const isOffice = user?.role !== "barangay_rep";
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div className="mb-6">
        <PageTitle
          title="Sangguniang Kabataan (SK) Reports"
          subtitle="SK-specific reports: SKFDP (quarterly) and KK Assembly (semestral)."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-slate-100 dark:bg-white/5 p-1 mb-6 overflow-x-auto">
        {([
          { key: "overview", label: "Overview" },
          { key: "skfdp", label: "SKFDP" },
          { key: "kk_assembly", label: "KK Assembly" },
          { key: "all", label: "All SK Reports" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-fit rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-[#7B4DFF] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <SKOverview />}
      {tab === "skfdp" && <SKCategoryView categoryName="SKFDP" />}
      {tab === "kk_assembly" && <SKCategoryView categoryName="KK Assembly" />}
      {tab === "all" && <SKAllReports />}
    </div>
  );
}

/* ---- Overview: KPI cards for SK ---- */

function SKOverview() {
  const { user } = useAuth();
  const isRep = user?.role === "barangay_rep";
  const { data: categories } = useFetch<CategoryWithTemplate[]>("/api/report-categories");

  const skCats = (categories ?? []).filter(isSkCategory);

  return (
    <div className="space-y-6">
      {/* SK Category Cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {skCats.length === 0 ? (
          <div className="col-span-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 text-center">
            <p className="text-muted dark:text-slate-400">
              No SK report categories have been set up yet. Ask your DILG office to create SKFDP and KK Assembly categories.
            </p>
          </div>
        ) : (
          skCats.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-[#7B4DFF]/20 bg-gradient-to-br from-[#F3EDFE] to-white dark:from-[#241A3F] dark:to-[#1B142F] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white">{cat.name}</h3>
                <span className="rounded-full bg-[#7B4DFF]/15 px-3 py-1 text-xs font-bold text-[#5A18C9] dark:text-[#CDBBFF] uppercase">
                  {cat.cycle}
                </span>
              </div>
              {cat.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{cat.description}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3">
                  <p className="text-xs text-muted dark:text-slate-400">Barangay Action</p>
                  <p className="mt-1 font-medium text-navy-900 dark:text-white">{cat.barangay_action ?? "Submit report"}</p>
                </div>
                <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3">
                  <p className="text-xs text-muted dark:text-slate-400">Supervisor Action</p>
                  <p className="mt-1 font-medium text-navy-900 dark:text-white">{cat.supervisor_action ?? "Review report"}</p>
                </div>
              </div>
              {cat.template && (
                <div className="mt-4">
                  <a
                    href={apiUrl(`/api/resources/${cat.template.id}/download`)}
                    className={`${btnGhost} text-sm`}
                  >
                    Download template (v{cat.template.version})
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recent SK submissions */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6">
        <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Recent SK Submissions</h3>
        <SKSubmissionsTable />
      </section>
    </div>
  );
}

/* ---- Single SK Category View ---- */

function SKCategoryView({ categoryName }: { categoryName: string }) {
  const { user } = useAuth();
  const { data: categories } = useFetch<CategoryWithTemplate[]>("/api/report-categories");
  const cat = (categories ?? []).find(
    (c) => c.name.toLowerCase().includes(categoryName.toLowerCase()) && isSkCategory(c)
  );

  if (!cat) {
    return (
      <Notice kind="ok">
        The {categoryName} report category has not been created yet. Ask your DILG office to set it up.
      </Notice>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#7B4DFF]/20 bg-[#F3EDFE] dark:bg-[#241A3F] p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-navy-900 dark:text-white">{cat.name}</h3>
          <span className="rounded-full bg-[#7B4DFF]/15 px-3 py-1 text-xs font-bold text-[#5A18C9] dark:text-[#CDBBFF] uppercase">
            {cat.cycle}
          </span>
        </div>
        {cat.description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{cat.description}</p>}
        {cat.deadline_description && (
          <p className="mt-2 text-sm text-[#5A18C9] dark:text-[#CDBBFF]">
            <strong>Deadline:</strong> {cat.deadline_description}
          </p>
        )}
      </div>

      <SKSubmissionsTable categoryId={cat.id} />
    </div>
  );
}

/* ---- All SK Reports ---- */

function SKAllReports() {
  return (
    <div className="space-y-6">
      <SKSubmissionsTable sector="sk" />
    </div>
  );
}

/* ---- Shared Submissions Table ---- */

function SKSubmissionsTable({ categoryId, sector }: { categoryId?: number; sector?: string }) {
  const { user } = useAuth();
  const isRep = user?.role === "barangay_rep";

  let url = "/api/submissions?per_page=20";
  if (categoryId) url += `&report_category_id=${categoryId}`;

  const { data, loading, error } = useFetch<Paged<Submission>>(user ? url : null);
  const { data: categories } = useFetch<CategoryWithTemplate[]>("/api/report-categories");

  const skCatIds = new Set(
    (categories ?? []).filter(isSkCategory).map((c) => c.id)
  );

  // Filter submissions to SK categories only
  const submissions = (data?.data ?? []).filter((s) => {
    if (categoryId) return true; // Already filtered by API
    return skCatIds.has(s.report_category_id ?? s.category?.id ?? 0);
  });

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5 h-40" />
    );
  }

  if (error) {
    return <Notice kind="error">{error}</Notice>;
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 text-center">
        <p className="text-muted dark:text-slate-400">No SK reports found. Report periods are opened by the DILG office.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="text-navy-800 dark:text-[#D1C4F9]">
          <tr className="border-b border-slate-200 dark:border-white/10">
            <th className="py-2.5 pr-3 font-semibold">Report</th>
            <th className="px-3 py-2.5 font-semibold">Period</th>
            {!isRep && <th className="px-3 py-2.5 font-semibold">Barangay</th>}
            <th className="px-3 py-2.5 font-semibold">Due Date</th>
            <th className="py-2.5 pl-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {submissions.map((s) => (
            <tr key={s.id}>
              <td className="py-3 pr-3 font-medium text-navy-900 dark:text-white">
                {s.category?.name ?? "SK Report"}
              </td>
              <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-300">{s.period_label}</td>
              {!isRep && (
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{s.barangay?.name ?? "—"}</td>
              )}
              <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                {formatDate(s.due_date)}
                {s.is_overdue && (
                  <span className="ml-2 text-xs font-semibold text-bad dark:text-rose-400">Overdue</span>
                )}
              </td>
              <td className="py-3 pl-3">
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
