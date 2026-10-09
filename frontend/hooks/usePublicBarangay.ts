"use client";

import { useApi } from "@/hooks/useApi";
import type { PublicBarangayDetail } from "@/lib/publicInfo";

/** One barangay's public information: GET /api/public/barangays/{id} */
export function usePublicBarangay(id: string | number) {
  return useApi<PublicBarangayDetail>(`/api/public/barangays/${id}`);
}
