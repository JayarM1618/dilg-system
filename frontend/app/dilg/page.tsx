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
    <div className={`${poppins.className} min-h-screen bg-[#F4EEFE] text-slate-800 dark:bg-[#130E1F] dark:text-[#E9DFFF] transition-colors duration-500 ease-out p-3 sm:p-6 lg:p-8`}>
      <div className="relative mx-auto flex max-w-360 overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] dark:bg-[#1B142F] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] rounded-2xl sm:rounded-[2rem]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-[#E6FBF3] blur-3xl dark:bg-[#0B6B52]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-80 h-96 w-96 rounded-full bg-[#F3EDFE] blur-3xl dark:bg-[#5A18C9]/15" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[#FFF8E6] blur-3xl dark:bg-[#7A5B00]/15" />

        <div className="relative min-w-0 flex-1">
          {/* ---------- Top bar: brand + sign in, with a collapsible icon menu ---------- */}
          <header className="border-b border-[#EDE7FA] dark:border-[#2B2542]">
            <div className="flex items-center gap-2 sm:gap-3 px-4 py-3.5 sm:px-8 sm:py-4">
              <Link href="/" className={`grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] transition-colors hover:bg-[#E3D5FF] ${focusRing}`} aria-label="Go back to home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Link>
              <BrandMark tone="dark" />

              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="section-menu"
                aria-label={menuOpen ? "Hide page sections" : "Show page sections"}
                title={menuOpen ? "Hide sections" : "Show sections"}
                className={`grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] transition-colors hover:bg-[#E3D5FF] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out dark:hover:bg-[#2B2542] ${focusRing}`}
              >
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  className={`transition-transform duration-500 ease-out ${menuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <Link
                  href={cta.href}
                  className={`rounded-full bg-[#7B4DFF] px-3.5 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] ${focusRing} ${loading ? "invisible" : ""}`}
                >
                  {cta.label}
                </Link>
                <span
                  className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#E3D5FF] text-sm font-semibold text-[#5A18C9] dark:bg-[#352D52] dark:text-[#CDBBFF] transition-colors duration-500 ease-out"
                  aria-hidden="true"
                >
                  {user ? user.name.trim().charAt(0).toUpperCase() : <ShieldIcon />}
                </span>
              </div>
            </div>

            {/* Hidden by default; slides open when the arrow is clicked. */}
            <div
              id="section-menu"
              className={`grid transition-[grid-template-rows] duration-500 ease-out ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <nav aria-label="Page sections" className="overflow-hidden" inert={!menuOpen}>
                <ul className="flex flex-wrap items-start justify-center gap-4 px-5 pb-5 pt-1 sm:gap-6 sm:px-8">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={section === s.id ? "true" : undefined}
                        className={`group flex w-20 flex-col items-center gap-1.5 rounded-2xl ${focusRing}`}
                      >
                        <span
                          className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${section === s.id ? "bg-[#7B4DFF] text-white" : "bg-[#EADFFE] text-[#7B4DFF] group-hover:bg-[#DCCBFD]"
                            }`}
                        >
                          <RailIcon name={s.icon} />
                        </span>
                        <span className={`text-center text-xs font-medium leading-tight ${section === s.id ? "text-[#5A18C9]" : "text-slate-600"}`}>
                          {s.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>

          <main className="space-y-5 p-4 sm:p-8">
            {/* ---------- Row 1: hero + sample charts ---------- */}
            <div className="grid gap-5 lg:grid-cols-12">
              <section className={`${card} flex flex-col bg-[#E6FBF3]/70 dark:bg-[#1C362F]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-5 transition-all duration-500 ease-out`} aria-labelledby="hero-title">
                <p className="text-sm font-medium text-[#2C5A4D] dark:text-[#84DEBD] transition-colors duration-500 ease-out">Talaghayan &middot; DILG Office Dashboard</p>
                <h1 id="hero-title" className="mt-3 text-balance text-2xl font-semibold leading-tight text-[#0E2B24] dark:text-[#E8F8F3] transition-colors duration-500 ease-out sm:text-4xl">
                  Every barangay report, overseen in one place.
                </h1>
                <p className="mt-3 max-w-[44ch] text-sm sm:text-base leading-6 sm:leading-7 text-[#2C5A4D] dark:text-[#84DEBD] transition-colors duration-500 ease-out">
                  Barangays upload what is due. The office reviews it. The Talaghayan shows who is compliant, live,
                  with no more email threads or hand-updated sheets.
                </p>

                <div className="mt-auto grid grid-cols-2 gap-3 sm:gap-4 pt-6 sm:pt-7">
                  <Tile value={barangays.length} label="Barangays" />
                  <Tile value={STATUSES.length} label="Report statuses" />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                  <a href="#journey" className={`text-center rounded-full bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] ${focusRing}`}>
                    Learn how it works
                  </a>
                  <Link href={cta.href} className={`text-center rounded-full border-2 border-[#7B4DFF] px-6 py-2 text-sm font-semibold text-[#5A18C9] dark:text-[#CDBBFF] transition-colors duration-500 ease-out transition-colors hover:bg-[#7B4DFF] hover:text-white dark:hover:text-white ${focusRing}`}>
                    {cta.label}
                  </Link>
                </div>
              </section>

              <section className={`${card} bg-[#F3EDFE]/70 dark:bg-[#2A233D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-4 transition-all duration-500 ease-out`} aria-labelledby="sample-line">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="sample-line" className="text-xl font-medium text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Compliance, live</h2>
                  <SampleChip />
                </div>
                <div className="mt-3 flex gap-5 text-sm text-[#2A1F4D] dark:text-[#D1C4F9] transition-colors duration-500 ease-out">
                  <Dot color="#F21DB4" label="Filed" />
                  <Dot color="#7B4DFF" label="Reviewed" />
                </div>
                <SampleLineChart />
              </section>

              <section className={`${card} flex flex-col bg-[#FFF8E6]/70 dark:bg-[#382C10]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none lg:col-span-3 transition-all duration-500 ease-out`} aria-labelledby="sample-ring">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="sample-ring" className="text-xl font-medium text-[#2A2000] dark:text-[#FBE5A1] transition-colors duration-500 ease-out">This month</h2>
                  <SampleChip />
                </div>
                <p className="mt-2 text-sm text-[#5C4600] dark:text-[#D6B55E] transition-colors duration-500 ease-out">
                  <b className="font-semibold text-[#F5A800]">Live tally</b> of every report
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <ul className="space-y-2 text-sm text-[#2A2000] dark:text-[#FBE5A1] transition-colors duration-500 ease-out">
                    <li><Dot color="#F21DB4" label="Filed" small /></li>
                    <li><Dot color="#7B4DFF" label="Reviewed" small /></li>
                    <li><Dot color="#FFC800" label="Compliant" small /></li>
                  </ul>
                  <SampleRings />
                </div>
                <Link
                  href={cta.href}
                  className={`mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-[#FFC800] px-5 py-2 text-sm font-semibold text-[#8A6300] dark:text-[#FBE5A1] transition-colors duration-500 ease-out transition-colors hover:bg-[#FFC800] hover:text-[#2A2000] ${focusRing}`}
                >
                  {cta.label}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </section>
            </div>


            {/* ---------- Row 4: journey + statuses ---------- */}
            <div className="grid gap-5 lg:grid-cols-5">
              <section id="journey" className={`${card} scroll-mt-6 bg-[#E8FAFF]/70 dark:bg-[#15343B]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none sm:p-8 lg:col-span-3 transition-all duration-500 ease-out`} aria-labelledby="journey-title">
                <h2 id="journey-title" className="text-2xl font-semibold text-[#0B2A36] dark:text-white transition-colors duration-500 ease-out">A report&apos;s trip</h2>
                <ol className="mt-6">
                  {STEPS.map((s, i) => (
                    <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < STEPS.length - 1 && (
                        <span aria-hidden="true" className="absolute left-4.75 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-[#BFE7F3]" />
                      )}
                      <span
                        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-semibold text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {i + 1}
                      </span>
                      <div className="pt-1.5">
                        <h3 className="font-semibold text-[#0B2A36] dark:text-[#E8FAFF] transition-colors duration-500 ease-out">{s.title}</h3>
                        <p className="mt-0.5 max-w-[48ch] text-sm leading-6 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="statuses" className={`${card} scroll-mt-6 bg-[#F1F0FB]/70 dark:bg-[#1E192D]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none sm:p-8 lg:col-span-2 transition-all duration-500 ease-out`} aria-labelledby="statuses-title">
                <h2 id="statuses-title" className="text-2xl font-semibold text-[#1B1235] dark:text-[#E9DFFF] transition-colors duration-500 ease-out">Five statuses, one glance</h2>
                <ul className="mt-5 divide-y divide-[#E1DCF3]">
                  {STATUSES.map((s) => (
                    <li key={s.status} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
                      <span className="shrink-0 sm:w-32"><StatusBadge status={s.status} /></span>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">{s.meaning}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ---------- FAQ ---------- */}
            <section id="faq" className={`${card} scroll-mt-6 bg-[#FFF8E6]/70 dark:bg-[#382C10]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none sm:p-8 transition-all duration-500 ease-out`} aria-labelledby="faq-title">
              <h2 id="faq-title" className="text-2xl font-semibold text-[#2A2000] dark:text-[#FBE5A1] transition-colors duration-500 ease-out">Questions</h2>
              <div className="mt-5 space-y-3">
                {FAQ.map((f) => (
                  <details key={f.q} className="group rounded-2xl bg-white/70 dark:bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] p-5">
                    <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-out ${focusRing}`}>
                      {f.q}
                      <span aria-hidden="true" className="text-2xl leading-none text-[#7B4DFF] transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* ---------- Closing call ---------- */}
            <section className="relative overflow-hidden rounded-3xl bg-[#7B4DFF]/80 dark:bg-[#352D52]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[#7B4DFF]/15 dark:shadow-none transition-all duration-500 ease-out px-5 py-8 sm:px-10 sm:py-10 text-white">
              <div aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div aria-hidden="true" className="absolute -bottom-10 right-40 h-24 w-24 rounded-full bg-[#06D6A0]/40" />
              <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl sm:text-3xl font-semibold">Access the DILG Dashboard</h2>
                  <p className="mt-2 text-sm sm:text-base text-[#E9DFFF]">Sign in with your DILG Makati office credentials to manage and monitor reports.</p>
                </div>
                <Link href={cta.href} className={`w-full sm:w-auto text-center shrink-0 rounded-full bg-white px-7 py-3 font-semibold text-[#5A18C9] transition-transform hover:-translate-y-0.5 ${focusRing}`}>
                  {cta.label}
                </Link>
              </div>
            </section>

            <footer className="pb-2 pt-1 text-center text-sm text-slate-500 dark:text-[#7C6FA3] transition-colors duration-500 ease-out">
              &copy; {new Date().getFullYear()} Talaghayan &middot; Barangay Report Tracker
            </footer>
          </main>
        </div>
      </div>
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
