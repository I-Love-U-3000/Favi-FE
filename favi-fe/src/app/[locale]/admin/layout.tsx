"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "@/i18n/routing";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("AdminPanel");
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: t("Dashboard") },
    { href: "/admin/reports", label: t("Reports") },
    { href: "/admin/users", label: t("Users") },
    { href: "/admin/posts", label: t("Posts") },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">{t("Title")}</h1>
          </div>
        </header>

        {/* Navigation */}
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`py-4 px-2 border-b-2 transition-colors ${
                      isActive
                        ? "border-primary text-primary font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
