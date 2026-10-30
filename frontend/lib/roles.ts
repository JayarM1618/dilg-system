import type { Role } from "@/types";

/**
 * Who can use the system:
 *
 *   Guest        not signed in          -> "/" (profile chooser), "/citizens" (read-only), "/barangays" and "/login"
 *   User         barangay_rep           -> "/user"
 *   DILG supervisor office_supervisor      -> "/admin"
 *   Super admin  super_admin            -> "/super-admin"
 *
 * Each signed-in role has its own top-level folder under `app/`, guarded by
 * <DashboardShell allow={[...]}>. Real security is enforced by the Laravel API;
 * this only keeps people on the screens that belong to them.
 */

export interface NavItem {
  href: string;
  label: string;
}

export interface RoleInfo {
  /** Full name shown in the UI. */
  label: string;
  /** Short name used on the landing page ("User", "Admin"...). */
  tag: string;
  description: string;
  /** Where this role lands after signing in. */
  home: string;
  /** Tabs shown under the header (hidden when there is only one). */
  nav: NavItem[];
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  barangay_rep: {
    label: "Barangay representative",
    tag: "Barangay rep",
    description: "Receives what DILG sends, downloads the files, complies and files reports. Sees only their own barangay.",
    home: "/user",
    nav: [
      { href: "/user", label: "Barangay Hub" },
      { href: "/borms", label: "BORMS" },
      { href: "/bagwis", label: "Bagwis" },
      { href: "/borms/community", label: "Announcements & programs" },
    ],
  },
  office_supervisor: {
    label: "DILG supervisor",
    tag: "DILG supervisor",
    description: "Sends files, report requests, complaints, resources and forms to the barangays, reviews what they send back and tracks compliance. Cannot manage accounts.",
    home: "/admin",
    nav: [
      { href: "/admin", label: "Supervisor Hub" },
      { href: "/borms", label: "BORMS" },
      { href: "/bagwis", label: "Bagwis" },
    ],
  },
  super_admin: {
    label: "Super admin",
    tag: "Super admin",
    description: "Full control: everything the DILG supervisor can do, plus accounts, barangays, monitoring of every transaction and IT administration.",
    home: "/talaghayan",
    nav: [
      { href: "/talaghayan", label: "Talaghayan Hub" },
      { href: "/borms", label: "BORMS" },
      { href: "/bagwis", label: "Bagwis" },
      { href: "/talaghayan/monitoring", label: "Monitoring" },
      { href: "/talaghayan/users", label: "Accounts" },
      { href: "/talaghayan/barangays", label: "Barangays" },
      { href: "/talaghayan/settings", label: "System Admin" },
    ],
  },
};

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return ROLE_INFO[role].home;
}
