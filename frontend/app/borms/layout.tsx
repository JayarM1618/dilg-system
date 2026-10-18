import DashboardShell from "@/components/DashboardShell";

export default function BormsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allow={["super_admin", "office_supervisor", "barangay_rep"]}>
      {children}
    </DashboardShell>
  );
}
