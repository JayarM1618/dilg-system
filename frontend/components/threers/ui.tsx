import type { ReactNode } from "react";

export const btn =
  "rounded-md bg-navy-800 dark:bg-[#7B4DFF] px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-900 dark:hover:bg-[#6A3CF0] transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "rounded-md border border-line dark:border-white/10 bg-white dark:bg-white/10 px-3 py-1.5 text-sm font-semibold text-navy-800 dark:text-slate-100 hover:bg-navy-50 dark:hover:bg-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const field = "rounded-md border border-line dark:border-white/10 bg-white dark:bg-[#2B2542] px-3 py-2 text-sm text-ink dark:text-slate-100 transition-colors";

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
    <header className="mb-6">
      <h1 className="text-3xl font-semibold text-navy-900 dark:text-white transition-colors duration-500 ease-out">{title}</h1>
      <p className="mt-1 text-muted dark:text-slate-400">{subtitle}</p>
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
      className={`mb-4 flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium ${
        kind === "error" ? "bg-bad-bg dark:bg-rose-950/40 text-bad dark:text-rose-400 border border-transparent dark:border-rose-900/50" : "bg-navy-50 dark:bg-emerald-950/40 text-ok dark:text-emerald-400 border border-transparent dark:border-emerald-900/50"
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
  template: "Report templates",
  guideline: "Guidelines",
  sop: "Procedures (SOP)",
  security_advisory: "Security advisories",
  other: "Other",
};
