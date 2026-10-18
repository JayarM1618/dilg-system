import DashboardShell from "@/components/DashboardShell";

export default function BagwisLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allow={["super_admin", "office_supervisor", "barangay_rep"]}>
      {children}
    </DashboardShell>
  );
}
