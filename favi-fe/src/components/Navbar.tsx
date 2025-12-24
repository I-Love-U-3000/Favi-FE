"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import useProfile from "@/lib/hooks/useProfile";
import { useOverlay } from "@/components/RootProvider";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";

type Item = { label: string; href: string; icon: string };

const NAV: Item[] = [
  { label: "Home", href: "/home", icon: "pi pi-home" },
  { label: "Explore", href: "/search", icon: "pi pi-search" },
  { label: "Chat", href: "/chat", icon: "pi pi-comments" },
  { label: "Notifications", href: "/notifications", icon: "pi pi-bell" },
  { label: "Profile", href: "/profile/u_001", icon: "pi pi-user" },
  { label: "Friends", href: "/friends", icon: "pi pi-users" },
  { label: "Settings", href: "/settings", icon: "pi pi-cog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isGuest, user, logout } = useAuth();
  const me = useProfile(user?.id);
  const { openPostComposer, openCollectionComposer, openNotificationDialog } = useOverlay();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(true);
  const menuRef = useRef<Menu>(null);

  const navItems = useMemo(() => {
    if (isAuthenticated) return NAV;
    return [
      { label: "Home", href: "/home", icon: "pi pi-home" },
      { label: "Explore", href: "/search", icon: "pi pi-search" },
      { label: "Đăng nhập", href: "/login", icon: "pi pi-sign-in" },
      { label: "Đăng ký", href: "/register", icon: "pi pi-user-plus" },
    ];
  }, [isAuthenticated]);

  const createMenuItems = [
    {
      label: "New Post",
      icon: "pi pi-image",
      command: () => openPostComposer(),
    },
    {
      label: "New Collection",
      icon: "pi pi-folder",
      command: () => openCollectionComposer(),
    },
  ];

  const handleCreateClick = (event: React.MouseEvent) => {
    menuRef.current?.toggle(event);
  };

  // Request browser notification permission on first user interaction
  useEffect(() => {
    const requestPermission = async () => {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }
    };

    // Request on first click
    document.addEventListener("click", requestPermission, { once: true });

    return () => {
      document.removeEventListener("click", requestPermission);
    };
  }, []);

  // Outer spacer preserves layout width; inner is fixed so it never scrolls away
  return (
    <div
      className="hidden md:block shrink-0 transition-[width] duration-200"
      style={{ width: isOpen ? "16rem" : "0" }}
    >
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="hidden md:inline-flex items-center gap-2 fixed top-3 left-3 z-50 px-3 py-2 rounded-md text-sm shadow-sm backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 transition"
          style={{ color: "var(--text)" }}
        >
          <i className="pi pi-bars text-sm" />
        </button>
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-40 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } backdrop-blur-2xl bg-white/15 dark:bg-black/30 border-r border-white/30 dark:border-white/20 shadow-xl`}
        style={{ color: "var(--text)" }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-white/10 dark:border-white/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favi-logo.png" alt="logo" className="w-8 h-8 rounded-full" />
          <span className="text-xl font-semibold" style={{ color: "var(--text)" }}>Favi</span>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="ml-auto inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs shadow-sm backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition"
            style={{ color: "var(--text)" }}
          >
            <i className="pi pi-bars text-sm" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-2 overflow-y-auto h-[calc(100vh-64px-64px)]">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            // Dynamic profile link to current user's profile id
            const href = item.label === "Profile" && isAuthenticated && (user as any)?.id
              ? `/profile/${(user as any).id}`
              : item.href;

            // Notification item with badge - opens dialog
            if (item.label === "Notifications" && isAuthenticated) {
              return (
                <button
                  key={href}
                  onClick={openNotificationDialog}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:-translate-y-[1px] ${
                    active
                      ? "bg-black dark:bg-white/15"
                      : "hover:bg-black dark:hover:bg-white/10"
                  }`}
                  style={{ color: "var(--text)" }}
                >
                  <div className="relative">
                    <i className={`${item.icon} text-lg ${active ? "" : "opacity-80"}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:-translate-y-[1px] ${
                  active
                    ? "bg-black dark:bg-white/15"
                    : "hover:bg-black dark:hover:bg-white/10"
                }`}
                style={{ color: "var(--text)" }}
              >
                <i className={`${item.icon} text-lg ${active ? "" : "opacity-80"}`} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}

          {/* Create button with menu */}
          {isAuthenticated && (
            <button
              onClick={handleCreateClick}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:-translate-y-[1px] bg-primary text-white"
            >
              <i className="pi pi-plus-circle text-lg" />
              <span className="text-sm font-semibold">Create</span>
            </button>
          )}
        </nav>

        <div
          className="px-3 py-4 space-y-3 border-t border-white/10 dark:border-white/5"
          style={{ color: "var(--text-secondary)" }}
        >
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={me.profile?.avatarUrl || "/avatar-default.svg"}
                  alt={me.profile?.username || "avatar"}
                  className="w-9 h-9 rounded-full border"
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
                className="px-3 py-1.5 rounded-md text-xs font-semibold backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition"
                style={{ color: "var(--text)" }}
                onClick={logout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-xs opacity-80" />
          )}
        </div>
      </aside>

      {/* Create menu */}
      <Menu
        ref={menuRef}
        model={createMenuItems}
        popup
        className="!min-w-[200px]"
      />
    </div>
  );
}
