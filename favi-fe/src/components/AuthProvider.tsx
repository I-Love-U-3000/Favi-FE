"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authAPI from "@/lib/api/authAPI";
import { useRouter } from "@/i18n/routing";

type UserInfo = { id?: string; email?: string; role?: any } | null;

type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: UserInfo;
  refresh: () => void;
  requireAuth: (onAuthed?: () => void) => boolean;
  logout: () => void;
  setGuestMode: (enable: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const router = useRouter();

  const compute = useCallback(() => {
    try {
      const authed = authAPI.isAuthenticated();
      setIsAuthenticated(authed);
      const info = authAPI.getUserInfo<UserInfo>();
      setUser(authed ? info : null);
      const gm = typeof window !== "undefined" ? localStorage.getItem("guest_mode") === "1" : false;
      setIsGuest(gm);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setIsGuest(false);
    }
  }, []);

  useEffect(() => {
    compute();
    const onStorage = (e: StorageEvent) => {
      if (!e || (e.key !== "access_token" && e.key !== "refresh_token" && e.key !== "user_info")) return;
      compute();
    };
    const onPop = () => compute();
    window.addEventListener("storage", onStorage);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("popstate", onPop);
    };
  }, [compute]);

  const logout = useCallback(() => {
    authAPI.logout();
    try { localStorage.removeItem("guest_mode"); } catch {}
    compute();
    // Redirect to login page (locale-aware)
    router.push("/login");
  }, [compute]);

  const requireAuth: AuthContextType["requireAuth"] = useCallback((onAuthed) => {
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để thực hiện thao tác này.");
      return false;
    }
    if (onAuthed) onAuthed();
    return true;
  }, [isAuthenticated]);

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated,
    isGuest,
    user,
    refresh: compute,
    requireAuth,
    logout,
    setGuestMode: (enable: boolean) => {
      try {
        if (enable) {
          localStorage.setItem("guest_mode", "1");
        } else {
          localStorage.removeItem("guest_mode");
        }
      } catch {}
      compute();
    },
  }), [isAuthenticated, isGuest, user, compute, requireAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
