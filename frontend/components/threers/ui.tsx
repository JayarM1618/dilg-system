import type { ReactNode } from "react";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#7B4DFF] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#6A3CF0] transition-colors disabled:cursor-not-allowed disabled:opacity-50 select-none";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 select-none";
export const field =
  "rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#1F1733] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#7B4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/20";

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FBF3] dark:bg-[#0E352B] px-3 py-0.5 text-xs font-bold text-[#0B6B52] dark:text-[#84DEBD]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
          Barangay Operations Portal
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export function Notice({
  kind,
  children,
  onClose,
}: {
  kind: "ok" | "error";
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`mb-4 flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium ${kind === "error" ? "bg-bad-bg dark:bg-rose-950/40 text-bad dark:text-rose-400 border border-transparent dark:border-rose-900/50" : "bg-navy-50 dark:bg-emerald-950/40 text-ok dark:text-emerald-400 border border-transparent dark:border-emerald-900/50"
        }`}
    >
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} className="text-xs underline underline-offset-4">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Pager({
  page,
  last,
  total,
  onPage,
}: {
  page: number;
  last: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (last <= 1) return <p className="mt-3 text-sm text-muted dark:text-slate-400">{total} record(s)</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted dark:text-slate-400">
      <span>
        Page {page} of {last} &middot; {total} records
      </span>
      <span className="flex gap-2">
        <button className={btnGhost} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className={btnGhost} disabled={page >= last} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </span>
    </div>
  );
}

export const TYPE_LABEL: Record<string, string> = {
  template: "Report Templates",
  guideline: "Guidelines",
  sop: "Procedures (SOP)",
  toolkit: "Toolkits & Manuals",
  citizen_chart: "Makati Citizen Charts",
  drive_link: "Google Drive Links",
  security_advisory: "Security Advisories",
  other: "Other",
};

export const RESOURCE_GROUP_LABEL: Record<string, string> = {
  standard_formats: "Standard Formats & Templates",
  sectoral_toolkits: "Sectoral Toolkits & Reference Manuals",
  citizen_charts: "Makati Citizen Charts",
  drive_links: "Google Drive Files Link",
};

export const CYCLE_LABEL: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semestral: "Semestral",
  annual: "Annual",
};

export const SECTOR_ICON: Record<string, string> = {
  Barangay: "🏘️",
  SK: "🧑‍🤝‍🧑",
  "Brgy / SK": "🏛️",
};
