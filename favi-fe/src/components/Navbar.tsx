"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

type Item = { label: string; href: string; icon: string };

const NAV: Item[] = [
  { label: "Home", href: "/home", icon: "pi pi-home" },
  { label: "Explore", href: "/search", icon: "pi pi-search" },
  { label: "Chat", href: "/chat", icon: "pi pi-comments" },
  { label: "Profile", href: "/profile/u_001", icon: "pi pi-user" },
  { label: "Friends", href: "/friends", icon: "pi pi-users" },
  { label: "Settings", href: "/settings", icon: "pi pi-cog" },
];

export default function Navbar() {
  const pathname = usePathname();

  // Outer spacer preserves layout width; inner is fixed so it never scrolls away
  return (
    <div className="hidden md:block shrink-0 w-64">
      <aside
        className="fixed top-0 left-0 h-screen w-64 z-40"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text)",
          borderRight: "1px solid var(--border)",
          backdropFilter: "saturate(1.1) blur(6px)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favi-logo.png" alt="logo" className="w-8 h-8 rounded" />
          <span className="text-xl font-semibold" style={{ color: "var(--text)" }}>Favi</span>
        </div>

        <nav className="px-2 py-4 space-y-1 overflow-y-auto h-[calc(100vh-64px-64px)]">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
                style={{
                  backgroundColor: active ? "rgba(0,0,0,0.05)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <i className={`${item.icon} text-lg`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <div className="text-xs">© Favi</div>
        </div>
      </aside>
    </div>
  );
}
