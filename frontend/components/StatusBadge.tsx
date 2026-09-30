import type { SubmissionStatus } from "@/types";

const STYLES: Record<SubmissionStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  compliant: "bg-green-100 text-green-700",
  non_compliant: "bg-red-100 text-red-700",
};

const LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  under_review: "Under review",
  compliant: "Compliant",
  non_compliant: "Non-compliant",
};

export default function StatusBadge({
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
