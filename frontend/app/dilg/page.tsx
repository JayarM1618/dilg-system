"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roles";
import { useBarangays } from "@/hooks/useBarangays";
import type { SubmissionStatus } from "@/types";
import NotificationBell from "@/components/NotificationBell";
import RealtimeComplianceChart from "@/components/RealtimeComplianceChart";
import RealtimePeriodTally from "@/components/RealtimePeriodTally";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SECTIONS = [
  { id: "journey", label: "A report's trip", icon: "route" },
  { id: "statuses", label: "Statuses", icon: "shield" },
  { id: "faq", label: "FAQ", icon: "help" },
] as const;


const STEPS = [
  { title: "Office opens a period", body: "Each barangay gets the report, its period and a due date.", color: "#7B4DFF" },
  { title: "Barangay files it", body: "The representative uploads the finished report before the deadline.", color: "#06D6A0" },
  { title: "Office reviews", body: "Staff mark it compliant, or send it back with remarks.", color: "#F5B800" },
  { title: "Talaghayan updates", body: "The tally changes instantly. No spreadsheet re-encoding.", color: "#F21DB4" },
];

const STATUSES: { status: SubmissionStatus; meaning: string }[] = [
  { status: "pending", meaning: "Assigned, but the barangay hasn't filed it yet." },
  { status: "submitted", meaning: "Uploaded and waiting for the office." },
  { status: "under_review", meaning: "Office staff are checking it." },
  { status: "compliant", meaning: "Accepted. Counts toward the compliance rate." },
  { status: "non_compliant", meaning: "Needs fixing. The reviewer's remarks show on the dashboard." },
];

const FAQ = [
  { q: "How do I get an account?", a: "Ask the DILG Makati office. Accounts are created for you, so there is no public sign-up." },
  { q: "Can barangays see each other's reports?", a: "No. A barangay sees only its own reports. Only office staff see every barangay in the Talaghayan." },
  { q: "What happens when a report is non-compliant?", a: "The reviewer adds remarks explaining what to fix, and they appear next to the report on your dashboard." },
];



