/** Shape returned by Laravel: GET /api/public/barangays. The database is the only source of truth. */
export type PublicBarangay = { id: number; name: string; code: string };

/** Lower-case, accent-free, single-spaced: lets "Dasmariñas" match "Dasmarinas" when searching. */
export function normalizeName(s?: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Pastel avatar colours for barangay tiles, cycled by position (same as the homepage). */
export const AVATARS = [
  { bg: "#BDF3DE", fg: "#0B6B52" },
  { bg: "#E3D5FF", fg: "#5A18C9" },
  { bg: "#FFF0A3", fg: "#7A5B00" },
  { bg: "#C5F0FF", fg: "#0B6180" },
  { bg: "#FFCDE6", fg: "#A0124F" },
];

export function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}
