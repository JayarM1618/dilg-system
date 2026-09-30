import DashboardShell from "@/components/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allow={["office_supervisor"]}>{children}</DashboardShell>;
}
