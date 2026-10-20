"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ConfirmType = "warning" | "danger" | "info" | "success";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

type ConfirmFunction = (options: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

// Global dispatcher ref for non-react or top-level calls
let globalConfirmHandler: ConfirmFunction | null = null;

export const confirmDialog: ConfirmFunction = (options) => {
  if (globalConfirmHandler) {
    return globalConfirmHandler(options);
  }
  // Fallback to native window.confirm only if provider is not mounted
  if (typeof window !== "undefined") {
    const msg = typeof options === "string" ? options : `${options.title ? options.title + "\n\n" : ""}${options.message}`;
    return Promise.resolve(window.confirm(msg));
  }
  return Promise.resolve(false);
};

export function useConfirm(): ConfirmFunction {
  const context = useContext(ConfirmContext);
  if (!context) {
    return confirmDialog;
  }
  return context;
}

function parseOptions(input: string | ConfirmOptions): ConfirmOptions {
  if (typeof input !== "string") {
    return input;
  }

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // Smart heuristic based on sentence contents
  if (lower.includes("delete") || lower.includes("permanently")) {
    return {
      title: "Confirm Permanent Deletion",
      message: raw,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    };
  }

  if (lower.includes("close")) {
    return {
      title: "Close Requirement?",
      message: raw,
      confirmText: "Close Requirement",
      cancelText: "Keep Open",
      type: "warning",
    };
  }

  if (lower.includes("withdraw")) {
    return {
      title: "Withdraw Document?",
      message: raw,
      confirmText: "Withdraw",
      cancelText: "Cancel",
      type: "warning",
    };
  }

  return {
    title: "Action Confirmation",
    message: raw,
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFunction>((options) => {
    const parsed = parseOptions(options);
    return new Promise<boolean>((resolve) => {
      setState({
        ...parsed,
        resolve: (val: boolean) => {
          setState(null);
          resolve(val);
        },
      });
    });
  }, []);

  useEffect(() => {
    globalConfirmHandler = confirm;
    return () => {
      globalConfirmHandler = null;
    };
  }, [confirm]);

  // Handle keyboard events (Escape to cancel, Enter to confirm)
  useEffect(() => {
    if (!state) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        state?.resolve(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  // Focus the confirm button when opened
  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const type = state?.type || "warning";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-description"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => state.resolve(false)}
        >
          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#150F22]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl shadow-purple-950/25 dark:shadow-black/80 animate-in zoom-in-95 duration-200"
          >
            {/* Ambient Top Glow */}
            <div
              className={`absolute -top-24 -left-24 h-48 w-48 rounded-full blur-3xl pointer-events-none opacity-40 ${
                type === "danger"
                  ? "bg-rose-500"
                  : type === "warning"
                  ? "bg-amber-500"
                  : type === "success"
                  ? "bg-emerald-500"
                  : "bg-[#7B4DFF]"
              }`}
            />

            <div className="relative z-10 flex items-start gap-4">
              {/* Type Icon Badge */}
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm ${
                  type === "danger"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-1 ring-rose-300 dark:ring-rose-800/40"
                    : type === "warning"
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-800/40"
                    : type === "success"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-800/40"
                    : "bg-[#7B4DFF]/15 dark:bg-[#7B4DFF]/25 text-[#7B4DFF] dark:text-[#CDBBFF] ring-1 ring-[#7B4DFF]/30"
                }`}
              >
                {type === "danger" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                )}
                {type === "warning" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {type === "info" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
                {type === "success" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>

              {/* Textual Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3
                  id="confirm-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  {state.title || "Confirm Action"}
                </h3>
                <p
                  id="confirm-modal-description"
                  className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line"
                >
                  {state.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => state.resolve(false)}
                className="rounded-xl border border-slate-200 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                {state.cancelText || "Cancel"}
              </button>

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => state.resolve(true)}
                className={`rounded-xl px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  type === "danger"
                    ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/30 focus-visible:outline-rose-500"
                    : type === "warning"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/30 focus-visible:outline-amber-500"
                    : type === "success"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/30 focus-visible:outline-emerald-500"
                    : "bg-gradient-to-r from-[#7B4DFF] to-[#6A3CF0] hover:from-[#6A3CF0] hover:to-[#5A18C9] shadow-[#7B4DFF]/30 focus-visible:outline-[#7B4DFF]"
                }`}
              >
                {state.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
