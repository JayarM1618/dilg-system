"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UseFetchOptions {
  pollInterval?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  lastUpdated: Date;
}

/**
 * GETs `path` from Laravel. Pass `null` to skip the request (e.g. until the user is known).
 * Pass `{ pollInterval: 8000 }` to auto-sync in the background.
 * Call `reload()` to fetch again after a change.
 */
export function useFetch<T>(path: string | null, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { pollInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const executeFetch = useCallback(
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
          if (err instanceof ApiError && err.status === 401) {
            setData(null);
            setError(null);
            return;
          }
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
    executeFetch(false);
  }, [executeFetch, attempt]);

  // Real-time polling
  useEffect(() => {
    if (!path || !pollInterval || pollInterval <= 0) return;

    const interval = setInterval(() => {
      executeFetch(true);
    }, pollInterval);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        executeFetch(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [executeFetch, path, pollInterval]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, loading: path === null ? false : loading, error, reload, lastUpdated };
}
