"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import StatusBadge from "@/components/StatusBadge";
import BarangayLoginDialog from "@/components/BarangayLoginDialog";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roles";
import { MAKATI_BARANGAYS, normalizeName, type MakatiBarangay } from "@/lib/makatiBarangays";
import type { SubmissionStatus } from "@/types";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SECTIONS = [
  { id: "barangays", label: "Barangays", icon: "grid" },
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

// Pastel avatar colours for the barangay tiles, cycled by position.
const AVATARS = [
  { bg: "#BDF3DE", fg: "#0B6B52" },
  { bg: "#E3D5FF", fg: "#5A18C9" },
  { bg: "#FFF0A3", fg: "#7A5B00" },
  { bg: "#C5F0FF", fg: "#0B6180" },
  { bg: "#FFCDE6", fg: "#A0124F" },
];

const card = "min-w-0 rounded-3xl p-6";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<string>("barangays");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<MakatiBarangay | null>(null);

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

  const q = normalizeName(query);
  const shown = useMemo(
    () => MAKATI_BARANGAYS.filter((b) => !q || normalizeName(b.name).includes(q) || b.code.toLowerCase().includes(q)),
    [q],
  );

  const isRep = user?.role === "barangay_rep";
  const myName = normalizeName(user?.barangay?.name);

  return (
    <div className={`${poppins.className} min-h-screen bg-[#F4EEFE] text-slate-800 sm:p-6 lg:p-8`}>
      <div className="mx-auto flex max-w-360 overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] sm:rounded-[2rem]">
        <div className="min-w-0 flex-1">
          {/* ---------- Top bar: brand + sign in, with a collapsible icon menu ---------- */}
          <header className="border-b border-[#EDE7FA]">
            <div className="flex items-center gap-3 px-5 py-4 sm:px-8">
              <BrandMark tone="dark" />

              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="section-menu"
                aria-label={menuOpen ? "Hide page sections" : "Show page sections"}
                title={menuOpen ? "Hide sections" : "Show sections"}
                className={`grid h-9 w-9 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] transition-colors hover:bg-[#E3D5FF] ${focusRing}`}
              >
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  className={`transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div className="ml-auto flex items-center gap-3">
                <Link
                  href={cta.href}
                  className={`rounded-full bg-[#7B4DFF] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] ${focusRing} ${loading ? "invisible" : ""}`}
                >
                  {cta.label}
                </Link>
                <span
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#E3D5FF] text-sm font-semibold text-[#5A18C9]"
                  aria-hidden="true"
                >
                  {user ? user.name.trim().charAt(0).toUpperCase() : <PersonIcon />}
                </span>
              </div>
            </div>

            {/* Hidden by default; slides open when the arrow is clicked. */}
            <div
              id="section-menu"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
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

          <main className="space-y-5 p-5 sm:p-8">
            {/* ---------- Row 1: hero + sample charts ---------- */}
            <div className="grid gap-5 lg:grid-cols-12">
              <section className={`${card} flex flex-col bg-[#E6FBF3] lg:col-span-5`} aria-labelledby="hero-title">
                <p className="text-sm font-medium text-[#2C5A4D]">Talaghayan &middot; Barangay Report Tracker</p>
                <h1 id="hero-title" className="mt-3 text-balance text-3xl font-semibold leading-tight text-[#0E2B24] sm:text-4xl">
                  Every barangay report, from filed to counted.
                </h1>
                <p className="mt-3 max-w-[44ch] leading-7 text-[#2C5A4D]">
                  Barangays upload what is due. The office reviews it. The Talaghayan shows who is compliant, live,
                  with no more email threads or hand-updated sheets.
                </p>

                <div className="mt-auto grid grid-cols-2 gap-4 pt-7">
                  <Tile value={MAKATI_BARANGAYS.length} label="Barangays" />
                  <Tile value={STATUSES.length} label="Report statuses" />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a href="#barangays" className={`rounded-full bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6A3CF0] ${focusRing}`}>
                    Find your barangay
                  </a>
                  <Link href={cta.href} className={`rounded-full border-2 border-[#7B4DFF] px-6 py-2 text-sm font-semibold text-[#5A18C9] transition-colors hover:bg-[#7B4DFF] hover:text-white ${focusRing}`}>
                    {cta.label}
                  </Link>
                </div>
              </section>

              <section className={`${card} bg-[#F3EDFE] lg:col-span-4`} aria-labelledby="sample-line">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="sample-line" className="text-xl font-medium text-[#1B1235]">Compliance, live</h2>
                  <SampleChip />
                </div>
                <div className="mt-3 flex gap-5 text-sm text-[#2A1F4D]">
                  <Dot color="#F21DB4" label="Filed" />
                  <Dot color="#7B4DFF" label="Reviewed" />
                </div>
                <SampleLineChart />
              </section>

              <section className={`${card} flex flex-col bg-[#FFF8E6] lg:col-span-3`} aria-labelledby="sample-ring">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="sample-ring" className="text-xl font-medium text-[#2A2000]">This month</h2>
                  <SampleChip />
                </div>
                <p className="mt-2 text-sm text-[#5C4600]">
                  <b className="font-semibold text-[#F5A800]">Live tally</b> of every report
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <ul className="space-y-2 text-sm text-[#2A2000]">
                    <li><Dot color="#F21DB4" label="Filed" small /></li>
                    <li><Dot color="#7B4DFF" label="Reviewed" small /></li>
                    <li><Dot color="#FFC800" label="Compliant" small /></li>
                  </ul>
                  <SampleRings />
                </div>
                <Link
                  href={cta.href}
                  className={`mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-[#FFC800] px-5 py-2 text-sm font-semibold text-[#8A6300] transition-colors hover:bg-[#FFC800] hover:text-[#2A2000] ${focusRing}`}
                >
                  {cta.label}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </section>
            </div>

            {/* ---------- Row 2: barangay directory ---------- */}
            <section id="barangays" className={`${card} scroll-mt-6 bg-[#F1F0FB] sm:p-8`} aria-labelledby="barangays-title">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="barangays-title" className="text-2xl font-semibold text-[#1B1235]">Barangays of Makati</h2>
                  <p className="mt-1 max-w-[56ch] text-slate-600">
                    {isRep
                      ? "You are signed in. Your barangay is highlighted; representatives can only open their own."
                      : user
                        ? "Select any barangay to open your dashboard."
                        : "Select your barangay to sign in. Representatives can only open their own."}
                  </p>
                </div>
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">Search barangays</span>
                  <SearchIcon />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search barangay"
                    className="w-full rounded-xl bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none ring-1 ring-[#E3DEF5] transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#7B4DFF]"
                  />
                </label>
              </div>

              {shown.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white px-6 py-10 text-center" role="status">
                  <p className="font-medium text-slate-800">No barangay matches &ldquo;{query}&rdquo;.</p>
                  <button onClick={() => setQuery("")} className={`mt-2 text-sm font-semibold text-[#5A18C9] underline underline-offset-4 ${focusRing}`}>
                    Show all {MAKATI_BARANGAYS.length} barangays
                  </button>
                </div>
              ) : (
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {shown.map((b) => {
                    const idx = MAKATI_BARANGAYS.indexOf(b);
                    const mode = !user ? "pick" : isRep ? (normalizeName(b.name) === myName ? "mine" : "locked") : "go";
                    return (
                      <li key={b.id}>
                        <BarangayTile
                          b={b}
                          avatar={AVATARS[idx % AVATARS.length]}
                          mode={mode}
                          href={user ? homeFor(user.role) : "/login"}
                          onPick={() => setPicked(b)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-4 text-sm text-slate-500" aria-live="polite">
                Showing {shown.length} of {MAKATI_BARANGAYS.length} barangays
              </p>
            </section>


            {/* ---------- Row 4: journey + statuses ---------- */}
            <div className="grid gap-5 lg:grid-cols-5">
              <section id="journey" className={`${card} scroll-mt-6 bg-[#E8FAFF] sm:p-8 lg:col-span-3`} aria-labelledby="journey-title">
                <h2 id="journey-title" className="text-2xl font-semibold text-[#0B2A36]">A report&apos;s trip</h2>
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
                        <h3 className="font-semibold text-[#0B2A36]">{s.title}</h3>
                        <p className="mt-0.5 max-w-[48ch] text-sm leading-6 text-slate-600">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="statuses" className={`${card} scroll-mt-6 bg-[#F1F0FB] sm:p-8 lg:col-span-2`} aria-labelledby="statuses-title">
                <h2 id="statuses-title" className="text-2xl font-semibold text-[#1B1235]">Five statuses, one glance</h2>
                <ul className="mt-5 divide-y divide-[#E1DCF3]">
                  {STATUSES.map((s) => (
                    <li key={s.status} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
                      <span className="shrink-0 sm:w-32"><StatusBadge status={s.status} /></span>
                      <p className="text-sm leading-6 text-slate-600">{s.meaning}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ---------- FAQ ---------- */}
            <section id="faq" className={`${card} scroll-mt-6 bg-[#FFF8E6] sm:p-8`} aria-labelledby="faq-title">
              <h2 id="faq-title" className="text-2xl font-semibold text-[#2A2000]">Questions</h2>
              <div className="mt-5 space-y-3">
                {FAQ.map((f) => (
                  <details key={f.q} className="group rounded-2xl bg-white p-5">
                    <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold text-slate-900 ${focusRing}`}>
                      {f.q}
                      <span aria-hidden="true" className="text-2xl leading-none text-[#7B4DFF] transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 leading-7 text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* ---------- Closing call ---------- */}
            <section className="relative overflow-hidden rounded-3xl bg-[#7B4DFF] px-7 py-10 text-white sm:px-10">
              <div aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div aria-hidden="true" className="absolute -bottom-10 right-40 h-24 w-24 rounded-full bg-[#06D6A0]/40" />
              <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold sm:text-3xl">Got your account details?</h2>
                  <p className="mt-2 text-[#E9DFFF]">Pick your barangay above, or sign in with the email and password from your DILG Makati office.</p>
                </div>
                <Link href={cta.href} className={`shrink-0 rounded-full bg-white px-7 py-3 font-semibold text-[#5A18C9] transition-transform hover:-translate-y-0.5 ${focusRing}`}>
                  {cta.label}
                </Link>
              </div>
            </section>

            <footer className="pb-2 pt-1 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Talaghayan &middot; Barangay Report Tracker
            </footer>
          </main>
        </div>
      </div>

      {picked && <BarangayLoginDialog key={picked.id} barangay={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barangay tile                                                       */
/* ------------------------------------------------------------------ */

function BarangayTile({
  b, avatar, mode, href, onPick,
}: {
  b: MakatiBarangay;
  avatar: { bg: string; fg: string };
  mode: "pick" | "mine" | "locked" | "go";
  href: string;
  onPick: () => void;
}) {
  const body = (
    <>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
        style={{ backgroundColor: avatar.bg, color: avatar.fg }}
        aria-hidden="true"
      >
        {initials(b.name)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold text-slate-900">{b.name}</span>
        <span className="block text-xs text-slate-500">{mode === "mine" ? "Your barangay" : b.code}</span>
      </span>
      {mode === "mine" ? (
        <span className="rounded-full bg-[#7B4DFF] px-2.5 py-1 text-xs font-semibold text-white">Open</span>
      ) : mode === "locked" ? null : (
        <svg className="shrink-0 text-[#7B4DFF]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  const base = `flex w-full items-center gap-3 rounded-2xl bg-white p-3 pr-4 ring-1 ring-[#E8E3F7] transition ${focusRing}`;

  if (mode === "locked") {
    return (
      <button type="button" disabled title="Representatives can only open their own barangay" className={`${base} cursor-not-allowed opacity-45`}>
        {body}
      </button>
    );
  }
  if (mode === "mine" || mode === "go") {
    return (
      <Link href={href} className={`${base} hover:ring-2 hover:ring-[#7B4DFF] ${mode === "mine" ? "ring-2 ring-[#7B4DFF]" : ""}`}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onPick} aria-haspopup="dialog" aria-label={`Sign in to Barangay ${b.name}`} className={`${base} hover:ring-2 hover:ring-[#7B4DFF]`}>
      {body}
    </button>
  );
}

function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
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
  return <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600">Sample view</span>;
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
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label="Sample progress rings">
      {ring(54, 0.92, "#F21DB4", "#FBD3EE")}
      {ring(40, 0.7, "#7B4DFF", "#E3D5FF")}
      {ring(26, 0.5, "#FFC800", "#FFF0A3")}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  );
}

function RailIcon({ name }: { name: (typeof SECTIONS)[number]["icon"] }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "grid":
      return (<svg {...common}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>);
    case "people":
      return (<svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.7-3.6 3.2-5.5 6.5-5.5s5.8 1.9 6.5 5.5" /><path d="M16 5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .6 3.2 2.3 3.5 5.2" /></svg>);
    case "route":
      return (<svg {...common}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" /></svg>);
    case "shield":
      return (<svg {...common}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01" /></svg>);
  }
}