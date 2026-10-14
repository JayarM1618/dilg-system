"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

export interface MonthTrendPoint {
  month: string;
  label: string;
  due: number;
  filed: number;
  compliant: number;
  rate: number;
}

export interface RealtimeAnalyticsData {
  total: number;
  compliant: number;
  under_review: number;
  pending: number;
  non_compliant: number;
  overdue: number;
  compliance_rate: number;
  total_barangays: number;
  monthly_trend: MonthTrendPoint[];
  updated_at: string;
}

interface UseRealtimeAnalyticsOptions {
  barangayId?: number | null;
  pollInterval?: number; // ms, default 8000ms
}

export function useRealtimeAnalytics(options: UseRealtimeAnalyticsOptions = {}) {
  const { barangayId, pollInterval = 8000 } = options;

  const [data, setData] = useState<RealtimeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    // Only poll when tab is visible
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    try {
      const qs = barangayId ? `?barangay_id=${barangayId}` : "";
      const res = await api.get<RealtimeAnalyticsData>(`/api/public/analytics${qs}`, {
        silent401: true,
      });

      if (res && typeof res.total === "number") {
        setData(res);
        setError(null);
        setLastSynced(new Date());
      }
    } catch (err: unknown) {
      if (!data) {
        setError(err instanceof ApiError ? err.message : "Failed to load real-time analytics.");
      }
    } finally {
      setLoading(false);
    }
  }, [barangayId, data]);

  // Polling effect
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, pollInterval);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAnalytics();
      }
    };

    const onFocus = () => {
      fetchAnalytics();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchAnalytics, pollInterval]);

  return {
    data,
    loading,
    error,
    lastSynced,
    isLive,
    refresh: fetchAnalytics,
  };
}
