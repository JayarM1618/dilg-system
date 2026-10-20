"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UseApiOptions {
  pollInterval?: number; // ms interval to poll for real-time live data
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  lastUpdated: Date;
}

/**
 * GETs `path` on mount (and whenever it changes).
 * Pass `{ pollInterval: 8000 }` for real-time live telemetry auto-refresh.
 * Call `retry()` to refetch after an error.
 */
export function useApi<T>(path: string | null, options: UseApiOptions = {}): UseApiResult<T> {
  const { pollInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const isInitialRef = useRef(true);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (path === null) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }

      try {
        const res = await api.get<T>(path, { silent401: true });
        setData(res);
        setError(null);
        setLastUpdated(new Date());
      } catch (err: unknown) {
        if (!isBackground) {
          setError(
            err instanceof ApiError ? err.message : "Could not reach the server. Please try again.",
          );
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [path],
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData, attempt]);

  // Real-time polling when pollInterval is specified
  useEffect(() => {
    if (!path || !pollInterval || pollInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, pollInterval);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchData, path, pollInterval]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, loading: path === null ? false : loading, error, retry, lastUpdated };
}
