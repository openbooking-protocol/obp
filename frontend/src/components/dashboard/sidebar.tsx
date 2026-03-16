"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/overview", label: "Overview", icon: "📊" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "📅" },
  { href: "/dashboard/services", label: "Services", icon: "🛠️" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "🕒" },
  { href: "/dashboard/profile", label: "Profile", icon: "🏢" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    sessionStorage.removeItem("obp_api_key");
    window.location.href = "/";
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            OBP
          </span>
          Dashboard
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4" aria-label="Dashboard navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <span aria-hidden="true">🌐</span>
          Public site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <span aria-hidden="true">🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
