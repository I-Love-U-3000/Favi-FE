"use client";

import { useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Breadcrumb } from "primereact/breadcrumb";
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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 flex items-center px-6">
      {/* Breadcrumb */}
      <div className="hidden md:block">
        <Breadcrumb
          model={breadcrumbItems}
          home={{ icon: "pi pi-home", url: "/admin" }}
          className="!text-sm !bg-transparent !p-0"
          itemClassName="!text-gray-600 dark:!text-gray-400"
          linkClassName="hover:!text-primary"
          unstyled
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-64">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <InputText
          ref={searchRef}
          placeholder="Search... (Ctrl+K)"
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Spacer */}
      <div className="w-4" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={(e) => notifMenuRef.current?.toggle(e)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <i className="pi pi-bell text-lg" />
          <Badge
            value="3"
            severity="danger"
            className="absolute -top-1 -right-1"
          />
        </button>
        <Menu
          ref={notifMenuRef}
          model={notificationItems}
          popup
          className="!min-w-[280px] !mt-2"
          itemClassName="!py-2"
        />
      </div>

      {/* User Menu */}
      <div className="relative ml-2">
        <button
          onClick={(e) => userMenuRef.current?.toggle(e)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Avatar
            image={(user as any)?.avatarUrl}
            icon={!((user as any)?.avatarUrl) ? "pi pi-user" : undefined}
            shape="circle"
            size="normal"
            className="bg-primary/10"
          />
          <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {(user as any)?.displayName || "Admin"}
          </span>
          <i className="pi pi-chevron-down text-xs text-gray-400 hidden md:block" />
        </button>
        <Menu
          ref={userMenuRef}
          model={userMenuItems}
          popup
          className="!min-w-[200px] !mt-2"
        />
      </div>
    </header>
  );
}
