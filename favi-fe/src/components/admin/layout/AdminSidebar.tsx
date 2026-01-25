"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "primereact/badge";
import { Avatar } from "primereact/avatar";
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
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
     ${active
      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold"
      : "text-slate-100/70 hover:bg-white/10 hover:text-white"}`;

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
        className="fixed top-0 left-0 h-screen w-72 z-40 bg-[#0f172a] border-r border-white/5 flex flex-col transition-all duration-300 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-10">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <img src="/favi-logo.png" alt="logo" className="w-7 h-7 object-contain brightness-0 invert" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">
            ADMIN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={itemClass(active)}
              >
                <i className={`${item.icon} text-xl ${active ? "text-white" : "text-white/60 group-hover:text-white"}`} />
                <span className="text-[15px] font-semibold tracking-tight">{getLabel(item.labelKey)}</span>
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
        <div className="px-4 py-8 mt-auto">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                image={(user as any)?.avatarUrl}
                icon={!((user as any)?.avatarUrl) ? "pi pi-user" : undefined}
                shape="circle"
                className="w-12 h-12 border-2 border-white/20 shadow-lg"
              />
              <div className="min-w-0">
                <div className="text-[15px] font-bold truncate text-white">
                  {(user as any)?.displayName || "Admin User"}
                </div>
                <div className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">
                  Super Admin
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all flex items-center justify-center border border-transparent hover:border-rose-400/20"
              title={t("UnbanUser")}
            >
              <i className="pi pi-sign-out text-base" />
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for fixed sidebar */}
      <div className="w-72 shrink-0 hidden lg:block" />
    </>
  );
}
