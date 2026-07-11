import { AppShell } from "@/components/AppShell";
import { DepartmentQueue } from "@/components/DepartmentQueue";

export default function DepartmentMoldPage() {
  return (
    <AppShell>
      <DepartmentQueue stage="mold" />
    </AppShell>
  );
}
