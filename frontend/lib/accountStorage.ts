export interface SavedAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  barangayName?: string | null;
  avatarColor: string;
  lastUsedAt: number;
}

const STORAGE_KEY = "talaghayan_saved_accounts";

const AVATAR_PALETTE = [
  "#0097A7", // Teal (matching Chrome's profile teal)
  "#0284C7", // Sky blue
  "#7C3AED", // Violet
  "#059669", // Emerald
  "#EA580C", // Amber/Orange
  "#DB2777", // Rose
  "#4F46E5", // Indigo
  "#0891B2", // Cyan
];

export function getAvatarColor(key: string | number): string {
  const str = String(key || "user");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveAccount(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  barangay?: { name?: string | null } | null;
}): SavedAccount[] {
  if (typeof window === "undefined" || !user?.email) return [];
  try {
    const existing = getSavedAccounts().filter(
      (a) => a.email.toLowerCase() !== user.email.toLowerCase()
    );
    const account: SavedAccount = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      barangayName: user.barangay?.name ?? null,
      avatarColor: getAvatarColor(user.email),
      lastUsedAt: Date.now(),
    };
    const updated = [account, ...existing].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeSavedAccount(email: string): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const updated = getSavedAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
