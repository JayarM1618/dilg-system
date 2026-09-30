import type { SubmissionStatus } from "@/types";

const COLORS: Record<SubmissionStatus, string> = {
  pending: "text-slate-400",
  submitted: "text-sky-300",
  under_review: "text-amber-300",
  compliant: "text-emerald-400",
  non_compliant: "text-red-400",
};

/** Small decorative status icon. Decorative only: pair it with visible text. */
export function StatusMark({
  status,
  size = 16,
}: {
  status: SubmissionStatus;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${COLORS[status]}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="8" />
      {status === "compliant" && <path d="M6.5 10.5l2.5 2.5 4.5-5" />}
      {status === "non_compliant" && <path d="M7 7l6 6M13 7l-6 6" />}
      {status === "under_review" && <path d="M10 5.5V10l3 2" />}
      {status === "submitted" && <path d="M6.5 10h6.5M10.5 7l3 3-3 3" />}
      {status === "pending" && <path d="M6.5 10h7" />}
    </svg>
  );
}

export default StatusMark;
