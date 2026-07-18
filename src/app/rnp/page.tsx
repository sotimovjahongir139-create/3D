import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { RnpDashboard } from "@/components/rnp/RnpDashboard";

// This route is intentionally not covered by the global middleware matcher
// (src/middleware.ts only matches /dashboard, /department, /admin), so the
// same auth + role check it would otherwise provide is done here instead.
export default async function RnpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="RNP" subtitle="Haftalik reja/fakt ko'rsatkichlari" />
        <RnpDashboard />
      </div>
    </AppShell>
  );
}
