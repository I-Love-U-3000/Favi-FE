"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/components/AuthProvider";
import useProfile from "@/lib/hooks/useProfile";
import ThemeSwitcher from "./ThemeSwitcher";
import { useOverlay } from "@/components/RootProvider";

type Item = { label: string; href: string; icon: string };

const NAV: Item[] = [
  { label: "Home", href: "/home", icon: "pi pi-home" },
  { label: "Explore", href: "/search", icon: "pi pi-search" },
  { label: "Chat", href: "/chat", icon: "pi pi-comments" },
  { label: "Notifications", href: "/notifications", icon: "pi pi-bell" },
  { label: "Profile", href: "/profile/u_001", icon: "pi pi-user" },
  { label: "Friends", href: "/friends", icon: "pi pi-users" },
  { label: "Create", href: "/create", icon: "pi pi-plus-circle" },
  { label: "Settings", href: "/settings", icon: "pi pi-cog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isGuest, user, logout } = useAuth();
  const me = useProfile(user?.id);
  const { openPostComposer } = useOverlay();

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
          <img src="/favi-logo.png" alt="logo" className="w-8 h-8 rounded-full" />
          <span className="text-xl font-semibold" style={{ color: "var(--text)" }}>Favi</span>
        </div>

        <nav className="px-2 py-4 space-y-1 overflow-y-auto h-[calc(100vh-64px-64px)]">
          {(isAuthenticated ? NAV : NAV.filter(i => ["/home","/search"].includes(i.href))).map((item) => {
            const active = pathname?.startsWith(item.href);
            // Dynamic profile link to current user's profile id
            const href = item.label === 'Profile' && isAuthenticated && (user as any)?.id
              ? `/profile/${(user as any).id}`
              : item.href;
            if (item.label === "Create") {
              return (
                <button
                  key={href}
                  onClick={openPostComposer}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
                  style={{
                    backgroundColor: active ? "rgba(0,0,0,0.05)" : "transparent",
                    color: "var(--text)",
                  }}
                >
                  <i className={`${item.icon} text-lg`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={href}
                href={href}
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

        <div className="px-3 py-4 space-y-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={me.profile?.avatarUrl || "/avatar-default.svg"}
                  alt={me.profile?.username || "avatar"}
                  className="w-8 h-8 rounded-full border"
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                    {me.profile?.displayName || (user as any)?.email || "User"}
                  </div>
                  {me.profile?.username && (
                    <div className="text-[11px] opacity-70 truncate">@{me.profile.username}</div>
                  )}
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-md text-xs"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                onClick={logout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-xs">{isGuest ? "Guest" : "Guest"}</div>
          )}
        </div>
      </aside>
    </div>
  );
}
