"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

/* ── Helpers & Formatting ── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

interface CategoryMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconText?: string;
  actionText: string;
  icon: (cls?: string) => React.ReactNode;
}

function getCategoryMeta(type: string): CategoryMeta {
  if (type.startsWith("requirement")) {
    return {
      label: "Directive",
      badgeBg: "bg-[#F1EBFF] dark:bg-[#2F2154]",
      badgeText: "text-[#7B4DFF] dark:text-[#CDBBFF]",
      iconBg: "bg-[#7B4DFF]/15 text-[#7B4DFF] dark:bg-[#7B4DFF]/30 dark:text-[#D1C4F9]",
      actionText: "Comply Directive",
      icon: (cls = "h-4 w-4") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
    };
  }

  if (type.startsWith("submission") || type.startsWith("report")) {
    return {
      label: "Report Review",
      badgeBg: "bg-[#E6FBF3] dark:bg-[#0D382D]",
      badgeText: "text-[#059669] dark:text-[#84DEBD]",
      iconBg: "bg-[#06D6A0]/15 text-[#059669] dark:bg-[#06D6A0]/30 dark:text-[#6EE7B7]",
      actionText: "View Submission",
      icon: (cls = "h-4 w-4") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    };
  }

  if (type.startsWith("resource")) {
    return {
      label: "Resource Library",
      badgeBg: "bg-[#E8FAFF] dark:bg-[#0B3545]",
      badgeText: "text-[#0284C7] dark:text-[#7DD3FC]",
      iconBg: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/30 dark:text-sky-300",
      actionText: "Open Resource",
      icon: (cls = "h-4 w-4") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    };
  }

  if (type.startsWith("repository")) {
    return {
      label: "Repository",
      badgeBg: "bg-[#FFF8E6] dark:bg-[#3D2C0D]",
      badgeText: "text-[#D97706] dark:text-[#FDE68A]",
      iconBg: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/30 dark:text-amber-300",
      actionText: "Inspect File",
      icon: (cls = "h-4 w-4") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 19 2 19" />
          <polygon points="4 5 10 5 12 8 20 8 20 19 4 19" />
        </svg>
      ),
    };
  }

  return {
    label: "Notice",
    badgeBg: "bg-slate-100 dark:bg-white/10",
    badgeText: "text-slate-600 dark:text-slate-300",
    iconBg: "bg-[#7B4DFF]/15 text-[#7B4DFF] dark:bg-[#7B4DFF]/30 dark:text-[#D1C4F9]",
    actionText: "View Details",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  };
}

/* ── Notification Item Row ── */

