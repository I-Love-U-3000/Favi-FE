"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import useProfile from "@/lib/hooks/useProfile";
import { useOverlay } from "@/components/RootProvider";
import { useSignalRContext } from "@/lib/contexts/SignalRContext";
import { Menu } from "primereact/menu";

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

const ADMIN_NAV: Item[] = [
  { label: "Admin Panel", href: "/admin/dashboard", icon: "pi pi-shield" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const me = useProfile(user?.id);

  const {
    openPostComposer,
    openCollectionComposer,
    openStoryComposer,
    openNotificationDialog,
  } = useOverlay();

  const { unreadCount } = useSignalRContext();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<Menu>(null);

  // Set default open state depending on screen size
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOpen(window.innerWidth >= 768);
    }
  }, []);

  const navItems = useMemo(() => {
    if (isAuthenticated) {
      if (isAdmin) return [...ADMIN_NAV, ...NAV];
      return NAV;
    }
    return [
      { label: "Home", href: "/home", icon: "pi pi-home" },
      { label: "Explore", href: "/search", icon: "pi pi-search" },
      { label: "Friends", href: "/friends", icon: "pi pi-users" },
      { label: "Đăng nhập", href: "/login", icon: "pi pi-sign-in" },
      { label: "Đăng ký", href: "/register", icon: "pi pi-user-plus" },
    ];
  }, [isAuthenticated, isAdmin]);

  const createMenuItems = [
    { label: "New Post", icon: "pi pi-image", command: () => openPostComposer() },
    { label: "New Collection", icon: "pi pi-folder", command: () => openCollectionComposer() },
    { label: "New Story", icon: "pi pi-circle-on", command: () => openStoryComposer() },
  ];

  const handleCreateClick = (event: React.MouseEvent) => {
    menuRef.current?.toggle(event);
  };

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
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

    document.addEventListener("click", requestPermission, { once: true });
    return () => document.removeEventListener("click", requestPermission);
  }, []);

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:-translate-y-[1px]
     ${active ? "bg-primary/15 font-semibold text-primary" : "hover:bg-white/10 dark:hover:bg-white/10"}`;

  const profileHref =
    isAuthenticated && (user as any)?.id ? `/profile/${(user as any).id}` : "/profile/me";

  return (
    <>
      {/* ================= MOBILE TOP HEADER (< md) ================= */}
      <header
        className="md:hidden fixed top-0 inset-x-0 h-14 z-30 glass border-b border-white/10 dark:border-white/5 flex items-center justify-between px-3 sm:px-4"
        style={{ color: "var(--text)" }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition"
            aria-label="Open navigation menu"
          >
            <i className="pi pi-bars text-base" />
          </button>
          <Link href="/home" scroll={false} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favi-logo.png" alt="logo" className="w-7 h-7 rounded-full" />
            <span className="text-lg font-bold tracking-tight">Favi</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={handleCreateClick}
                className="p-2 rounded-lg glass hover:bg-white/10 transition"
                aria-label="Create new"
              >
                <i className="pi pi-plus text-sm" />
              </button>
              <button
                type="button"
                onClick={openNotificationDialog}
                className="relative p-2 rounded-lg glass hover:bg-white/10 transition"
                aria-label="Notifications"
              >
                <i className="pi pi-bell text-base" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>
            </>
          )}
          <Link
            href={isAuthenticated ? profileHref : "/login"}
            className="p-1 rounded-full transition hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={me.profile?.avatarUrl || "/avatar-default.svg"}
              alt="avatar"
              className="w-7 h-7 rounded-full border border-white/20 object-cover"
            />
          </Link>
        </div>
      </header>

      {/* Mobile Top Spacer to prevent content under header */}
      <div className="md:hidden h-14 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* ================= MOBILE BOTTOM NAVIGATION (< md) ================= */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 h-16 z-30 glass border-t border-white/10 dark:border-white/5 flex items-center justify-around px-2"
        style={{ color: "var(--text)" }}
      >
        <Link
          href="/home"
          scroll={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            pathname?.startsWith("/home")
              ? "font-bold text-primary"
              : "opacity-70 hover:opacity-100"
          }`}
          style={{ color: pathname?.startsWith("/home") ? "var(--primary)" : undefined }}
        >
          <i className="pi pi-home text-lg" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        <Link
          href="/search"
          scroll={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            pathname?.startsWith("/search")
              ? "font-bold text-primary"
              : "opacity-70 hover:opacity-100"
          }`}
          style={{ color: pathname?.startsWith("/search") ? "var(--primary)" : undefined }}
        >
          <i className="pi pi-search text-lg" />
          <span className="text-[10px] mt-0.5">Explore</span>
        </Link>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleCreateClick}
            className="flex flex-col items-center justify-center flex-1 py-1 transition group"
            aria-label="Create"
          >
            <div
              className="w-10 h-10 -mt-5 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ backgroundColor: "var(--primary, #3b82f6)", color: "white" }}
            >
              <i className="pi pi-plus text-base font-bold" />
            </div>
            <span className="text-[10px] mt-0.5 opacity-80">Create</span>
          </button>
        )}

        <Link
          href="/chat"
          scroll={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            pathname?.startsWith("/chat")
              ? "font-bold text-primary"
              : "opacity-70 hover:opacity-100"
          }`}
          style={{ color: pathname?.startsWith("/chat") ? "var(--primary)" : undefined }}
        >
          <i className="pi pi-comments text-lg" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </Link>

        <Link
          href={isAuthenticated ? profileHref : "/login"}
          scroll={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            pathname?.includes("/profile/")
              ? "font-bold text-primary"
              : "opacity-70 hover:opacity-100"
          }`}
          style={{ color: pathname?.includes("/profile/") ? "var(--primary)" : undefined }}
        >
          <i className="pi pi-user text-lg" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </Link>
      </nav>

      {/* ================= BACKDROP FOR MOBILE DRAWER ================= */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= DESKTOP SPACER ================= */}
      <div
        className="hidden md:block shrink-0 transition-[width] duration-200"
        style={{ width: isOpen ? "16rem" : "0" }}
      >
        {/* Button to re-open desktop sidebar when collapsed */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden md:inline-flex items-center gap-2 fixed top-3 left-3 z-50 px-3 py-2 rounded-md text-sm glass hover:bg-white/5 transition"
            style={{ color: "var(--text)" }}
            aria-label="Open sidebar"
          >
            <i className="pi pi-bars text-sm" />
          </button>
        )}
      </div>

      {/* ================= MAIN SIDEBAR (DESKTOP + MOBILE DRAWER) ================= */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 md:w-64 z-50 overflow-hidden rounded-r-[24px] md:rounded-r-[32px]
          transition-[transform,opacity] duration-200
          ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none md:pointer-events-none"}
          glass`}
        style={{ color: "var(--text)" }}
      >
        {/* Soft highlight layer */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        />

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 dark:border-white/5">
            <Link href="/home" scroll={false} onClick={handleNavClick} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favi-logo.png" alt="logo" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-semibold" style={{ color: "var(--text)" }}>
                Favi
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="ml-auto inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs glass hover:bg-white/5 transition"
              style={{ color: "var(--text)" }}
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              <i className="pi pi-times md:pi-bars text-sm" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-4 space-y-2 overflow-y-auto h-[calc(100vh-64px-76px)]">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);

              const href =
                item.label === "Profile" && isAuthenticated && (user as any)?.id
                  ? `/profile/${(user as any).id}`
                  : item.href;

              if (item.label === "Notifications" && isAuthenticated) {
                return (
                  <button
                    key={href}
                    onClick={() => {
                      handleNavClick();
                      openNotificationDialog();
                    }}
                    className={`w-full text-left ${itemClass(active)}`}
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
                  scroll={false}
                  onClick={handleNavClick}
                  className={itemClass(active)}
                  style={{ color: "var(--text)" }}
                >
                  <i className={`${item.icon} text-lg ${active ? "" : "opacity-80"}`} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {isAuthenticated && (
              <button
                onClick={(e) => {
                  handleCreateClick(e);
                }}
                className={`w-full text-left ${itemClass(false)}`}
                style={{ color: "var(--text)" }}
              >
                <i className="pi pi-plus-circle text-lg opacity-90" />
                <span className="text-sm font-semibold">Create</span>
              </button>
            )}
          </nav>

          {/* User profile footer */}
          <div
            className="px-3 py-4 border-t border-white/10 dark:border-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={profileHref}
                  onClick={handleNavClick}
                  className="flex items-center gap-2 min-w-0 hover:opacity-80 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={me.profile?.avatarUrl || "/avatar-default.svg"}
                    alt={me.profile?.username || "avatar"}
                    className="w-9 h-9 rounded-full border border-white/20 dark:border-white/10 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                      {me.profile?.displayName || (user as any)?.email || "User"}
                    </div>
                    {me.profile?.username && (
                      <div className="text-[11px] opacity-70 truncate">
                        @{me.profile.username}
                      </div>
                    )}
                  </div>
                </Link>

                <button
                  className="px-3 py-1.5 rounded-md text-xs font-semibold glass hover:bg-white/5 transition shrink-0"
                  style={{ color: "var(--text)" }}
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/login"
                  onClick={handleNavClick}
                  className="w-full text-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow transition"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Create menu popover */}
      <Menu
        ref={menuRef}
        model={createMenuItems}
        popup
        className="!min-w-[200px] glass-menu z-[60]"
      />
    </>
  );
}