"use client";

import { useEffect, useRef } from "react";
import type { RepoSubmission } from "./types";
import { formatDateTime } from "./ui";

interface SubmissionReceiptModalProps {
  submission: RepoSubmission | null;
  onClose: () => void;
}

export default function SubmissionReceiptModal({ submission, onClose }: SubmissionReceiptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!submission) return null;

  const trackingNumber = `DILG-MKT-SUB-${String(submission.id).padStart(6, "0")}`;
  const barangayName = submission.barangay?.name ?? "Makati Barangay";
  const reportTitle = submission.category?.name ?? submission.period_label;
  const cycle = submission.category?.cycle ?? "Standard Periodic";
  const filedAt = submission.submitted_at || submission.latest_file?.created_at;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white"
      >
        {/* Screen-only top action bar */}
        <div className="print:hidden flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#0039A6] dark:bg-blue-950/50 dark:text-blue-300 font-bold text-sm">
              📄
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Electronic Acknowledgement Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#002B7F] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Close receipt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="printable-form-document bg-white text-slate-900 p-2 sm:p-4 rounded-xl">
          {/* Government Letterhead */}
          <div className="text-center pb-5 border-b-2 border-slate-900/80">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">Republic of the Philippines</p>
            <h2 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">Department of the Interior and Local Government</h2>
            <p className="text-xs font-semibold text-[#0039A6]">National Capital Region &bull; City of Makati Field Office</p>
            <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded border border-slate-300">
              <span id="receipt-title" className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Official Electronic Submission Receipt (e-AR)
              </span>
            </div>
          </div>

          {/* Reference Banner */}
          <div className="my-5 flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tracking Reference No.</p>
              <p className="font-mono text-sm sm:text-base font-extrabold text-[#0039A6]">{trackingNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status on Record</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                submission.status === "compliant"
                  ? "bg-emerald-100 text-emerald-800"
                  : submission.status === "under_review" || submission.status === "submitted"
                  ? "bg-blue-100 text-blue-800"
                  : submission.status === "non_compliant"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {submission.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barangay Jurisdiction</p>
              <p className="mt-1 font-bold text-slate-800 text-sm">Barangay {barangayName}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">District of Makati City, NCR</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Cycle & Period</p>
              <p className="mt-1 font-bold text-slate-800 text-sm capitalize">{cycle} Cycle</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Period: {submission.period_label}</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Report Category / Title</p>
              <p className="mt-1 font-semibold text-slate-800 text-sm">{reportTitle}</p>
              {submission.category?.sector && (
                <p className="text-[11px] text-slate-500 mt-0.5 capitalize">Sector: {submission.category.sector}</p>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date &amp; Time Logged</p>
              <p className="mt-1 font-semibold text-slate-800 text-sm">
                {filedAt ? formatDateTime(filedAt) : "Date on Record"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Due Date: {submission.due_date}</p>
            </div>
          </div>

          {/* Attachment Information */}
          {submission.latest_file && (
            <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attached File Proof</p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-slate-700 truncate max-w-[320px]">
                  📎 {submission.latest_file.original_filename}
                </span>
                <span className="text-[11px] text-slate-400">Version {submission.latest_file.version}</span>
              </div>
            </div>
          )}

          {/* Reviewer remarks if available */}
          {submission.review_remarks && (
            <div className="mt-4 border border-amber-200 bg-amber-50/60 rounded-lg p-3 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">DILG Examiner Remarks</p>
              <p className="mt-1 text-slate-700 leading-relaxed">{submission.review_remarks}</p>
            </div>
          )}

          {/* Verification Footer & Security Seal */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
            <div>
              <p className="font-bold text-slate-600">TALAGHAYAN E-SUBMISSION VERIFIED</p>
              <p className="font-mono text-[9px]">HASH: SHA256-{(submission.latest_file?.sha256 || "00000000000000000000000000000000").substring(0, 32)}</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-slate-500">System generated via BORMS / DILG Makati Portal</p>
              <p>Valid without physical dry seal under RA 8792 (E-Commerce Act)</p>
            </div>
          </div>
        </div>

        {/* Screen-only footer button */}
        <div className="print:hidden mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

