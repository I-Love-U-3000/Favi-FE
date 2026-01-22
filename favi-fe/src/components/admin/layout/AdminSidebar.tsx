"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "primereact/badge";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type NavItem = {
  labelKey: string;
  href: string;
  icon: string;
  badgeKey?: string;
};

const NAV_ITEMS: NavItem[] = [
  { labelKey: "Dashboard", href: "/admin", icon: "pi pi-home" },
  { labelKey: "Users", href: "/admin/users", icon: "pi pi-users" },
  { labelKey: "Posts", href: "/admin/posts", icon: "pi pi-file" },
  { labelKey: "Reports", href: "/admin/reports", icon: "pi pi-flag" },
  { labelKey: "AuditLogs", href: "/admin/audit", icon: "pi pi-history" },
  { labelKey: "Analytics", href: "/admin/analytics", icon: "pi pi-chart-bar" },
  { labelKey: "SystemHealth", href: "/admin/health", icon: "pi pi-heart" },
  { labelKey: "CommentsManagement", href: "/admin/comments", icon: "pi pi-comments" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminPanel");

  // Get current locale from pathname
  const currentLocale = useMemo(() => {
    const segments = pathname?.split("/") || [];
    return segments[1] || "en";
  }, [pathname]);

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
     ${active ? "bg-primary/20 text-primary font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`;

  const handleLogout = () => {
    logout();
  };

  const getLabel = (key: string) => {
    return t(key as any);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden hidden" id="sidebar-overlay" />

      <aside
        className="fixed top-0 left-0 h-screen w-64 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <img src="/favi-logo.png" alt="logo" className="w-8 h-8 rounded-full" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("Title")}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={itemClass(active)}
              >
                <i className={`${item.icon} text-lg ${active ? "" : "opacity-70"}`} />
                <span className="text-sm">{getLabel(item.labelKey)}</span>
                {item.badgeKey && (
                  <Badge
                    value={getLabel(item.badgeKey)}
                    severity="warning"
                    className="ml-auto"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <i className="pi pi-user text-primary text-sm" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate text-gray-900 dark:text-white">
                  {(user as any)?.email || "Admin"}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  Administrator
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title={t("UnbanUser")}
            >
              <i className="pi pi-sign-out text-sm" />
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for fixed sidebar */}
      <div className="w-64 shrink-0 hidden lg:block" />
    </>
  );
}
