"use client";

import { useMemo, useState } from "react";
import type { MonthTrendPoint } from "@/hooks/useRealtimeAnalytics";

interface RealtimeComplianceChartProps {
  trend: MonthTrendPoint[];
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  loading?: boolean;
}

export default function RealtimeComplianceChart({
  trend,
  title = "Reporting Compliance Trend",
  subtitle = "Aggregate performance across monthly submission milestones",
  badgeLabel,
  loading = false,
}: RealtimeComplianceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter or default trend points
  const points = useMemo(() => {
    if (trend && trend.length > 0) return trend;
    return [
      { month: "2026-04", label: "Apr", due: 0, filed: 0, compliant: 0, rate: 0 },
      { month: "2026-05", label: "May", due: 5, filed: 5, compliant: 5, rate: 100 },
      { month: "2026-06", label: "Jun", due: 10, filed: 10, compliant: 10, rate: 100 },
      { month: "2026-07", label: "Jul", due: 10, filed: 10, compliant: 10, rate: 100 },
      { month: "2026-08", label: "Aug", due: 10, filed: 10, compliant: 10, rate: 100 },
      { month: "2026-09", label: "Sep", due: 10, filed: 10, compliant: 5, rate: 50 },
      { month: "2026-10", label: "Oct", due: 7, filed: 7, compliant: 2, rate: 29 },
    ];
  }, [trend]);

  // SVG dimensions
  const W = 460;
  const H = 210;
  const L = 36;
  const R = 20;
  const T = 30;
  const B = 35;
  const plotW = W - L - R;
  const plotH = H - T - B;

  // Compute maximum Y bound
  const maxVal = useMemo(() => {
    const highest = Math.max(
      1,
      ...points.map((p) => Math.max(p.due || 0, p.filed || 0, p.compliant || 0)),
    );
    // Round up to clean scale step
    if (highest <= 5) return 5;
    if (highest <= 10) return 10;
    if (highest <= 20) return 20;
    if (highest <= 50) return 50;
    return Math.ceil(highest / 10) * 10;
  }, [points]);

  const xCoord = (index: number) => {
    if (points.length <= 1) return L + plotW / 2;
    return L + (index * plotW) / (points.length - 1);
  };

  const yCoord = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return T + (1 - ratio) * plotH;
  };

  // Build SVG path commands
  const filedCoords = points.map((p, i) => ({ x: xCoord(i), y: yCoord(p.filed) }));
  const compliantCoords = points.map((p, i) => ({ x: xCoord(i), y: yCoord(p.compliant) }));

  const buildPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const filedPath = buildPath(filedCoords);
  const compliantPath = buildPath(compliantCoords);

  // Area paths for gradient fills
  const filedArea = filedCoords.length > 0
    ? `${filedPath} L ${filedCoords[filedCoords.length - 1].x} ${T + plotH} L ${filedCoords[0].x} ${T + plotH} Z`
    : "";
  const compliantArea = compliantCoords.length > 0
    ? `${compliantPath} L ${compliantCoords[compliantCoords.length - 1].x} ${T + plotH} L ${compliantCoords[0].x} ${T + plotH} Z`
    : "";

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeX = hoverIndex !== null ? xCoord(hoverIndex) : null;

  // Latest / peak compliance rate
  const latestPoint = points[points.length - 1];
  const peakRate = Math.max(...points.map((p) => p.rate));

  return (
    <div className="relative">
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {badgeLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-[#2C2145] px-2.5 py-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
              {badgeLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Real-Time
          </span>
        </div>
      </div>

      {/* Legend & Summary Tally */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F21DB4]" />
            Filed Reports ({latestPoint?.filed ?? 0})
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7B4DFF]" />
            Compliant &amp; Cleared ({latestPoint?.compliant ?? 0})
          </span>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Peak Performance: <strong className="text-emerald-500">{peakRate}%</strong>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label="Real-time compliance line chart"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="filedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F21DB4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F21DB4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="compliantGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7B4DFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7B4DFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = T + (1 - ratio) * plotH;
            const val = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={L}
                  x2={W - R}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/10"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? "0" : "2 2"}
                />
                <text
                  x={L - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  className="text-slate-400 dark:text-slate-500 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Gradient fills */}
          {filedArea && <path d={filedArea} fill="url(#filedGradient)" />}
          {compliantArea && <path d={compliantArea} fill="url(#compliantGradient)" />}

          {/* Curves */}
          {filedPath && (
            <path
              d={filedPath}
              fill="none"
              stroke="#F21DB4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {compliantPath && (
            <path
              d={compliantPath}
              fill="none"
              stroke="#7B4DFF"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Crosshair on hover */}
          {activeX !== null && (
            <line
              x1={activeX}
              x2={activeX}
              y1={T}
              y2={T + plotH}
              stroke="#7B4DFF"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-70"
            />
          )}

          {/* Interactive touch/hover points */}
          {points.map((p, i) => {
            const x = xCoord(i);
            const yCompliant = yCoord(p.compliant);
            const isHovered = hoverIndex === i;

            return (
              <g
                key={p.month}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* Hit area */}
                <rect
                  x={x - plotW / points.length / 2}
                  y={T}
                  width={plotW / points.length}
                  height={plotH}
                  fill="transparent"
                />

                {/* Point circle for compliant */}
                <circle
                  cx={x}
                  cy={yCompliant}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? "#06D6A0" : "#7B4DFF"}
                  stroke="#fff"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* X Axis Month Label */}
                <text
                  x={x}
                  y={H - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className={`font-semibold transition-colors ${
                    isHovered
                      ? "text-[#7B4DFF] dark:text-[#CDBBFF]"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {active && activeX !== null && (
          <div
            className="pointer-events-none absolute z-20 -top-2 rounded-xl bg-slate-900/95 dark:bg-black/95 text-white px-3 py-2 text-xs shadow-xl backdrop-blur-md border border-white/10 -translate-x-1/2 transition-all duration-150"
            style={{ left: `${(activeX / W) * 100}%` }}
          >
            <p className="font-bold text-[11px] text-slate-300">{active.label} ({active.month})</p>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F21DB4]" />
                <span className="text-[11px] text-slate-300">Filed:</span>
                <strong className="text-white ml-auto">{active.filed}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7B4DFF]" />
                <span className="text-[11px] text-slate-300">Compliant:</span>
                <strong className="text-[#84DEBD] ml-auto">{active.compliant}</strong>
              </div>
              <div className="border-t border-white/10 pt-1 mt-1 text-[11px] font-semibold text-amber-300">
                Compliance: {active.rate}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
