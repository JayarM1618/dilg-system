"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SystemAssistantModal from "./SystemAssistantModal";
import ConcernsDeskModal from "./ConcernsDeskModal";

export default function SystemAssistantLauncher() {
  const { user } = useAuth();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [concernsOpen, setConcernsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [initialTicketId, setInitialTicketId] = useState<number | null>(null);

  useEffect(() => {
    function handleOpenConcerns(e: Event) {
      const customEvent = e as CustomEvent<{ id?: number | null }>;
      setMenuOpen(false);
      setAssistantOpen(false);
      setInitialTicketId(customEvent.detail?.id ?? null);
      setConcernsOpen(true);
    }

    window.addEventListener("open-concerns-desk", handleOpenConcerns);
    return () => window.removeEventListener("open-concerns-desk", handleOpenConcerns);
  }, []);

  if (!user) return null;

  return (
    <>
      {/* Floating Action Menu / Trigger */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {menuOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Quick Button 1: Scripted Assistant */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAssistantOpen(true);
              }}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white shadow-lg hover:border-[#0039A6] hover:text-[#0039A6] dark:hover:text-blue-300 transition-all"
            >
              <span>🤖</span>
              <span>Ask System Assistant (Gabay)</span>
            </button>

            {/* Quick Button 2: Concerns Desk */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setInitialTicketId(null);
                setConcernsOpen(true);
              }}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181524] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white shadow-lg hover:border-[#0039A6] hover:text-[#0039A6] dark:hover:text-blue-300 transition-all"
            >
              <span>🏛️</span>
              <span>Official DILG Concerns Desk</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open DILG Assistant & Concerns Desk"
          className="group relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#002B7F] hover:bg-[#0039A6] text-white shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#0039A6]/30 active:scale-95"
        >
          {menuOpen ? (
            <span className="text-xl font-bold">✕</span>
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="text-2xl select-none">💬</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Scripted AI Assistant Modal */}
      <SystemAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onOpenConcernsDesk={() => {
          setInitialTicketId(null);
          setConcernsOpen(true);
        }}
        userRole={user.role}
      />

      {/* Official Concerns Desk Modal */}
      <ConcernsDeskModal
        isOpen={concernsOpen}
        initialTicketId={initialTicketId}
        onClose={() => {
          setConcernsOpen(false);
          setInitialTicketId(null);
        }}
      />
    </>
  );
}
