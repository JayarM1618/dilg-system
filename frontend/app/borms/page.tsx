"use client";

import { useAuth } from "@/hooks/useAuth";
import TalaghayanBoard from "@/components/TalaghayanBoard";
import BarangayDashboard from "@/components/BarangayDashboard";

/**
 * BORMS home — Barangay Operations & Resource Management System.
 * Office staff see the Talaghayan board (all-barangay overview).
 * Barangay reps see their own dashboard.
 */
export default function BormsHome() {
  const { user } = useAuth();
  if (!user) return null;

  return user.role === "barangay_rep" ? <BarangayDashboard /> : <TalaghayanBoard />;
}
