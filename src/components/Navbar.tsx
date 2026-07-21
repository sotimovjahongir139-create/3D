"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Settings, LogOut, Boxes, Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/providers";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Boshqaruv paneli", roles: ["admin", "dept_3d", "dept_mold", "dept_sales"] },
  { href: "/department/3d", label: "3D bo'limi", roles: ["admin", "dept_3d"] },
  { href: "/department/mold", label: "Qolip bo'limi", roles: ["admin", "dept_mold"] },
  { href: "/department/sales", label: "Sotuv bo'limi", roles: ["admin", "dept_sales"] },
  { href: "/admin/models", label: "Admin", roles: ["admin"] },
  { href: "/rnp", label: "RNP", roles: ["admin"] },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const role = session?.user?.role;

  const items = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="sticky top-2 sm:top-4 z-20 px-2 sm:px-4">
      <nav className="mx-auto max-w-7xl bg-card rounded-full shadow-sm px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 pl-1 pr-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
            <Boxes size={16} strokeWidth={2} />
          </span>
          <span className="font-display font-bold text-sm text-ink hidden sm:inline">Arkon</span>
        </Link>

        <div className="flex-1 min-w-0 flex items-center justify-start sm:justify-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  active ? "bg-primary text-white" : "text-ink/60 hover:bg-bg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-ink/50 hover:bg-bg hover:text-ink"
            aria-label={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
            title={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
          >
            {theme === "dark" ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
          </button>
          <button className="hidden sm:inline-flex rounded-full p-2 text-ink/50 hover:bg-bg hover:text-ink" aria-label="Bildirishnomalar">
            <Bell size={17} strokeWidth={1.75} />
          </button>
          <button className="hidden sm:inline-flex rounded-full p-2 text-ink/50 hover:bg-bg hover:text-ink" aria-label="Sozlamalar">
            <Settings size={17} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-full p-2 text-ink/50 hover:bg-bg hover:text-ink"
            aria-label="Chiqish"
          >
            <LogOut size={17} strokeWidth={1.75} />
          </button>
          {session?.user && (
            <span
              title={session.user.name ?? ""}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
            >
              {initials}
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
