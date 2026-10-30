"use client";

import { useState } from "react";
import { apiSend, apiUrl } from "@/lib/http";

export interface SubmissionReviewItem {
  id: number;
  barangay_name: string;
  category_name: string;
  period_label: string;
  due_date?: string;
  status: string;
  submitted_at?: string;
  latest_file?: {
    id: number;
    original_filename: string;
    size_bytes: number;
  } | null;
  review_remarks?: string;
}

interface ReviewSubmissionModalProps {
  submission: SubmissionReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FEEDBACK_TEMPLATES = [
  {
    label: "✍️ Missing PB Signature",
    text: "Returned for revision: The submitted report is missing the official signature of the Punong Barangay. Please affix the required signature and re-upload.",
  },
  {
    label: "📑 Incomplete Financial Annex",
    text: "Returned for revision: Incomplete documentary requirements. The required financial itemization annex and supporting receipts/vouchers are missing.",
  },
  {
    label: "🔍 Illegible / Blurry Scan",
    text: "Returned for revision: The uploaded scanned file is illegible or too low in resolution for audit verification. Please scan clearly and resubmit.",
  },
  {
    label: "📅 Reporting Period Mismatch",
    text: "Returned for revision: The coverage dates and figures indicated do not correspond to the requested reporting period. Please update and re-upload.",
  },
  {
    label: "🏛️ Missing Barangay Seal",
    text: "Returned for revision: The document lacks the official seal and stamp of the Sangguniang Barangay. Please stamp and re-upload.",
  },
  {
    label: "👥 Missing Minutes / Attendance",
    text: "Returned for revision: Sangguniang Barangay session minutes or committee attendance roster not attached. Please append and resubmit.",
  },
];

export default function ReviewSubmissionModal({
  submission,
  isOpen,
  onClose,
  onSuccess,
}: ReviewSubmissionModalProps) {
  const [remarks, setRemarks] = useState(submission?.review_remarks || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !submission) return null;

  function appendTemplate(templateText: string) {
    setRemarks((prev) => {
      if (!prev.trim()) return templateText;
      return `${prev.trim()}\n\n${templateText}`;
    });
  }

  async function handleDecision(status: "compliant" | "non_compliant") {
    if (!submission) return;

    if (status === "non_compliant" && !remarks.trim()) {
      setError("Please provide specific feedback remarks before returning a submission.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiSend(`/api/submissions/${submission.id}/review`, "PATCH", {
        status,
        review_remarks: remarks.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record review decision.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0039A6] dark:text-blue-400">
              Official Supervisory Review
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {submission.barangay_name} &bull; {submission.category_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cycle Period: <strong>{submission.period_label}</strong>
              {submission.submitted_at ? ` · Filed ${new Date(submission.submitted_at).toLocaleDateString()}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/40">
            ⚠ {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* File Download Preview Card */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-[#0039A6] dark:bg-blue-950 dark:text-blue-300 text-sm">
                📄
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                  {submission.latest_file?.original_filename || "Submitted Document"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {submission.latest_file?.size_bytes
                    ? `${Math.round(submission.latest_file.size_bytes / 1024)} KB`
                    : "Ready for examiner evaluation"}
                </p>
              </div>
            </div>

            <a
              href={apiUrl(`/api/submissions/${submission.id}/download`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#1E293B] text-xs font-semibold text-[#0039A6] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <span>Download &amp; Inspect</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          </div>

          {/* Feedback Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Common Feedback Templates (Click to apply)
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => appendTemplate(tpl.text)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#0039A6] text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Examiner Remarks &amp; Rectification Instructions
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks or click one of the feedback templates above..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] p-3 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision("non_compliant")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              <span>Return with Remarks</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision("compliant")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Mark Compliant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
