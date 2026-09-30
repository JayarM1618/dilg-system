/** Parses "YYYY-MM-DD" (or a full ISO string) as a *local* date, avoiding the off-by-one-day timezone shift. */
function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** "2026-10-05" -> "Oct 5, 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

/** True once the due date (inclusive) has passed. */
export function isPastDue(value: string | null | undefined): boolean {
  if (!value) return false;
  const due = parseDate(value);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}
