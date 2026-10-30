"use client";

import { useState } from "react";
import { apiSend } from "@/lib/http";
import { useFetch } from "@/hooks/useFetch";

interface BarangayOption {
  id: number;
  name: string;
  code: string;
}

interface SendRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESETS = [
  {
    title: "⏰ 2 Days Left: Periodic Filing Deadline",
    subject: "Compliance Reminder: 2 Days Left for Periodic Filing",
    message:
      "Good day. This is an official advisory from DILG Makati. You have 2 days remaining before the mandatory submission deadline. Please upload all required reports through BORMS to avoid non-compliance notice.",
    priority: "normal" as const,
  },
  {
    title: "🚨 Urgent: Overdue Submissions Required",
    subject: "Urgent Notice: Outstanding & Overdue Submissions",
    message:
      "Immediate action required. Our records indicate overdue reports for your barangay. Please submit the outstanding documentation through BORMS immediately or coordinate with the DILG Field Office.",
    priority: "urgent" as const,
  },
  {
    title: "📢 Notice: SGLGB & Assembly Compliance",
    subject: "Advisory: SGLGB & Barangay Assembly Documentation",
    message:
      "Please ensure that all post-activity documentation, resolution copies, and attendance rosters are submitted through the portal in accordance with DILG guidelines.",
    priority: "normal" as const,
  },
  {
    title: "📑 Follow-up: Returned Reports Awaiting Revision",
    subject: "Action Needed: Rectify Returned Submissions",
    message:
      "This is a follow-up advisory regarding reports returned with supervisory remarks. Please review the specific feedback noted on your dashboard and resubmit the rectified documents promptly.",
    priority: "urgent" as const,
  },
];

export default function SendRemindersModal({
  isOpen,
  onClose,
  onSuccess,
}: SendRemindersModalProps) {
  const { data: barangaysData } = useFetch<{ id: number; name: string; code: string }[]>("/api/barangays");
  const barangays = barangaysData ?? [];

  const [mode, setMode] = useState<"all_pending" | "custom">("all_pending");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [subject, setSubject] = useState(PRESETS[0].subject);
  const [message, setMessage] = useState(PRESETS[0].message);
  const [priority, setPriority] = useState<"normal" | "urgent">(PRESETS[0].priority);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  function applyPreset(p: typeof PRESETS[0]) {
    setSubject(p.subject);
    setMessage(p.message);
    setPriority(p.priority);
  }

  function toggleBarangay(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(barangays.map((b) => b.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setFeedback({ kind: "error", text: "Please enter both a reminder subject and message." });
      return;
    }

    if (mode === "custom" && selectedIds.length === 0) {
      setFeedback({ kind: "error", text: "Please select at least one barangay." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        barangay_ids: mode === "all_pending" ? "all_pending" : selectedIds,
        title: subject.trim(),
        message: message.trim(),
        priority,
        action_url: "/user/reports",
      };

      const res = await apiSend<{ success: boolean; message: string; barangay_count: number }>(
        "/api/supervisor/send-reminders",
        "POST",
        payload
      );

      setFeedback({ kind: "success", text: res.message || "Reminders successfully sent!" });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to dispatch reminders.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-[#0039A6] dark:bg-blue-950/60 dark:text-blue-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Dispatch Compliance Reminders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send 1-click or targeted in-app deadline reminders directly to barangay representatives.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.kind === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
            }`}
          >
            <span>{feedback.kind === "success" ? "✓" : "⚠"}</span>
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`text-left p-3 rounded-xl border text-xs transition-colors ${
                    subject === p.subject
                      ? "border-[#0039A6] bg-blue-50/70 dark:bg-blue-950/30 text-[#0039A6] dark:text-blue-300 font-semibold"
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold">{p.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {p.subject}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Recipient Barangays
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMode("all_pending")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  mode === "all_pending"
                    ? "bg-[#0039A6] text-white border-[#0039A6]"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
              >
                ⚡ All Overdue &amp; Pending Barangays
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  mode === "custom"
                    ? "bg-[#0039A6] text-white border-[#0039A6]"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
              >
                🎯 Select Specific Barangays {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
            </div>

            {mode === "custom" && (
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Makati Barangays ({selectedIds.length} selected)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[#0039A6] dark:text-blue-400 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {barangays.map((b) => {
                    const isSelected = selectedIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBarangay(b.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-[#0039A6] text-white border-[#0039A6]"
                            : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300"
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subject & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Reminder Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                placeholder="e.g. Compliance Reminder: Deadline in 2 Days"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "normal" | "urgent")}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none font-semibold"
              >
                <option value="normal">Normal</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Reminder Message Body
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] p-3.5 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none leading-relaxed"
              placeholder="Enter specific instructions or deadline details..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSend}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0039A6] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#002B7F] transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Sending Reminders...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4z" />
                </svg>
                <span>Dispatch Reminders</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

