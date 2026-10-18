import DashboardShell from "@/components/DashboardShell";

export default function TalaghayanLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allow={["super_admin"]}>{children}</DashboardShell>;
}
