"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GUIDE_TOPICS, searchGuide, type GuideTopic } from "./systemGuideKnowledge";

interface Message {
  id: string;
  sender: "bot" | "user";
  text?: string;
  topic?: GuideTopic;
  actionRequired?: boolean;
}

interface SystemAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConcernsDesk: () => void;
  userRole?: string;
}

export default function SystemAssistantModal({
  isOpen,
  onClose,
  onOpenConcernsDesk,
  userRole = "barangay_rep",
}: SystemAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      sender: "bot",
      text: "Mabuhay! I am your DILG Makati System Assistant. Ask me how any part of the system works, explore common topics below, or connect with a DILG officer if you need official assistance.",
    },
  ]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  function handleSelectTopic(topic: GuideTopic) {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: topic.question,
    };
    const botMsg: Message = {
      id: `b-${Date.now() + 1}`,
      sender: "bot",
      topic,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  }

  function handleAsk(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
    };

    const results = searchGuide(q);
    let botMsg: Message;

    if (results.length > 0) {
      botMsg = {
        id: `b-${Date.now() + 1}`,
        sender: "bot",
        topic: results[0],
      };
    } else {
      botMsg = {
        id: `b-${Date.now() + 1}`,
        sender: "bot",
        text: `I couldn't find a direct guide matching "${q}". If you are experiencing a technical issue or have a specific policy concern, you can submit an official communication request to the DILG Makati Office.`,
        actionRequired: true,
      };
    }

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setQuery("");
  }

  const categoryChips = [
    { id: "all", label: "All Topics" },
    { id: "borms", label: "BORMS & 3 Rs" },
    { id: "receipts", label: "Receipts (e-AR)" },
    { id: "deadlines", label: "Deadlines" },
    { id: "bagwis", label: "Bagwis PPAs" },
    { id: "announcements", label: "Announcements" },
    { id: "security", label: "Security & 2FA" },
  ];

  const filteredQuickTopics = GUIDE_TOPICS.filter((t) =>
    activeCategory === "all" ? true : t.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] h-[700px] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13111C] shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-[#002B7F] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">DILG Makati Assistant</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                  Scripted Guide
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Interactive Knowledge Base &amp; Help Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConcernsDesk();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <span>Raise Concern to DILG</span>
              <span>&rarr;</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#1A1726] px-4 py-2 text-xs scrollbar-none">
          {categoryChips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition-colors ${
                activeCategory === c.id
                  ? "bg-[#0039A6] text-white"
                  : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#0E0C15]/50"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {m.sender === "user" ? (
                <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-[#0039A6] px-4 py-2.5 text-sm text-white shadow-sm">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[95%] sm:max-w-[88%] space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] p-4 text-sm text-slate-800 dark:text-slate-100 shadow-sm">
                  {m.text && <p className="leading-relaxed">{m.text}</p>}

                  {m.topic && (
                    <div className="space-y-3">
                      <div className="border-b border-slate-100 dark:border-white/10 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0039A6] dark:text-blue-400">
                          {m.topic.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {m.topic.question}
                        </h4>
                      </div>

                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {m.topic.summary}
                      </p>

                      {m.topic.steps && m.topic.steps.length > 0 && (
                        <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-3">
                          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                            Step-by-Step Procedure
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {m.topic.steps.map((s, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {s}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {m.topic.actionLink && (
                          <Link
                            href={m.topic.actionLink.href}
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0039A6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002B7F] transition-colors"
                          >
                            <span>{m.topic.actionLink.label}</span>
                            <span>&rarr;</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenConcernsDesk();
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#0039A6] hover:text-[#0039A6] dark:hover:text-blue-400 transition-colors"
                        >
                          <span>💬 Contact DILG Officer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {m.actionRequired && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenConcernsDesk();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0039A6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B7F] shadow-sm transition-colors"
                      >
                        <span>Start Official Communication Request</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quick suggestions if few messages */}
          {messages.length <= 2 && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Frequently Asked System Topics
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredQuickTopics.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTopic(t)}
                    className="flex items-start text-left p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#181524] hover:border-[#0039A6] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs text-slate-700 dark:text-slate-200 transition-all"
                  >
                    <span className="mr-2">💡</span>
                    <span className="font-medium line-clamp-2">{t.question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#13111C] p-4">
          <form onSubmit={handleAsk} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about the system (e.g. 'how to resubmit', 'receipt', 'extension')..."
              className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0039A6] focus:outline-none focus:ring-2 focus:ring-[#0039A6]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-2xl bg-[#0039A6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002B7F] disabled:opacity-40 shadow-sm transition-colors"
            >
              Ask
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Powered by official DILG Makati system guides</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConcernsDesk();
              }}
              className="font-semibold text-[#0039A6] dark:text-blue-400 hover:underline"
            >
              Need human support? Open Concerns Desk
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

