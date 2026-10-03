import DashboardShell from "@/components/DashboardShell";

// Barangay representatives. Same shell as /admin and /super-admin
// (sidebar, top bar, sign-out button); only the allowed role differs.
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allow={["barangay_rep"]}>{children}</DashboardShell>;
}
