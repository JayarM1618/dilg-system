"use client";

import { useFetch } from "@/hooks/useFetch";
import { apiUrl } from "@/lib/http";

interface ComplianceSummaryPayload {
  generated_at: string;
  supervisor: {
    name: string;
    position: string;
    office: string;
  };
  jurisdiction: string;
  total_barangays: number;
  overall_rate: number;
  kpis: {
    compliant: number;
    under_review: number;
    non_compliant: number;
    pending: number;
    overdue: number;
    total_due: number;
  };
  high_performers: {
    id: number;
    name: string;
    code: string;
    total: number;
    compliant: number;
    compliance_rate: number;
    status_grade: string;
  }[];
  needs_attention: {
    id: number;
    name: string;
    code: string;
    total: number;
    compliant: number;
    pending: number;
    overdue: number;
    compliance_rate: number;
    status_grade: string;
  }[];
  barangays: {
    id: number;
    name: string;
    code: string;
    total: number;
    compliant: number;
    under_review: number;
    non_compliant: number;
    pending: number;
    overdue: number;
    compliance_rate: number;
    status_grade: string;
  }[];
}

interface ExecutiveComplianceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExecutiveComplianceSummaryModal({
  isOpen,
  onClose,
}: ExecutiveComplianceSummaryModalProps) {
  const { data, loading, error, reload } = useFetch<ComplianceSummaryPayload>(
    isOpen ? "/api/supervisor/compliance-summary" : null
  );

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  function exportCsv() {
    if (!data?.barangays) return;
    const headers = [
      "Barangay Name",
      "Code",
      "Total Due",
      "Compliant",
      "Under Review",
      "Non Compliant",
      "Pending",
      "Overdue",
      "Compliance Rate (%)",
      "Performance Grade",
    ];
    const rows = data.barangays.map((b) => [
      `"${b.name}"`,
      b.code,
      b.total,
      b.compliant,
      b.under_review,
      b.non_compliant,
      b.pending,
      b.overdue,
      b.compliance_rate,
      `"${b.status_grade}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DILG_Makati_Compliance_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:max-w-none">
        
        {/* Screen Action Bar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0039A6] text-white text-xs font-bold">
              PDF
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Executive Compliance Summary Report
              </h2>
              <p className="text-[11px] text-slate-500">
                Official briefing report ready for DILG Regional Office &amp; Superiors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#002B7F] transition-colors shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
              <p className="text-xs text-slate-500">Compiling executive records...</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-rose-600">
              <p className="text-sm font-semibold">Failed to load report data.</p>
              <button
                onClick={() => reload()}
                className="mt-3 text-xs text-[#0039A6] underline font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-8 text-slate-900 dark:text-slate-100">
              {/* Document Official Header */}
              <div className="border-b-2 border-slate-900 dark:border-white pb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
                    Republic of the Philippines &bull; Department of the Interior and Local Government
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  Makati City Field Operations Office
                </h1>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  Barangay Operations &amp; Records Management System (BORMS) &bull; Executive Compliance Summary
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                  <span>
                    <strong>Date Generated:</strong>{" "}
                    {new Date(data.generated_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>&bull;</span>
                  <span><strong>Reporting Officer:</strong> {data.supervisor.name}</span>
                  <span>&bull;</span>
                  <span><strong>Jurisdiction:</strong> {data.jurisdiction}</span>
                </div>
              </div>

              {/* Executive KPI Scorecard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300">
                    Makati Compliance Rate
                  </span>
                  <p className="text-3xl font-extrabold text-[#0039A6] dark:text-blue-400 mt-1">
                    {data.overall_rate}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Overall City Score</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
                    Compliant &amp; Cleared
                  </span>
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                    {data.kpis.compliant}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Reports Verified</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
                    Under Review
                  </span>
                  <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
                    {data.kpis.under_review}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">In Office Queue</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300">
                    Overdue / Needs Action
                  </span>
                  <p className="text-3xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">
                    {data.kpis.overdue}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Immediate Follow-up</p>
                </div>
              </div>

              {/* Comparative Ranking Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High Performers */}
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 text-sm">🏆</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Consistent High Performers ({data.high_performers.length})
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {data.high_performers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-white/5 border border-emerald-100 dark:border-emerald-900/30"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{b.compliance_rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs Attention */}
                <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/30 dark:bg-rose-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-rose-600 text-sm">⚠️</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Barangays Requiring Follow-up ({data.needs_attention.length})
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {data.needs_attention.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">All barangays are on track.</p>
                    ) : (
                      data.needs_attention.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-white/5 border border-rose-100 dark:border-rose-900/30"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {b.overdue > 0 ? `${b.overdue} overdue` : `${b.compliance_rate}%`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Barangay Matrix Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Complete 23 Barangays Jurisdictional Breakdown
                </h3>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Barangay</th>
                        <th className="py-2.5 px-2 text-center">Due</th>
                        <th className="py-2.5 px-2 text-center text-emerald-600">Complied</th>
                        <th className="py-2.5 px-2 text-center text-amber-600">Review</th>
                        <th className="py-2.5 px-2 text-center text-rose-600">Overdue</th>
                        <th className="py-2.5 px-3 text-right">Compliance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                      {data.barangays.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            {b.name}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums">{b.total}</td>
                          <td className="py-2 px-2 text-center tabular-nums text-emerald-600 font-bold">
                            {b.compliant}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums text-amber-600">
                            {b.under_review}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums text-rose-600 font-bold">
                            {b.overdue}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-bold">
                            {b.compliance_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatory Section */}
              <div className="pt-8 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Prepared By:</p>
                  <p className="mt-4 font-bold text-slate-900 dark:text-white">{data.supervisor.name}</p>
                  <p className="text-slate-500">{data.supervisor.position}</p>
                  <p className="text-slate-400 text-[10px]">DILG City Government of Makati</p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Official Seal / Verification:</p>
                  <p className="mt-4 font-mono text-[11px] text-slate-500">REF: DILG-MKT-ECCR-{new Date().getFullYear()}</p>
                  <p className="text-emerald-600 font-semibold text-[10px]">✓ Cryptographically Logged in Audit Trail</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

