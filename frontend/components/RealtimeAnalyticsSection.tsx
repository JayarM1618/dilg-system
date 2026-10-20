"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBarangays } from "@/hooks/useBarangays";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import RealtimeComplianceChart, { type ChartTabItem } from "./RealtimeComplianceChart";
import RealtimePeriodTally from "./RealtimePeriodTally";

interface RealtimeAnalyticsSectionProps {
  actionHref?: string;
  actionLabel?: string;
  title?: string;
  defaultBarangayId?: number | null;
  restrictedToBarangayId?: number | null;
  restrictedBarangayName?: string;
}

export default function RealtimeAnalyticsSection({
  actionHref = "/borms/reports",
  actionLabel = "Inspect active reports",
  title = "Real-Time Compliance Analytics",
  defaultBarangayId = null,
  restrictedToBarangayId = null,
  restrictedBarangayName,
}: RealtimeAnalyticsSectionProps) {
  const effectiveDefaultId = restrictedToBarangayId ?? defaultBarangayId;
  const { barangays, loading: barangaysLoading } = useBarangays();
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(effectiveDefaultId);
  const [activeTab, setActiveTab] = useState<"citywide" | "barangay" | "compare">(effectiveDefaultId ? "barangay" : "citywide");
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  // Sync initial default ONCE when session or barangays resolve (do NOT override user clicking "All Barangays")
  useEffect(() => {
    if (hasInitializedRef.current) return;
    const targetId = restrictedToBarangayId ?? defaultBarangayId;
    if (targetId) {
      setSelectedBarangayId(targetId);
      setActiveTab("barangay");
      hasInitializedRef.current = true;
    }
  }, [defaultBarangayId, restrictedToBarangayId]);

  // 1. Citywide real-time data stream (always active)
  const citywideRealtime = useRealtimeAnalytics({ pollInterval: 8000 });

  // 2. Specific barangay real-time data stream (always active for representative's barangay or selected barangay)
  const activeQueryBarangayId = (selectedBarangayId ?? restrictedToBarangayId) ?? undefined;
  const barangayRealtime = useRealtimeAnalytics({
    barangayId: activeQueryBarangayId,
    pollInterval: 8000,
  });

  // Current selected barangay entity
  const selectedBarangay = useMemo(() => {
    if (!selectedBarangayId) return null;
    return (
      barangays.find((b) => b.id === selectedBarangayId) ??
      (restrictedToBarangayId && selectedBarangayId === restrictedToBarangayId && restrictedBarangayName
        ? { id: restrictedToBarangayId, name: restrictedBarangayName, code: "" }
        : null)
    );
  }, [barangays, selectedBarangayId, restrictedToBarangayId, restrictedBarangayName]);

  // If restricted (barangay representative), resolve their assigned barangay
  const assignedBarangay = useMemo(() => {
    if (restrictedToBarangayId) {
      return (
        barangays.find((b) => b.id === restrictedToBarangayId) ??
        (restrictedBarangayName ? { id: restrictedToBarangayId, name: restrictedBarangayName, code: "" } : null)
      );
    }
    return null;
  }, [barangays, restrictedToBarangayId, restrictedBarangayName]);

  // The active barangay context (either selected, or assigned to representative)
  const contextBarangay = selectedBarangay ?? assignedBarangay;

  // Only display authorized barangays (if restricted to representative's barangay, filter out all other barangays)
  const displayedBarangays = useMemo(() => {
    if (restrictedToBarangayId) {
      const match = barangays.find((b) => b.id === restrictedToBarangayId);
      if (match) return [match];
      if (restrictedBarangayName) return [{ id: restrictedToBarangayId, name: restrictedBarangayName, code: "" }];
      return [];
    }
    return barangays;
  }, [barangays, restrictedToBarangayId, restrictedBarangayName]);

  // Handle selecting a barangay from dropdown
  const handleSelectBarangay = (bId: number | null) => {
    if (restrictedToBarangayId && bId !== null && bId !== restrictedToBarangayId) {
      bId = restrictedToBarangayId;
    }
    setSelectedBarangayId(bId);
    if (bId) {
      setActiveTab("barangay");
    } else {
      setActiveTab("citywide");
      setIsSideBySide(false);
    }
  };

  // Handle switching tabs on the chart
  const handleTabChange = (tabId: "citywide" | "barangay" | "compare") => {
    setActiveTab(tabId);
    if (tabId === "citywide") {
      setSelectedBarangayId(null);
    } else if (tabId === "barangay") {
      if (assignedBarangay && !selectedBarangayId) {
        setSelectedBarangayId(assignedBarangay.id);
      }
    }
  };

  // Build tabs for the chart
  const chartTabs: ChartTabItem[] = useMemo(() => {
    const list: ChartTabItem[] = [
      {
        id: "citywide",
        label: "Citywide (All 23 Barangays)",
        active: activeTab === "citywide",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        ),
      },
    ];

    if (contextBarangay) {
      list.push({
        id: "barangay",
        label: `Barangay ${contextBarangay.name}`,
        active: activeTab === "barangay",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        ),
      });

      list.push({
        id: "compare",
        label: `Compare (${contextBarangay.name} vs Citywide)`,
        active: activeTab === "compare",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      });
    }

    return list;
  }, [contextBarangay, activeTab]);

  // Dynamic titles and subtitles based on activeTab
  const getChartDetails = () => {
    if (activeTab === "compare" && contextBarangay) {
      return {
        title: `${contextBarangay.name} vs Citywide Compliance Rate`,
        subtitle: `Monthly compliance comparison (%) between Barangay ${contextBarangay.name} and Makati citywide average`,
        badge: "Comparative Trend",
        trend: citywideRealtime.data?.monthly_trend ?? [],
        compareTrend: barangayRealtime.data?.monthly_trend ?? [],
        isComparison: true,
      };
    }

    if (activeTab === "barangay" && contextBarangay) {
      return {
        title: `${contextBarangay.name} Compliance Trend`,
        subtitle: `Monthly reporting compliance & milestones for Barangay ${contextBarangay.name}`,
        badge: `Barangay ${contextBarangay.name}`,
        trend: barangayRealtime.data?.monthly_trend ?? [],
        compareTrend: undefined,
        isComparison: false,
      };
    }

    return {
      title: "Citywide Compliance Trend",
      subtitle: "Aggregate monthly compliance across all 23 barangays",
      badge: "All Barangays",
      trend: citywideRealtime.data?.monthly_trend ?? [],
      compareTrend: undefined,
      isComparison: false,
    };
  };

  const chartDetails = getChartDetails();

  return (
    <div className="space-y-4">
      {/* ── Real‑Time Analytics Layout ── */}
      {isSideBySide && contextBarangay ? (
        // Side-by-side mode: Both Citywide and Barangay charts displayed concurrently
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7B4DFF] animate-ping" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Side-by-Side Analytics: Citywide vs Barangay {contextBarangay.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSideBySide(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
              Single Chart View
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart 1: Citywide */}
            <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <RealtimeComplianceChart
                trend={citywideRealtime.data?.monthly_trend ?? []}
                title="Citywide Compliance Trend"
                subtitle="Aggregate monthly compliance across all 23 barangays"
                badgeLabel="All Barangays"
                loading={citywideRealtime.loading}
              />
            </div>

            {/* Chart 2: Selected Barangay */}
            <div className="rounded-2xl bg-white dark:bg-[#181126] border-2 border-[#7B4DFF]/30 dark:border-[#7B4DFF]/40 shadow-sm p-6">
              <RealtimeComplianceChart
                trend={barangayRealtime.data?.monthly_trend ?? []}
                title={`${contextBarangay.name} Compliance Trend`}
                subtitle={`Specific monthly performance for Barangay ${contextBarangay.name}`}
                badgeLabel={`Barangay ${contextBarangay.name}`}
                loading={barangayRealtime.loading}
              />
            </div>
          </div>

          {/* Barangay Status Tally card in full width */}
          <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Active Filter
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    Barangay {contextBarangay.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectBarangay(null)}
                    className="text-xs text-[#7B4DFF] hover:underline"
                  >
                    View All Barangays (Makati Citywide)
                  </button>
                </div>
              </div>
            </div>

            <RealtimePeriodTally
              total={barangayRealtime.data?.total ?? 0}
              compliant={barangayRealtime.data?.compliant ?? 0}
              underReview={barangayRealtime.data?.under_review ?? 0}
              pending={barangayRealtime.data?.pending ?? 0}
              nonCompliant={barangayRealtime.data?.non_compliant ?? 0}
              complianceRate={barangayRealtime.data?.compliance_rate ?? 0}
              title={`${contextBarangay.name} Compliance Status`}
              subtitle={`Barangay ${contextBarangay.name}`}
              actionHref={actionHref}
              actionLabel={actionLabel}
            />
          </div>
        </div>
      ) : (
        // Standard Balanced View: Chart on left (col-span-7), Selector & Tally on right (col-span-5)
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Trend Chart */}
          <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-7 p-6 flex flex-col justify-between">
            <RealtimeComplianceChart
              trend={chartDetails.trend}
              compareTrend={chartDetails.compareTrend}
              isComparison={chartDetails.isComparison}
              primaryLabel="Citywide Average"
              compareLabel={contextBarangay ? `Barangay ${contextBarangay.name}` : "Barangay"}
              title={chartDetails.title}
              subtitle={chartDetails.subtitle}
              badgeLabel={chartDetails.badge}
              loading={activeTab === "citywide" ? citywideRealtime.loading : barangayRealtime.loading}
              tabs={chartTabs}
              onTabChange={(tabId) => handleTabChange(tabId as "citywide" | "barangay" | "compare")}
              extraActions={
                contextBarangay ? (
                  <button
                    type="button"
                    onClick={() => setIsSideBySide(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-[#7B4DFF] dark:text-[#CDBBFF] border border-[#7B4DFF]/20 transition-colors"
                    title="View Citywide and Barangay charts side by side"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="18" rx="1" />
                      <rect x="14" y="3" width="7" height="18" rx="1" />
                    </svg>
                    Side-by-Side
                  </button>
                ) : null
              }
            />
          </div>

          {/* Right Card: Barangay Selector & Status Tally */}
          <div className="rounded-2xl bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-5 p-6 flex flex-col justify-between">
            <div>
              {/* Select Barangay Control */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="barangay-select" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7B4DFF]">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Select Scope / Barangay
                  </label>
                  {selectedBarangayId && (
                    <button
                      type="button"
                      onClick={() => handleSelectBarangay(null)}
                      className="text-xs text-[#7B4DFF] dark:text-[#CDBBFF] font-medium hover:underline"
                    >
                      View All Barangays
                    </button>
                  )}
                </div>

                <select
                  id="barangay-select"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#1f1733] p-2.5 text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#7B4DFF] transition-all"
                  value={selectedBarangayId ?? ""}
                  onChange={(e) => handleSelectBarangay(e.target.value ? Number(e.target.value) : null)}
                  disabled={barangaysLoading}
                >
                  <option value="">All Barangays (Makati Citywide)</option>
                  {displayedBarangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {restrictedToBarangayId ? `${b.name} (Your Barangay)` : b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Tally */}
              <RealtimePeriodTally
                total={selectedBarangay ? (barangayRealtime.data?.total ?? 0) : (citywideRealtime.data?.total ?? 0)}
                compliant={selectedBarangay ? (barangayRealtime.data?.compliant ?? 0) : (citywideRealtime.data?.compliant ?? 0)}
                underReview={selectedBarangay ? (barangayRealtime.data?.under_review ?? 0) : (citywideRealtime.data?.under_review ?? 0)}
                pending={selectedBarangay ? (barangayRealtime.data?.pending ?? 0) : (citywideRealtime.data?.pending ?? 0)}
                nonCompliant={selectedBarangay ? (barangayRealtime.data?.non_compliant ?? 0) : (citywideRealtime.data?.non_compliant ?? 0)}
                complianceRate={selectedBarangay ? (barangayRealtime.data?.compliance_rate ?? 0) : (citywideRealtime.data?.compliance_rate ?? 0)}
                title={selectedBarangay ? `${selectedBarangay.name} Compliance Status` : "Compliance Status Overview"}
                subtitle={selectedBarangay ? `Barangay ${selectedBarangay.name}` : "All Barangays (Makati Citywide)"}
                actionHref={actionHref}
                actionLabel={actionLabel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
