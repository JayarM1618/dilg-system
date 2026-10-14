"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  actor_id: number | null;
  actor?: { id: number; name: string } | null;
  read_at: string | null;
  created_at: string;
}

interface UnreadCountResponse {
  unread_count: number;
}

interface NotificationsResponse {
  data: {
    data: AppNotification[];
    current_page: number;
    last_page: number;
  };
  unread_count: number;
}

const POLL_INTERVAL = 8_000; // 8 seconds for responsive real-time notification sync

/**
 * Enterprise hook that polls notifications, tracks unread counts in real-time,
 * and handles reading, dismissing, and clearing notifications.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);
  const prevUnreadRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Poll unread count in real-time ──
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    // Only poll when window/tab is visible
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    try {
      const res = await api.get<UnreadCountResponse>("/api/notifications/unread-count", { silent401: true });
      if (res && typeof res.unread_count === "number") {
        setUnreadCount((prev) => {
          // If unread count increased, we have a new alert!
          if (prevUnreadRef.current !== null && res.unread_count > prevUnreadRef.current) {
            // Trigger quick refresh of list if already loaded or open
            api.get<NotificationsResponse>("/api/notifications?per_page=10", { silent401: true })
              .then((listRes) => {
                if (listRes?.data?.data?.length) {
                  const newest = listRes.data.data[0];
                  if (!newest.read_at) {
                    setLatestToast(newest);
                  }
                  setNotifications(listRes.data.data);
                }
              })
              .catch(() => {});
          }
          prevUnreadRef.current = res.unread_count;
          return res.unread_count;
        });
      }
    } catch {
      // silent — prevent console spam if offline or unauthenticated
    }
  }, [user]);

  // ── Auto-dismiss toast preview after 5s ──
  useEffect(() => {
    if (!latestToast) return;
    const t = setTimeout(() => setLatestToast(null), 5000);
    return () => clearTimeout(t);
  }, [latestToast]);

  // Set up polling and visibility change listener
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user, fetchUnreadCount]);

  // ── Load full list (when dropdown opens or refetched) ──
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<NotificationsResponse>("/api/notifications", { silent401: true });
      if (res?.data) {
        setNotifications(res.data.data);
        setUnreadCount(res.unread_count);
        prevUnreadRef.current = res.unread_count;
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Mark one as read ──
  const markRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (latestToast?.id === id) setLatestToast(null);
    } catch {
      // silent
    }
  }, [latestToast]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    try {
      await api.post("/api/notifications/mark-all-read");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      setLatestToast(null);
    } catch {
      // silent
    }
  }, []);

  // ── Delete a single notification ──
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.read_at) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      if (latestToast?.id === id) setLatestToast(null);
    } catch {
      // silent
    }
  }, [latestToast]);

  // ── Clear all notifications ──
  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete("/api/notifications");
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      setLatestToast(null);
    } catch {
      // silent
    }
  }, []);

  // ── Toggle dropdown ──
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) fetchNotifications();
      return next;
    });
  }, [fetchNotifications]);

  const close = useCallback(() => setOpen(false), []);

  return {
    unreadCount,
    notifications,
    loading,
    open,
    latestToast,
    dismissToast: () => setLatestToast(null),
    toggle,
    close,
    markRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
    refresh: fetchNotifications,
  };
}
