"use client";

import { useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BreadCrumb } from "primereact/breadcrumb";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { useRouter } from "@/i18n/routing";

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<Menu>(null);
  const notifMenuRef = useRef<Menu>(null);

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname?.split("/") || [];
    const items = [{ label: "Home", href: "/admin" }];

    let currentPath = "/admin";
    for (let i = 2; i < segments.length; i++) {
      const segment = segments[i];
      if (segment === "[locale]") continue;

      currentPath += `/${segment}`;
      items.push({
        label: segment === "[id]" ? "Detail" : segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }

    return items;
  }, [pathname]);

  // User menu items
  const userMenuItems = [
    {
      label: "Profile",
      icon: "pi pi-user",
      command: () => router.push("/profile/u_001"),
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      command: () => router.push("/settings"),
    },
    { separator: true },
    {
      label: "Logout",
      icon: "pi pi-sign-out",
      command: () => logout(),
    },
  ];

  // Notification items (placeholder)
  const notificationItems = [
    {
      label: "New report pending",
      icon: "pi pi-flag text-yellow-500",
      command: () => router.push("/admin/reports"),
    },
    {
      label: "System health check passed",
      icon: "pi pi-heart text-green-500",
      command: () => router.push("/admin/health"),
    },
  ];

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 z-30 flex items-center px-8 transition-all duration-300">
      {/* Breadcrumb */}
      <div className="hidden lg:block">
        <BreadCrumb
          model={breadcrumbItems}
          home={{ icon: "pi pi-home", url: "/admin" }}
          className="!text-xs !bg-transparent !p-0 !border-none text-slate-400"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-72 group">
        <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors" />
        <InputText
          ref={searchRef}
          placeholder="Search... (Ctrl+K)"
          className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-white placeholder:text-slate-500"
        />
      </div>

      {/* Spacer */}
      <div className="w-6" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={(e) => notifMenuRef.current?.toggle(e)}
          className="p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <i className="pi pi-bell text-lg" />
          <Badge
            value="3"
            severity="danger"
            className="absolute top-1.5 right-1.5 border-2 border-[#0f172a] scale-90"
          />
        </button>
        <Menu
          ref={notifMenuRef}
          model={notificationItems}
          popup
          className="!min-w-[320px] !mt-3 shadow-xl border-slate-800"
        />
      </div>

      {/* User Menu */}
      <div className="relative ml-2">
        <button
          onClick={(e) => userMenuRef.current?.toggle(e)}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
        >
          <Avatar
            image={(user as any)?.avatarUrl}
            icon={!((user as any)?.avatarUrl) ? "pi pi-user" : undefined}
            shape="circle"
            size="normal"
            className="w-8 h-8 ring-2 ring-primary/10"
          />
          <div className="hidden md:block text-left mr-1">
            <div className="text-[13px] font-semibold text-white leading-tight">
              {(user as any)?.displayName || "Admin"}
            </div>
          </div>
          <i className="pi pi-chevron-down text-[10px] text-slate-400 hidden md:block" />
        </button>
        <Menu
          ref={userMenuRef}
          model={userMenuItems}
          popup
          className="!min-w-[220px] !mt-3 shadow-xl border-slate-800"
        />
      </div>
    </header>
  );
}
