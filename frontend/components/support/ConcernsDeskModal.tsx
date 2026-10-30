"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";
import type { SupportTicket, SupportTicketMessage, TicketCategory, TicketStatus } from "@/types";

interface ConcernsDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicketId?: number | null;
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  borms_reporting: "BORMS & 3 Rs Reporting",
  deadline_extension: "Deadline Extension Request",
  technical_issue: "Technical System Issue",
  policy_inquiry: "Policy / Memorandum Clarification",
  compliance_dispute: "Compliance / Returned Report Dispute",
  general_inquiry: "General Inquiry",
};

export default function ConcernsDeskModal({
  isOpen,
  onClose,
  initialTicketId = null,
}: ConcernsDeskModalProps) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "new">("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // New Concern Form State
  const [category, setCategory] = useState<TicketCategory>("borms_reporting");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Message & Action State
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Escalation & Resolution Modal States
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isOfficeStaff = user?.role === "office_supervisor" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  // Fetch Tickets
  async function fetchTickets() {
    try {
      setLoading(true);
      const res = await api.get<{ data: SupportTicket[] }>("/api/support-tickets");
      if (res?.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch Single Ticket Details
  async function fetchTicketDetail(id: number) {
    try {
      setLoading(true);
      const res = await api.get<SupportTicket>(`/api/support-tickets/${id}`);
      if (res) {
        setSelectedTicket(res);
        setActiveTab("detail");
      }
    } catch (err) {
      console.error("Failed to load ticket", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      void fetchTickets();
      if (initialTicketId) {
        void fetchTicketDetail(initialTicketId);
      }
    }
  }, [isOpen, initialTicketId]);

  useEffect(() => {
    if (activeTab === "detail" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages, activeTab]);

  if (!isOpen) return null;

  // Submit New Concern
  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post<SupportTicket>("/api/support-tickets", {
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      if (res) {
        setSubject("");
        setDescription("");
        setCategory("borms_reporting");
        setSelectedTicket(res);
        setActiveTab("detail");
        void fetchTickets();
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to submit communication request.");
    } finally {
      setSubmitting(false);
    }
  }

  // DILG Representative Accepts Communication
  async function handleAcceptCommunication() {
    if (!selectedTicket) return;
    setActionBusy(true);
    try {
      const res = await api.post<SupportTicket>(`/api/support-tickets/${selectedTicket.id}/accept`, {});
      if (res) {
        setSelectedTicket(res);
        void fetchTickets();
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to accept communication.");
    } finally {
      setActionBusy(false);
    }
  }

  // Escalate to Super Admin
  async function handleEscalate() {
    if (!selectedTicket || !escalateReason.trim()) return;
    setActionBusy(true);
    try {
      const res = await api.post<SupportTicket>(`/api/support-tickets/${selectedTicket.id}/escalate`, {
        escalation_reason: escalateReason.trim(),
      });
      if (res) {
        setSelectedTicket(res);
        setShowEscalateModal(false);
        setEscalateReason("");
        void fetchTickets();
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to escalate ticket.");
    } finally {
      setActionBusy(false);
    }
  }

  // Resolve Ticket
  async function handleResolve() {
    if (!selectedTicket || !resolutionNotes.trim()) return;
    setActionBusy(true);
    try {
      const res = await api.post<SupportTicket>(`/api/support-tickets/${selectedTicket.id}/resolve`, {
        resolution_notes: resolutionNotes.trim(),
      });
      if (res) {
        setSelectedTicket(res);
        setShowResolveModal(false);
        setResolutionNotes("");
        void fetchTickets();
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to resolve ticket.");
    } finally {
      setActionBusy(false);
    }
  }

  // Send Reply in Thread
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const newMsg = await api.post<SupportTicketMessage>(
        `/api/support-tickets/${selectedTicket.id}/messages`,
        { message: replyText.trim() }
      );
      if (newMsg) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages ?? []), newMsg],
              }
            : null
        );
        setReplyText("");
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to send message.");
    } finally {
      setSendingReply(false);
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] h-[760px] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13111C] shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-[#002B7F] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  DILG Concerns &amp; Communication Desk
                </h2>
                {isSuperAdmin && (
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-300/30">
                    Super Admin Oversight
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100">
                Official Liaison: Barangay Rep &rarr; DILG Officer &rarr; Super Admin Escalation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== "new" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setActiveTab("new");
                }}
                className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-[#002B7F] hover:bg-blue-50 transition-colors shadow-sm"
              >
                + New Concern
              </button>
            )}

            {activeTab !== "list" && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("list");
                  void fetchTickets();
                }}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                All Concerns
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Concerns Desk"
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* View 1: List of Tickets */}
        {activeTab === "list" && (
          <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50 dark:bg-[#0E0C15]/50">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] px-6 py-2.5 text-xs">
              {[
                { id: "all", label: "All Concerns" },
                { id: "pending_acceptance", label: "⏳ Pending Acceptance" },
                { id: "in_progress", label: "💬 Active Communication" },
                { id: "escalated", label: "🚨 Escalated to Super Admin" },
                { id: "resolved", label: "✅ Resolved" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                    filterStatus === tab.id
                      ? "bg-[#0039A6] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loading && tickets.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0039A6] border-t-transparent mx-auto mb-2" />
                  Loading communications desk...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center">
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    No concerns found in this category
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    If you have questions or encountered an issue, start a new communication request.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-4 rounded-xl bg-[#0039A6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B7F]"
                  >
                    + Submit New Concern
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => void fetchTicketDetail(ticket.id)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] p-4 sm:p-5 hover:border-[#0039A6] hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {ticket.ticket_number}
                        </span>
                        <StatusBadge status={ticket.status} />
                        {ticket.priority === "urgent" && (
                          <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            Urgent
                          </span>
                        )}
                        {ticket.barangay && (
                          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            Barangay {ticket.barangay.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0039A6] dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {ticket.subject}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Category: {CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                        <span>&bull;</span>
                        <span>Filed: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.messages_count !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span>{ticket.messages_count} message{ticket.messages_count !== 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center sm:self-center shrink-0">
                      <span className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-[#0039A6] dark:text-blue-300 group-hover:bg-[#0039A6] group-hover:text-white transition-all">
                        Open Thread &rarr;
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View 2: Create New Concern */}
        {activeTab === "new" && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 dark:bg-[#0E0C15]/50">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] p-6 sm:p-8 shadow-sm">
              <div className="border-b border-slate-100 dark:border-white/10 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Submit Official Communication Request
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your concern will be queued for the DILG Makati Office. Once accepted by an officer, a live messaging channel will open.
                </p>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Concern Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TicketCategory)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                        <option key={k} value={k} className="bg-white dark:bg-[#181524]">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Urgency
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "normal" | "urgent")}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                    >
                      <option value="normal" className="bg-white dark:bg-[#181524]">
                        Normal
                      </option>
                      <option value="urgent" className="bg-white dark:bg-[#181524]">
                        Urgent (Deadline within 48h / System Blocker)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Subject / Concern Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Request for 3-day extension on Q1 BADAC Report due to flood"
                    maxLength={200}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Detailed Explanation
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="State the background, specific requirement name, any errors encountered, or requested action..."
                    maxLength={5000}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/20 p-3.5 text-xs text-blue-800 dark:text-blue-300">
                  ℹ️ <strong>Workflow Policy:</strong> Upon submitting, the status becomes{" "}
                  <em>"Waiting for DILG Acceptance"</em>. You will be able to exchange messages once a DILG representative accepts your request. If a deadlock or technical issue arises, it can be escalated to the Super Admin.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("list")}
                    className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !description.trim()}
                    className="rounded-xl bg-[#0039A6] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#002B7F] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {submitting ? "Submitting..." : "Submit Communication Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View 3: Detail / Active Chat Thread */}
        {activeTab === "detail" && selectedTicket && (
          <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50 dark:bg-[#0E0C15]/50">
            {/* Thread Header Info & Actions */}
            <div className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] p-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedTicket.ticket_number}
                    </span>
                    <StatusBadge status={selectedTicket.status} />
                    {selectedTicket.barangay && (
                      <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        Barangay {selectedTicket.barangay.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {/* Contextual Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* DILG Officer Accepts Communication */}
                  {selectedTicket.status === "pending_acceptance" && isOfficeStaff && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void handleAcceptCommunication()}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      {actionBusy ? "Accepting..." : "🤝 Accept Communication"}
                    </button>
                  )}

                  {/* Escalate to Super Admin (if in_progress) */}
                  {selectedTicket.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={() => setShowEscalateModal(true)}
                      className="rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      ⚠️ Escalate to Super Admin
                    </button>
                  )}

                  {/* Mark Resolved */}
                  {(selectedTicket.status === "in_progress" ||
                    (selectedTicket.status === "escalated" && isOfficeStaff)) && (
                    <button
                      type="button"
                      onClick={() => setShowResolveModal(true)}
                      className="rounded-xl bg-slate-800 dark:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      ✅ Mark as Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-3">
                {selectedTicket.status === "pending_acceptance" && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <span className="text-sm">⏳</span>
                    <div>
                      <p className="font-semibold">Communication Request Pending</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                        {isOfficeStaff
                          ? "This concern is awaiting official acceptance. Click 'Accept Communication' above to engage with the barangay representative."
                          : "Your communication request has been sent to the DILG Makati Office. Please wait for an officer to accept the thread before chatting."}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTicket.status === "in_progress" && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>
                      🟢 <strong>Official Channel Active</strong> &mdash; Accepted by DILG Officer. You may exchange replies below.
                    </span>
                  </div>
                )}

                {selectedTicket.status === "escalated" && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-300">
                    <div className="flex items-center gap-2 font-bold">
                      <span>🚨</span>
                      <span>Escalated to Super Admin for Executive Review</span>
                    </div>
                    {selectedTicket.escalation_reason && (
                      <p className="mt-1 pl-6 text-rose-700 dark:text-rose-400 italic">
                        &ldquo;{selectedTicket.escalation_reason}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {selectedTicket.status === "resolved" && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-3 text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-bold">✅ Concern Resolved</p>
                    {selectedTicket.resolution_notes && (
                      <p className="mt-1 text-blue-700 dark:text-blue-400">
                        <strong>Resolution:</strong> {selectedTicket.resolution_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  const roleLabel =
                    msg.user?.role === "super_admin"
                      ? "Super Admin"
                      : msg.user?.role === "office_supervisor"
                      ? "DILG Officer"
                      : "Barangay Rep";

                  if (msg.is_escalation_note) {
                    return (
                      <div
                        key={msg.id}
                        className="mx-auto my-3 max-w-xl rounded-2xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 shadow-sm"
                      >
                        <p className="font-bold whitespace-pre-wrap">{msg.message}</p>
                        <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
                          {new Date(msg.created_at).toLocaleTimeString()} &bull; {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {msg.user?.name ?? (isMe ? "You" : "Officer")}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            msg.user?.role === "super_admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                              : msg.user?.role === "office_supervisor"
                              ? "bg-blue-100 text-[#0039A6] dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                          }`}
                        >
                          {roleLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                          isMe
                            ? "bg-[#0039A6] text-white"
                            : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No messages yet.
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input Bar */}
            <div className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#13111C] p-4">
              {selectedTicket.status === "pending_acceptance" ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-3 text-center text-xs text-slate-500">
                  Communication channel is locked until accepted by a DILG officer.
                </div>
              ) : selectedTicket.status === "resolved" ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 text-center text-xs text-slate-500">
                  This concern has been resolved. Open a new communication request if you have another inquiry.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply or clarification..."
                    maxLength={5000}
                    className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0039A6] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="rounded-2xl bg-[#0039A6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002B7F] disabled:opacity-40 transition-colors shadow-sm"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Escalation Prompt Modal */}
        {showEscalateModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-[#181524] p-6 shadow-2xl">
              <h4 className="text-base font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>Escalate Concern to Super Admin</span>
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Use this when the barangay representative and DILG officer encounter a policy impasse, disagreement on report compliance, or a critical system issue.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Escalation
                </label>
                <textarea
                  required
                  rows={4}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Describe the unresolved problem or reason requiring Super Admin intervention (min 10 characters)..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusy || escalateReason.trim().length < 10}
                  onClick={() => void handleEscalate()}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
                >
                  {actionBusy ? "Escalating..." : "Confirm Escalation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Prompt Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] p-6 shadow-2xl">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>✅</span>
                <span>Mark Concern as Resolved</span>
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Please summarize the official resolution, instructions provided, or outcome of this concern.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Granted a 3-day deadline extension until May 15. Representative instructed to re-upload revised financial annex."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-sm text-slate-900 dark:text-white focus:border-[#0039A6] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusy || resolutionNotes.trim().length < 5}
                  onClick={() => void handleResolve()}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {actionBusy ? "Saving..." : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case "pending_acceptance":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
          ⏳ Pending Acceptance
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-[#0039A6] dark:text-blue-300">
          💬 Active Communication
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          🚨 Escalated to Super Admin
        </span>
      );
    case "resolved":
    case "closed":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
          ✅ Resolved
        </span>
      );
  }
}

