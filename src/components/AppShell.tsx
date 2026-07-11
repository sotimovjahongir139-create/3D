import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-16">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
