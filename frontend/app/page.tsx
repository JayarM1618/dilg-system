"use client";

import { useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roles";
import type { SubmissionStatus } from "@/types";

const NAV = [
  { href: "#roles", label: "Who uses it" },
  { href: "#journey", label: "A report's trip" },
  { href: "#statuses", label: "Statuses" },
  { href: "#faq", label: "FAQ" },
];

const ROLES = [
  {
    role: "Guest", article: "a", who: "Anyone not signed in",
    tab: "bg-slate-800 text-white", tint: "bg-slate-100 text-slate-700", dot: "bg-slate-700",
    stories: [
      "I can read about what the Report Tracker does on this page.",
      "I can sign in with the email and password the DILG Makati office gave me.",
      "I cannot see any reports or accounts until I sign in. There is no public sign-up.",
    ],
  },
  {
    role: "User", article: "a", who: "Barangay representative",
    tab: "bg-teal-500 text-white", tint: "bg-teal-50 text-teal-800", dot: "bg-teal-500",
    stories: [
      "I can see every report my barangay owes, with its period and due date.",
      "I can upload a report (PDF, Word or Excel, up to 10 MB) and watch it move to submitted.",
      "I can read the reviewer's remarks when a report is marked non-compliant.",
      "I can download the report templates the office shares.",
      "I can report a security incident, such as a phishing attempt.",
      "I can only see my own barangay's reports, never another barangay's.",
    ],
  },
  {
    role: "Admin", article: "an", who: "Office supervisor",
    tab: "bg-amber-400 text-amber-950", tint: "bg-amber-50 text-amber-900", dot: "bg-amber-500",
    stories: [
      "I can see the submissions of every barangay in one place.",
      "I can mark a report under review, compliant or non-compliant, with remarks.",
      "I can follow each barangay's compliance rate in the Talaghayan.",
      "I can see reported security incidents and update their status.",
    ],
  },
  {
    role: "Super admin", article: "a", who: "Everything an admin can do, plus",
    tab: "bg-violet-600 text-white", tint: "bg-violet-50 text-violet-900", dot: "bg-violet-600",
    stories: [
      "I can add barangays, edit their details or deactivate them.",
      "I can upload new versions of the report templates.",
      "I can see all user accounts, their roles and their barangays.",
    ],
  },
];

const STEPS = [
  { title: "Office opens a period", body: "Each barangay gets the report, its period and a due date.", color: "bg-indigo-500" },
  { title: "Barangay files it", body: "The representative uploads the finished report before the deadline.", color: "bg-teal-500" },
  { title: "Office reviews", body: "Staff mark it compliant, or send it back with remarks.", color: "bg-amber-400" },
  { title: "Talaghayan updates", body: "The tally changes instantly. No spreadsheet re-encoding.", color: "bg-fuchsia-500" },
];

const STATUSES: { status: SubmissionStatus; meaning: string }[] = [
  { status: "pending", meaning: "Assigned, but the barangay hasn't filed it yet." },
  { status: "submitted", meaning: "Uploaded and waiting for the office." },
  { status: "under_review", meaning: "Office staff are checking it." },
  { status: "compliant", meaning: "Accepted. Counts toward the compliance rate." },
  { status: "non_compliant", meaning: "Needs fixing. The reviewer's remarks show on the dashboard." },
];

const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-1", "rotate-1"];

const FAQ = [
  { q: "How do I get an account?", a: "Ask the DILG Makati office. Accounts are created for you, so there is no public sign-up." },
  { q: "Can barangays see each other's reports?", a: "No. A barangay sees only its own reports. Only office staff see every barangay in the Talaghayan." },
  { q: "What happens when a report is non-compliant?", a: "The reviewer adds remarks explaining what to fix, and they appear next to the report on your dashboard." },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState(1);
  const r = ROLES[active];
  const cta = user ? { href: homeFor(user.role), label: "Go to dashboard" } : { href: "/login", label: "Sign in" };
  const pill = "rounded-full px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5";
  const wrap = "w-full px-3 sm:px-6 lg:px-10 xl:px-16";

  return (
    <div className="min-h-screen bg-[#f4f3ff] text-slate-800">
      {/* ---------- Floating nav ---------- */}
      <header className={`${wrap} pt-3 sm:pt-4`}>
        <div className="flex items-center justify-between gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-indigo-100 sm:px-5">
          <div className="min-w-0"><BrandMark tone="dark" /></div>
          <nav aria-label="Page sections" className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-indigo-600">{n.label}</a>
            ))}
          </nav>
          <Link href={cta.href} className={`shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 ${loading ? "invisible" : ""}`}>
            {cta.label}
          </Link>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className={`${wrap} mt-3 sm:mt-4`}>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-500 px-5 py-10 text-white sm:rounded-[2rem] sm:px-10 lg:flex lg:min-h-[calc(100vh-7rem)] lg:items-center lg:px-14 lg:py-16">
            <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-6">
              <div className="relative z-10 min-w-0">
                <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">DILG Makati &middot; Barangay Report Tracker</p>
                <h1 className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-7xl">
                  Every barangay report, from filed to counted.
                </h1>
                <p className="mt-5 max-w-[46ch] text-lg leading-8 text-indigo-50">
                  Barangays upload what is due. The office reviews it. The Talaghayan shows who is compliant, live,
                  with no more email threads or hand-updated sheets.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href={cta.href} className={`${pill} bg-white text-indigo-700 shadow-lg shadow-indigo-900/20`}>{cta.label}</Link>
                  <a href="#journey" className={`${pill} bg-white/15 hover:bg-white/25`}>See a report&apos;s trip</a>
                </div>
                <p className="mt-5 text-sm text-indigo-100/80">Accounts are issued by the DILG Makati office.</p>
              </div>
              <HeroScene />
            </div>
          </div>
        </section>

        {/* ---------- Roles ---------- */}
        <section id="roles" className={`scroll-mt-4 ${wrap} py-14 sm:py-20`}>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Who are you today?</h2>
          <p className="mt-2 max-w-xl text-slate-600">Pick a role to see what you can do in the system.</p>
          <div role="tablist" aria-label="User roles" className="mt-6 flex flex-wrap gap-2">
            {ROLES.map((x, i) => (
              <button
                key={x.role}
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${i === active ? `${x.tab} shadow-md` : "bg-white text-slate-600 ring-1 ring-indigo-100 hover:ring-indigo-300"}`}
              >
                {x.role}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-6 grid gap-2 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-indigo-100 md:grid-cols-[14rem_1fr] lg:grid-cols-[18rem_1fr]">
            <div className={`p-8 ${r.tint}`}>
              <p className="text-3xl font-extrabold">{r.role}</p>
              <p className="mt-2 text-sm font-medium opacity-80">{r.who}</p>
            </div>
            <ul className="space-y-4 p-8">
              {r.stories.map((s) => (
                <li key={s} className="flex gap-3 leading-7">
                  <span aria-hidden="true" className={`mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full ${r.dot}`} />
                  <span><b className="text-slate-900">As {r.article} {r.role.toLowerCase()}, </b>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Journey ---------- */}
        <section id="journey" className="scroll-mt-4 bg-white py-20">
          <div className={wrap}>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">A report&apos;s trip</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`rounded-3xl bg-[#f4f3ff] p-6 ${i % 2 ? "lg:mt-10" : ""}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-extrabold text-white ${s.color}`}>{i + 1}</span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Statuses ---------- */}
        <section id="statuses" className={`scroll-mt-4 ${wrap} py-14 sm:py-20`}>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Five statuses, one glance</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {STATUSES.map((s, i) => (
              <div key={s.status} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-indigo-100 ${TILTS[i]}`}>
                <StatusBadge status={s.status} />
                <p className="mt-3 text-slate-600">{s.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className={`scroll-mt-4 ${wrap} pb-14 sm:pb-20`}>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Questions</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-indigo-100">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
                  {f.q}
                  <span aria-hidden="true" className="text-2xl text-indigo-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- Closing call ---------- */}
        <section className={`${wrap} pb-12 sm:pb-16`}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-500 px-8 py-12 text-white">
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
            <div aria-hidden="true" className="absolute -bottom-12 right-32 h-28 w-28 rounded-full bg-teal-300/30" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-extrabold">Got your account details?</h2>
                <p className="mt-2 text-indigo-100">Sign in with the email and password from your DILG Makati office.</p>
              </div>
              <Link href={cta.href} className={`${pill} bg-white text-indigo-700`}>{cta.label}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="pb-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} DILG Makati &middot; Barangay Report Tracker
      </footer>
    </div>
  );
}

/** Staff and a barangay rep lifting a filed report into the Talaghayan window. Decorative. */
function HeroScene() {
  return (
    <svg viewBox="0 0 560 430" className="mx-auto h-auto w-full max-w-[420px] sm:max-w-[560px] lg:max-w-none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="plank" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c6cf5" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <circle cx="280" cy="215" r="205" fill="#fff" opacity=".08" />

      {/* browser window */}
      <rect x="50" y="30" width="460" height="340" rx="22" fill="#f5f3ff" />
      <path d="M50 52a22 22 0 0 1 22-22h416a22 22 0 0 1 22 22v14H50z" fill="#1e1b4b" />
      <circle cx="74" cy="48" r="6" fill="#fb7185" />
      <circle cx="94" cy="48" r="6" fill="#fbbf24" />
      <circle cx="114" cy="48" r="6" fill="#2dd4bf" />
      <rect x="70" y="80" width="330" height="30" rx="15" fill="#fff" stroke="#c7d2fe" strokeWidth="2" />
      <text x="196" y="100" fontSize="15" fontWeight="700" fill="#4f46e5">Talaghayan</text>
      <circle cx="470" cy="95" r="15" fill="#c7d2fe" />
      <rect x="70" y="125" width="420" height="80" rx="12" fill="#e0e7ff" />
      <path d="M150 125v80M260 125v40h90M350 165v40" stroke="#c7d2fe" strokeWidth="3" fill="none" />
      {[70, 215, 360].map((x, i) => (
        <g key={x}>
          <rect x={x} y="222" width="130" height="118" rx="12" fill="#fff" stroke="#c7d2fe" strokeWidth="2" />
          {i > 0 && <circle cx={x + 65} cy="262" r="17" fill="#c7d2fe" />}
          <rect x={x + 20} y="300" width="90" height="6" rx="3" fill="#c7d2fe" />
          <rect x={x + 20} y="314" width="60" height="6" rx="3" fill="#e0e7ff" />
        </g>
      ))}

      {/* staff member, behind the plank */}
      <rect x="126" y="118" width="54" height="56" rx="14" fill="#312e81" />
      <path d="M153 122l-7 14 7 22 7-22z" fill="#2dd4bf" />
      <circle cx="153" cy="96" r="22" fill="#f4c7a1" />
      <path d="M131 94c0-22 42-24 44 0-10-10-30-12-44 0z" fill="#3b2a20" />
      <circle cx="146" cy="150" r="7" fill="#f4c7a1" />
      <circle cx="174" cy="152" r="7" fill="#f4c7a1" />

      {/* teal up-arrow */}
      <path d="M330 84l22 26h-13v20h-18v-20h-13z" fill="#2dd4bf" />

      {/* the filed report */}
      <g transform="rotate(10 280 190)">
        <rect x="110" y="155" width="340" height="66" rx="14" fill="url(#plank)" />
        <rect x="132" y="173" width="190" height="8" rx="4" fill="#fff" opacity=".85" />
        <rect x="132" y="190" width="130" height="6" rx="3" fill="#fbbf24" />
        <circle cx="405" cy="188" r="18" fill="#2dd4bf" />
        <path d="M396 188l7 7 12-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* barangay rep on the stairs */}
      <rect x="420" y="356" width="92" height="14" rx="3" fill="#6d5df0" />
      <rect x="408" y="370" width="116" height="16" rx="3" fill="#2dd4bf" />
      <rect x="438" y="312" width="14" height="46" rx="6" fill="#1f2937" />
      <rect x="460" y="312" width="14" height="46" rx="6" fill="#1f2937" />
      <rect x="434" y="352" width="22" height="7" rx="3" fill="#fff" />
      <rect x="458" y="352" width="22" height="7" rx="3" fill="#fff" />
      <rect x="434" y="262" width="44" height="56" rx="16" fill="#fbbf24" />
      <circle cx="456" cy="240" r="20" fill="#f4c7a1" />
      <path d="M436 240c-4-30 44-30 40 0 0 22 4 34-2 44-2-20-2-30-10-38-10 6-20 6-28-6z" fill="#1f1235" />
      <circle cx="437" cy="235" r="7" fill="#f4c7a1" />

      {/* upload card */}
      <rect x="60" y="282" width="126" height="92" rx="14" fill="#5eead4" />
      <circle cx="123" cy="318" r="20" fill="#fff" />
      <path d="M116 310l16 8-16 8z" fill="#14b8a6" />
      <rect x="86" y="348" width="74" height="6" rx="3" fill="#fff" opacity=".8" />

      {/* cactus */}
      <rect x="28" y="372" width="46" height="42" rx="9" fill="#fb7185" />
      <rect x="40" y="318" width="22" height="62" rx="11" fill="#14b8a6" />
      <rect x="24" y="334" width="14" height="30" rx="7" fill="#14b8a6" />
      <rect x="64" y="328" width="14" height="32" rx="7" fill="#14b8a6" />

      {/* leaves */}
      <path d="M520 415c-24-56 10-96 40-130 4 50-12 96-40 130z" fill="#7c3aed" />
      <path d="M500 415c-8-40 4-70 24-96 6 38-2 70-24 96z" fill="#a78bfa" />

      {/* floating props */}
      <circle cx="252" cy="392" r="18" fill="none" stroke="#c026d3" strokeWidth="10" />
      <circle cx="294" cy="404" r="11" fill="#f0abfc" />
      <rect x="334" y="386" width="28" height="28" rx="6" fill="#a78bfa" />
      <rect x="334" y="396" width="28" height="8" fill="#f472b6" />
    </svg>
  );
}