function NotificationRow({
  notif,
  onRead,
  onDelete,
  onNavigate,
}: {
  notif: AppNotification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: (url: string) => void;
}) {
  const unread = !notif.read_at;
  const meta = getCategoryMeta(notif.type);

  const handleClick = () => {
    if (unread) onRead(notif.id);
    if (notif.action_url) onNavigate(notif.action_url);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative w-full text-left p-4 transition-all duration-200 cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-slate-50/90 dark:hover:bg-white/[0.04] ${unread ? "bg-purple-50/40 dark:bg-[#201836]/40" : ""
        }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Category Icon */}
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${meta.iconBg}`}
        >
          {meta.icon("h-4.5 w-4.5")}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${meta.badgeBg} ${meta.badgeText}`}
            >
              {meta.label}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              &bull; {timeAgo(notif.created_at)}
            </span>
            {unread && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#7B4DFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7B4DFF] animate-pulse" />
                New
              </span>
            )}
          </div>

          <h4
            className={`text-sm leading-snug tracking-tight ${unread
                ? "font-bold text-slate-900 dark:text-white"
                : "font-medium text-slate-700 dark:text-slate-200"
              }`}
          >
            {notif.title}
          </h4>

          {notif.body && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
              {notif.body}
            </p>
          )}

          {/* Sub-footer: Actor & Action Callout */}
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
              {notif.actor?.name ? `From: ${notif.actor.name}` : "DILG Field Office Makati"}
            </span>

            {notif.action_url && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#7B4DFF] dark:text-[#CDBBFF] group-hover:translate-x-0.5 transition-transform">
                {meta.actionText} &rarr;
              </span>
            )}
          </div>
        </div>

        {/* Action icons (mark read / dismiss) on hover */}
        <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {unread && (
            <button
              type="button"
              title="Mark as read"
              onClick={(e) => {
                e.stopPropagation();
                onRead(notif.id);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-[#7B4DFF] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            title="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="28" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Bell & Notification Center ── */

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "directives" | "reports">("all");

  const {
    unreadCount,
    notifications,
    loading,
    open,
    latestToast,
    dismissToast,
    toggle,
    close,
    markRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
    refresh,
  } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  const handleNavigate = (url: string) => {
    close();
    router.push(url);
  };

  // Filtered notifications based on activeTab
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read_at);
      case "directives":
        return notifications.filter((n) => n.type.startsWith("requirement"));
      case "reports":
        return notifications.filter((n) => n.type.startsWith("submission") || n.type.startsWith("report"));
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      {/* ── Bell Trigger Button ── */}
      <button
        onClick={toggle}
        type="button"
        aria-expanded={open}
        aria-label={`System Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative group grid h-10 w-10 place-items-center rounded-full border border-slate-200 dark:border-white/15 bg-white/70 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-slate-200 transition-all duration-300 hover:border-[#7B4DFF]/60 hover:bg-[#F3EDFE]/60 dark:hover:bg-[#7B4DFF]/15 hover:text-[#7B4DFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Live Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#7B4DFF] to-[#6A3CF0] px-1 text-[10px] font-black tracking-tight text-white shadow-md ring-2 ring-white dark:ring-[#150F22] animate-in zoom-in-75 duration-300">
            <span className="absolute inset-0 rounded-full bg-[#7B4DFF] opacity-40 animate-ping" />
            <span className="relative z-10">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* ── Real-Time Toast Preview (Slide-down banner) ── */}
      {latestToast && !open && (
        <div
          role="alert"
          onClick={() => {
            markRead(latestToast.id);
            if (latestToast.action_url) router.push(latestToast.action_url);
            dismissToast();
          }}
          className="fixed top-5 right-5 z-50 w-84 sm:w-96 rounded-2xl bg-white/95 dark:bg-[#1C142E]/95 backdrop-blur-2xl border border-[#7B4DFF]/30 p-4 shadow-2xl shadow-[#7B4DFF]/20 cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300 transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7B4DFF]/15 text-[#7B4DFF] dark:text-[#CDBBFF]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4DFF] dark:text-[#CDBBFF]">
                  New Notification
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast();
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white truncate">
                {latestToast.title}
              </p>
              {latestToast.body && (
                <p className="text-[11px] text-slate-500 dark:text-slate-300 line-clamp-1 mt-0.5">
                  {latestToast.body}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Executive Notification Center Panel ── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-[360px] sm:w-[440px] max-h-[34rem] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#181126]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/20 dark:shadow-black/70 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="font-semibold text-[#7B4DFF] hover:text-[#5A18C9] dark:text-[#CDBBFF] dark:hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-white/20">&bull;</span>
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="font-medium text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/5 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "All", count: notifications.length },
              { id: "unread", label: "Unread", count: unreadCount },
              { id: "directives", label: "Directives", count: notifications.filter((n) => n.type.startsWith("requirement")).length },
              { id: "reports", label: "Reports", count: notifications.filter((n) => n.type.startsWith("submission") || n.type.startsWith("report")).length },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${active
                      ? "bg-[#7B4DFF] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${active
                          ? "bg-white/25 text-white"
                          : "bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notifications Scrollable Feed */}
          <div className="flex-1 overflow-y-auto max-h-[22rem] divide-y divide-slate-100 dark:divide-white/5">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7B4DFF] border-t-transparent" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Syncing telemetry feed...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {activeTab === "unread" ? "Zero Unread Alerts" : "All Caught Up"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px]">
                  {activeTab === "unread"
                    ? "You have reviewed all pending notifications and directives."
                    : "Official directives and report compliance alerts will show up here in real time."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Automated Institutional Telemetry
            </span>
            <button
              type="button"
              onClick={() => refresh()}
              className="text-[#7B4DFF] dark:text-[#CDBBFF] font-semibold hover:underline"
            >
              Refresh &orarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
