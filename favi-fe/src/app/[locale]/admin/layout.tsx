"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { useTranslations } from "next-intl";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const t = useTranslations("AdminPanel");

  // Check auth - redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      router.push("/home");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Show loading while checking auth
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-3xl text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t("CheckingPermissions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <AdminHeader />

      <main className="pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
