"use client";

import { useApi } from "@/hooks/useApi";
import type { PublicBarangay } from "@/lib/barangays";

/** Barangay list for the landing page, loaded from Laravel (no hardcoded list in the frontend). */
export function useBarangays() {
  const { data, loading, error, retry } = useApi<{ data: PublicBarangay[] }>("/api/public/barangays");
  return { barangays: data?.data ?? [], loading, error, retry };
}
