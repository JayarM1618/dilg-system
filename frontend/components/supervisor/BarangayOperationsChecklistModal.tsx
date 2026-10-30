"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { apiSend } from "@/lib/http";

interface BarangayChecklistPayload {
  barangay: {
    id: number;
    name: string;
    code: string;
    hall_address?: string;
    hotline?: string;
    office_hours?: string;
  };
  metrics: {
    compliance_rate: number;
    compliant: number;
    pending: number;
    under_review: number;
    non_compliant: number;
    overdue: number;
  };
  submissions: {
    id: number;
    category_name: string;
    cycle: string;
    period_label: string;
    due_date?: string;
    status: string;
    is_overdue: boolean;
    review_remarks?: string;
    submitted_at?: string;
  }[];
  requirements: {
    id: number;
    title: string;
    due_date?: string;
    status: string;
    submitted_at?: string;
  }[];
  open_tickets: {
    id: number;
    ticket_number: string;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
  }[];
  field_notes: {
    id: number;
    created_at: string;
    user: string;
    meta?: {
      note?: string;
      category?: string;
      visit_date?: string;
      supervisor?: string;
    };
  }[];
}

interface BarangayOperationsChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BarangayOperationsChecklistModal({
  isOpen,
  onClose,
}: BarangayOperationsChecklistModalProps) {
  const { data: barangaysData } = useFetch<{ id: number; name: string; code: string }[]>("/api/barangays");
  const barangays = barangaysData ?? [];

  const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(null);

  // Default to first barangay when loaded
  const activeId = selectedBarangayId ?? (barangays[0]?.id || null);

  const { data, loading, error, reload } = useFetch<BarangayChecklistPayload>(
    isOpen && activeId ? `/api/supervisor/checklist/${activeId}` : null
  );

  // Field note entry state
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState<"field_inspection" | "follow_up" | "coordination">("field_inspection");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingNote, setSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSaveNote() {
    if (!newNote.trim() || !activeId) return;
    setSavingNote(true);
    setNoteFeedback(null);

    try {
      await apiSend(`/api/supervisor/checklist/${activeId}/notes`, "POST", {
        note: newNote.trim(),
        category: noteCategory,
        visit_date: visitDate,
      });

      setNewNote("");
      setNoteFeedback("Field visit note recorded successfully!");
      reload();
      setTimeout(() => setNoteFeedback(null), 3000);
    } catch (err) {
      setNoteFeedback(err instanceof Error ? err.message : "Failed to record note.");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden">
        
        {/* Header with Barangay Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-base">
              📋
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Barangay Operations &amp; Field Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Running compliance checklist, directives status, and field inspection tracker.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeId ?? ""}
              onChange={(e) => setSelectedBarangayId(Number(e.target.value))}
              className="rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#1E293B] px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0039A6]"
            >
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  Barangay {b.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent" />
              <p className="text-xs text-slate-500">Loading barangay checklist...</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-rose-600">
              <p className="text-sm font-semibold">Failed to load checklist.</p>
              <button onClick={() => reload()} className="mt-2 text-xs underline font-bold">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Barangay Info & Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Brgy. {data.barangay.name} ({data.barangay.code})
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.metrics.compliance_rate >= 80
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                      }`}
                    >
                      {data.metrics.compliance_rate}% Compliance
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <p><strong>Hall:</strong> {data.barangay.hall_address || "Barangay Hall, Makati"}</p>
                    <p><strong>Hotline:</strong> {data.barangay.hotline || "N/A"}</p>
                    <p><strong>Hours:</strong> {data.barangay.office_hours || "8:00 AM - 5:00 PM"}</p>
                    <p><strong>Open Inquiries:</strong> {data.open_tickets.length} Active Concern(s)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] flex flex-col justify-center gap-1 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Cleared &amp; Compliant:</span>
                    <strong className="text-emerald-600">{data.metrics.compliant}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Under Review:</span>
                    <strong className="text-amber-600">{data.metrics.under_review}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Pending / Overdue:</span>
                    <strong className="text-rose-600">{data.metrics.pending + data.metrics.overdue}</strong>
                  </div>
                </div>
              </div>

              {/* Running Checklist: Submissions & Directives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reports Checklist */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Periodic Filings Checklist
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {data.submissions.length} Total
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data.submissions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No submissions recorded.</p>
                    ) : (
                      data.submissions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {s.category_name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {s.period_label} &bull; Due: {s.due_date || "N/A"}
                            </p>
                            {s.review_remarks && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic">
                                Note: {s.review_remarks}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              s.status === "compliant"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : s.is_overdue
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                                : s.status === "non_compliant"
                                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            }`}
                          >
                            {s.is_overdue ? "Overdue" : s.status.replace("_", " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Directives & Requirements Checklist */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Directives &amp; Tasks
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {data.requirements.length} Assigned
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data.requirements.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No directives assigned.</p>
                    ) : (
                      data.requirements.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {r.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Due: {r.due_date || "No deadline"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              r.status === "compliant"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : r.status === "submitted"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Field Operations & Visit Log Section */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Field Visits &amp; Supervisory Notes Log
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {data.field_notes.length} Recorded Note(s)
                  </span>
                </div>

                {/* Add Note Input */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                      >
                        <option value="field_inspection">🔍 Field Inspection</option>
                        <option value="follow_up">📅 Follow-up Visit</option>
                        <option value="coordination">🤝 Coordination Meeting</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={savingNote || !newNote.trim()}
                        onClick={handleSaveNote}
                        className="w-full sm:w-auto px-4 py-2 bg-[#0039A6] text-white rounded-xl text-xs font-bold hover:bg-[#002B7F] transition-colors disabled:opacity-50"
                      >
                        {savingNote ? "Saving..." : "+ Record Visit Note"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter inspection findings, document checklist observations, or follow-up notes..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] p-3 text-xs text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                  />
                  {noteFeedback && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {noteFeedback}
                    </p>
                  )}
                </div>

                {/* History of Field Notes */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {data.field_notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No field inspection notes recorded yet for this barangay.
                    </p>
                  ) : (
                    data.field_notes.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#181126] border border-slate-200/60 dark:border-white/10 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {log.meta?.category?.replace("_", " ").toUpperCase() || "NOTE"} &bull; {log.meta?.visit_date || new Date(log.created_at).toLocaleDateString()}
                          </span>
                          <span>Logged by: {log.user}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                          {log.meta?.note}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