const card = "min-w-0 rounded-3xl p-6";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DilgSignInPage() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<string>("journey");
  const [menuOpen, setMenuOpen] = useState(false);
  const { barangays } = useBarangays();
  const realtime = useRealtimeAnalytics({ pollInterval: 8000 });

  const cta = user ? { href: homeFor(user.role), label: "Go to dashboard" } : { href: "/login", label: "Sign in" };

  // Highlights the current section in the icon menu while scrolling.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setSection(top.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      {/* Static atmospheric glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/40 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Full-width System Navigation Header */}
      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] hover:bg-[#E3D5FF] dark:bg-[#2C2344] dark:text-[#CDBBFF] ${focusRing}`} aria-label="Go back to home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#06D6A0] animate-pulse" />
              DILG Central Command &bull; Real-Time
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && <NotificationBell />}
            <Link
              href={cta.href}
              className={`rounded-full bg-[#7B4DFF] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors ${focusRing} ${loading ? "invisible" : ""}`}
            >
              {cta.label}
            </Link>
            <span
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#E3D5FF] text-sm font-semibold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF]"
              aria-hidden="true"
            >
              {user ? user.name.trim().charAt(0).toUpperCase() : <ShieldIcon />}
            </span>
          </div>
        </div>
      </header>

      {/* Full-width Main Area */}
      <main className="relative z-10 w-full flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Full-width Landscape Hero Banner */}
        <section
          className={`${card} relative overflow-hidden bg-gradient-to-br from-[#E6FBF3]/90 via-[#F3EDFE]/80 to-[#E8FAFF]/90 dark:from-[#132A24]/90 dark:via-[#1F1833]/80 dark:to-[#122A30]/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-lg p-6 sm:p-10`}
          aria-labelledby="hero-title"
        >
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left: Info & actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/80 dark:bg-black/30 px-3.5 py-1 text-xs font-semibold text-[#0E5440] dark:text-[#84DEBD] ring-1 ring-[#06D6A0]/30 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#06D6A0] animate-pulse" />
                DILG Field Office &bull; Makati City
              </div>

              <h1 id="hero-title" className="mt-4 text-balance text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0E2B24] dark:text-[#E8F8F3] leading-tight">
                Barangay Compliance &amp; Oversight Console
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#2C5A4D] dark:text-[#A8E2CF]">
                Every barangay submission audited in one unified system. Review uploaded reports, append administrative remarks, verify compliance benchmarks, and track citywide governance performance without manual spreadsheets.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={cta.href}
                  className={`inline-flex items-center gap-2 rounded-full bg-[#7B4DFF] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
                >
                  {cta.label} &rarr;
                </Link>
                <a
                  href="#journey"
                  className={`inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/20 transition-colors ${focusRing}`}
                >
                  Workflow Guide
                </a>
              </div>
            </div>

            {/* Right: Telemetry KPI Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total LGUs</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">{barangays.length}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Makati Barangays</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compliance Rate</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#06D6A0]">
                  {realtime.data ? `${Math.round(realtime.data.compliance_rate)}%` : "100%"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">City Audit Clearance</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Audit Protocol</p>
                <p className="mt-2 text-xl font-bold text-[#06D6A0]">R.A. 7160</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Statutory Compliance</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white/90 dark:bg-black/40 p-5 ring-1 ring-white/60 dark:ring-white/10 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Processing</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xl font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">Real-Time</p>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Automated Tally</p>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Live Real-Time Analytics in 2 Balanced Columns */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className={`${card} bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-7`} aria-labelledby="sample-line">
            <RealtimeComplianceChart
              trend={realtime.data?.monthly_trend ?? []}
              title="Citywide Compliance Trajectory"
              subtitle="Continuous evaluation across monthly submission periods"
              badgeLabel="Makati Citywide"
              loading={realtime.loading}
            />
          </section>

          <section className={`${card} flex flex-col justify-between bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-5`} aria-labelledby="sample-ring">
            <RealtimePeriodTally
              total={realtime.data?.total ?? 0}
              compliant={realtime.data?.compliant ?? 0}
              underReview={realtime.data?.under_review ?? 0}
              pending={realtime.data?.pending ?? 0}
              nonCompliant={realtime.data?.non_compliant ?? 0}
              complianceRate={realtime.data?.compliance_rate ?? 100}
              title="Monthly Verification Summary"
              subtitle="Overall compliance clearance across all 24 barangays"
              actionHref={cta.href}
              actionLabel="Open DILG console"
            />
          </section>
        </div>

        {/* Row 3: Workflow Pipeline + Status Taxonomy */}
        <div className="grid gap-6 lg:grid-cols-5">
          <section id="journey" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8 lg:col-span-3`} aria-labelledby="journey-title">
            <h2 id="journey-title" className="text-xl font-bold text-slate-900 dark:text-white">Audit &amp; Reporting Lifecycle</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standard operating procedure from period launch to acceptance.</p>
            <ol className="mt-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute left-4.75 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-slate-200 dark:bg-white/10" />
                  )}
                  <span
                    className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: s.color }}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="statuses" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8 lg:col-span-2`} aria-labelledby="statuses-title">
            <h2 id="statuses-title" className="text-xl font-bold text-slate-900 dark:text-white">Compliance Status Guide</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Institutional verification criteria.</p>
            <ul className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
              {STATUSES.map((s) => (
                <li key={s.status} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-3">
                  <span className="shrink-0 sm:w-28"><StatusBadge status={s.status} /></span>
                  <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{s.meaning}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* FAQ Accordion */}
        <section id="faq" className={`${card} scroll-mt-6 bg-white dark:bg-[#181126] border border-slate-200 dark:border-white/10 shadow-sm sm:p-8`} aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-xl font-bold text-slate-900 dark:text-white">DILG Administration &amp; Operations FAQ</h2>
          <div className="mt-5 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/5">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm text-slate-900 dark:text-slate-100 ${focusRing}`}>
                  {f.q}
                  <span aria-hidden="true" className="text-lg leading-none text-[#7B4DFF] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-xs leading-5 text-slate-600 dark:text-slate-300 border-t border-slate-200/50 dark:border-white/5 pt-2.5">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing Action Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7B4DFF] to-[#5A18C9] px-6 py-8 sm:px-10 sm:py-10 text-white shadow-md">
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Access the Central DILG Command Center</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#E9DFFF]">Log in with your official DILG Makati credentials to manage cycles, audit submissions, and export analytics.</p>
            </div>
            <Link href={cta.href} className={`w-full sm:w-auto text-center shrink-0 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#5A18C9] hover:bg-slate-50 transition-colors ${focusRing}`}>
              {cta.label} &rarr;
            </Link>
          </div>
        </section>

        <footer className="py-4 text-center text-xs text-slate-500 dark:text-[#7C6FA3]">
          &copy; {new Date().getFullYear()} Republic of the Philippines &middot; Department of the Interior and Local Government &middot; Makati City Field Office
        </footer>
      </main>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#06D6A0] px-4 py-5 text-center text-[#04281F]">
      <p className="text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

function Dot({ color, label, small = false }: { color: string; label: string; small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${small ? "h-2 w-2" : "h-2.5 w-2.5"} rounded-full`} style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function SampleChip() {
  return <span className="shrink-0 rounded-full bg-white/70 dark:bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-2.5 py-1 text-xs font-medium text-slate-600">Sample view</span>;
}

/** Decorative preview of the Talaghayan chart. Not real data, and labelled as a sample. */
function SampleLineChart() {
  return (
    <svg viewBox="0 0 300 190" className="mt-3 w-full" role="img" aria-label="Sample line chart of reports filed and reviewed over seven months">
      {[0, 25, 50, 75].map((v, i) => (
        <g key={v}>
          <line x1="30" x2="294" y1={150 - i * 38} y2={150 - i * 38} stroke="#E0D4FA" strokeWidth="1" />
          <text x="22" y={154 - i * 38} textAnchor="end" fontSize="10" fill="#7C6FA3">{v}</text>
        </g>
      ))}
      <path d="M34 128 C52 112 62 78 86 82 S120 138 140 104 S178 36 204 44 S250 90 290 76" fill="none" stroke="#7B4DFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 140 C58 126 70 80 98 84 S132 116 152 90 S186 24 208 34 S246 62 290 106" fill="none" stroke="#F21DB4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="208" x2="208" y1="40" y2="150" stroke="#7B4DFF" strokeWidth="1" strokeDasharray="3 3" />
      <g transform="translate(184 6)">
        <rect width="48" height="22" rx="5" fill="#140B33" />
        <text x="24" y="15" textAnchor="middle" fontSize="10" fill="#fff">24%</text>
      </g>
      {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => (
        <text key={m} x={34 + i * 43.3} y="176" textAnchor="middle" fontSize="10" fill="#7C6FA3">{m}</text>
      ))}
    </svg>
  );
}

function SampleRings() {
  const ring = (r: number, pct: number, color: string, track: string) => {
    const c = 2 * Math.PI * r;
    return (
      <g key={r}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 -rotate-90" role="img" aria-label="Sample progress rings">
      {ring(54, 0.92, "#F21DB4", "#FBD3EE")}
      {ring(40, 0.7, "#7B4DFF", "#E3D5FF")}
      {ring(26, 0.5, "#FFC800", "#FFF0A3")}
    </svg>
  );
}


function ShieldIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function RailIcon({ name }: { name: (typeof SECTIONS)[number]["icon"] | "grid" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "grid":
      return (<svg {...common}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>);
    case "route":
      return (<svg {...common}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" /></svg>);
    case "shield":
      return (<svg {...common}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01" /></svg>);
  }
}
