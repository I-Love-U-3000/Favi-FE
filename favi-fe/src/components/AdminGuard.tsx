"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";

type AdminGuardProps = {
  children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      alert("Bạn không có quyền truy cập trang này.");
      router.push("/");
      return;
    }
  }, [isAdmin, isAuthenticated, router]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
