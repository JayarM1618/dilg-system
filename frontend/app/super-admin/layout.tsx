import DashboardShell from "@/components/DashboardShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allow={["super_admin"]}>{children}</DashboardShell>;
}
