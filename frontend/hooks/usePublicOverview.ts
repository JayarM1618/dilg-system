"use client";

import { useApi } from "@/hooks/useApi";
import type { PublicBarangay } from "@/lib/barangays";
import type { PublicAnnouncement, PublicProgram } from "@/lib/publicInfo";

export type PublicCategory = { id: number; name: string; cycle: string; description: string | null };

type Overview = {
  barangays: PublicBarangay[];
  report_categories: PublicCategory[];
  stats: { upcoming_events: number; announcements: number };
  upcoming_events: PublicProgram[];
  latest_announcements: PublicAnnouncement[];
};

/** Landing data for the Citizens View, loaded from Laravel: GET /api/public/overview */
export function usePublicOverview() {
  const { data, loading, error, retry } = useApi<Overview>("/api/public/overview");
  return {
    barangays: data?.barangays ?? [],
    categories: data?.report_categories ?? [],
    stats: data?.stats ?? { upcoming_events: 0, announcements: 0 },
    events: data?.upcoming_events ?? [],
    announcements: data?.latest_announcements ?? [],
    loading,
    error,
    retry,
  };
}
