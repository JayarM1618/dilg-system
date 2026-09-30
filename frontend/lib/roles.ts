import type { Role } from "@/types";

/**
 * Who can use the system:
 *
 *   Guest        not signed in          -> "/" (landing) and "/login" only
 *   User         barangay_rep           -> "/user"
 *   Admin        office_supervisor      -> "/admin"
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
    tag: "User",
    description: "Files reports for one barangay and sees only that barangay's records.",
    home: "/user",
    nav: [{ href: "/user", label: "My reports" }],
  },
  office_supervisor: {
    label: "Office supervisor",
    tag: "Admin",
    description: "Reviews submissions from every barangay and follows compliance.",
    home: "/admin",
    nav: [{ href: "/admin", label: "Talaghayan" }],
  },
  super_admin: {
    label: "Super admin",
    tag: "Super admin",
    description: "Everything an admin can do, plus barangays, templates and user accounts.",
    home: "/super-admin",
    nav: [
      { href: "/super-admin", label: "Talaghayan" },
      { href: "/super-admin/users", label: "Users" },
    ],
  },
};

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return ROLE_INFO[role].home;
}
