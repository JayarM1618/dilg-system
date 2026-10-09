/** Shapes returned by Laravel's public endpoints (see PublicController) plus display helpers. */

export type PublicBarangayProfile = {
  id: number;
  name: string;
  code: string;
  about: string | null;
  hall_address: string | null;
  hotline: string | null;
  office_hours: string | null;
};

export type PublicAnnouncement = {
  id: number;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  barangay?: { id: number; name: string } | null;
};

export type PublicProgram = {
  id: number;
  kind: "event" | "program";
  title: string;
  description: string | null;
  category: string;
  venue: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule_note: string | null;
  barangay?: { id: number; name: string } | null;
};

export type PublicBarangayDetail = {
  barangay: PublicBarangayProfile;
  announcements: PublicAnnouncement[];
  events: PublicProgram[];
  programs: PublicProgram[];
};

export const CATEGORIES: { value: string; label: string; bg: string; fg: string }[] = [
  { value: "health", label: "Health", bg: "#FFD6EA", fg: "#A0124F" },
  { value: "livelihood", label: "Livelihood", bg: "#FFF0A3", fg: "#7A5B00" },
  { value: "education", label: "Education", bg: "#C5F0FF", fg: "#0B6180" },
  { value: "peace_and_order", label: "Peace & order", bg: "#E3D5FF", fg: "#5A18C9" },
  { value: "environment", label: "Environment", bg: "#BDF3DE", fg: "#0B6B52" },
  { value: "sports_youth", label: "Sports & youth", bg: "#FFE0C2", fg: "#8A4300" },
  { value: "social_services", label: "Social services", bg: "#DCE4FF", fg: "#2A3FA0" },
  { value: "other", label: "Other", bg: "#ECE8F5", fg: "#4A4560" },
];

export function categoryOf(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

/* Everything is shown in Philippine time, whatever the viewer's computer clock says. */
const TZ = "Asia/Manila";

/** "2026-10-20" in Philippine time. Used to put an event on the right calendar day. */
export function manilaDateKey(input: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof input === "string" ? new Date(input) : input,
  );
}

export function todayKey(): string {
  return manilaDateKey(new Date());
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", { timeZone: TZ, month: "long", day: "numeric", year: "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function eventWhen(p: PublicProgram): string {
  if (!p.starts_at) return p.schedule_note ?? "";
  const start = formatTime(p.starts_at);
  return p.ends_at ? `${start} to ${formatTime(p.ends_at)}` : start;
}

/** { month: "OCT", day: "20" } for the little date badge. */
export function badgeParts(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-PH", { timeZone: TZ, month: "short" }).toUpperCase(),
    day: d.toLocaleDateString("en-PH", { timeZone: TZ, day: "numeric" }),
  };
}

/** Value of <input type="datetime-local"> (Philippine time) to the ISO string Laravel expects. */
export function localInputToIso(value: string): string | null {
  return value ? new Date(`${value}:00+08:00`).toISOString() : null;
}
