export type MakatiBarangay = { id: number; name: string; code: string };

export const MAKATI_BARANGAYS: MakatiBarangay[] = [
  { id: 1, name: "Bangkal", code: "BGY-001" },
  { id: 2, name: "Bel-Air", code: "BGY-002" },
  { id: 3, name: "Carmona", code: "BGY-003" },
  { id: 6, name: "Dasmariñas", code: "BGY-006" },
  { id: 8, name: "Forbes Park", code: "BGY-008" },
  { id: 9, name: "Guadalupe Nuevo", code: "BGY-009" },
  { id: 10, name: "Guadalupe Viejo", code: "BGY-010" },
  { id: 11, name: "Kasilawan", code: "BGY-011" },
  { id: 12, name: "La Paz", code: "BGY-012" },
  { id: 13, name: "Magallanes", code: "BGY-013" },
  { id: 14, name: "Olympia", code: "BGY-014" },
  { id: 15, name: "Palanan", code: "BGY-015" },
  { id: 17, name: "Pinagkaisahan", code: "BGY-017" },
  { id: 18, name: "Pio del Pilar", code: "BGY-018" },
  { id: 19, name: "Pitogo", code: "BGY-019" },
  { id: 20, name: "Poblacion", code: "BGY-020" },
  { id: 21, name: "Post Proper Northside", code: "BGY-021" },
  { id: 22, name: "Post Proper Southside", code: "BGY-022" },
  { id: 23, name: "Rizal", code: "BGY-023" },
  { id: 24, name: "San Antonio", code: "BGY-024" },
  { id: 25, name: "San Isidro", code: "BGY-025" },
  { id: 26, name: "San Lorenzo", code: "BGY-026" },
  { id: 27, name: "Santa Cruz", code: "BGY-027" },
  { id: 28, name: "Singkamas", code: "BGY-028" },
  { id: 30, name: "Tejeros", code: "BGY-030" },
  { id: 31, name: "Urdaneta", code: "BGY-031" },
  { id: 32, name: "Valenzuela", code: "BGY-032" },
];

/** Lower-case, accent-free, single-spaced: lets "Dasmariñas" match "Dasmarinas". */
export function normalizeName(s?: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}