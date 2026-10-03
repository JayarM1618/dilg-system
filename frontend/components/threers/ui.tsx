import type { ReactNode } from "react";

export const btn =
  "rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50";
export const field = "rounded-md border border-line bg-white px-3 py-2 text-sm text-ink";

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
      <h1 className="text-3xl font-semibold text-navy-900">{title}</h1>
      <p className="mt-1 text-muted">{subtitle}</p>
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
        kind === "error" ? "bg-bad-bg text-bad" : "bg-navy-50 text-ok"
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
  if (last <= 1) return <p className="mt-3 text-sm text-muted">{total} record(s)</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted">
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
