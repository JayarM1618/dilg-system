import type { SubmissionStatus } from "@/types";

const STYLES: Record<SubmissionStatus, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  compliant: "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  non_compliant: "bg-red-100 text-red-700 dark:bg-rose-500/20 dark:text-rose-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  approved: "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  returned: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  overdue: "bg-red-100 text-red-700 dark:bg-rose-500/20 dark:text-rose-300",
  rejected: "bg-red-100 text-red-700 dark:bg-rose-500/20 dark:text-rose-300",
  revision: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  under_review: "Under review",
  compliant: "Compliant",
  non_compliant: "Non-compliant",
  draft: "Draft",
  approved: "Approved",
  returned: "Returned",
  overdue: "Overdue",
  rejected: "Rejected",
  revision: "Needs Revision",
};

export function StatusBadge({
  status,
  label,
}: {
  status: SubmissionStatus;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
      title={label}
    >
      {label ? `${label}: ` : ""}
      {LABELS[status]}
    </span>
  );
}

export default StatusBadge;
