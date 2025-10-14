// src/lib/api/authAPI.ts
import { fetchWrapper } from "@/lib/fetchWrapper";
import type { LoginResponse } from "@/types";
import type { DecodedJwt } from "@/types";

/** Decode a JWT without verifying signature (client-side convenience only) */
const decodeJWT = (token: string | null | undefined): DecodedJwt | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    // atob in browser, Buffer in SSR
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(
            Array.prototype.map
              .call(atob(padded), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        : Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isExpired = (decoded: DecodedJwt | null): boolean => {
  if (!decoded?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowSec;
};

const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

export const authAPI = {
  loginWithIdentifier: async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    let payload: { email?: string; username?: string; password: string };

    if (isEmail(trimmed)) {
      payload = { email: trimmed, password };
    } else {
      payload = { username: trimmed, password };
    }

    return authAPI.login(payload);
  },

  login: async (payload: { email?: string; cccd?: string; password: string }) => {
    const res = await fetchWrapper.post<LoginResponse>("/auth/login", payload, false);
    if (res.accessToken && res.refreshToken) {
      localStorage.setItem("access_token", res.accessToken);
      localStorage.setItem("refresh_token", res.refreshToken);
      const decoded = decodeJWT(res.accessToken);
      if (decoded) {
        localStorage.setItem(
          "user_info",
          JSON.stringify({ id: decoded.sub, email: decoded.email, role: decoded.role })
        );
      }
    }
  },

    register: async (payload: { email: string; password: string; username: string }) => {
    const res = await fetchWrapper.post<any>("/auth/register", payload, false);
    // Hỗ trợ cả camelCase và snake_case
    const access = res?.accessToken ?? res?.access_token;
    const refresh = res?.refreshToken ?? res?.refresh_token;

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      const decoded = decodeJWT(access);
      if (decoded) {
        localStorage.setItem(
          "user_info",
          JSON.stringify({ id: decoded.sub, email: (decoded as any).email, role: (decoded as any).role })
        );
      }
    }
    return res;
  },

  /** Refresh access token */
  refresh: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token");
    const res = await fetchWrapper.post<LoginResponse>("/auth/refresh", { refreshToken }, false);
    if (res.accessToken) localStorage.setItem("access_token", res.accessToken);
    if (res.refreshToken) localStorage.setItem("refresh_token", res.refreshToken);

    const decoded = decodeJWT(res.accessToken);
    if (decoded) {
      localStorage.setItem(
        "user_info",
        JSON.stringify({ id: decoded.sub, email: decoded.email, role: decoded.role })
      );
    }
    return res;
  },

  /** Logout and clear local storage */
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  },

  /** Kiểm tra đã đăng nhập hay chưa (và token còn hạn không) */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("access_token");
    const decoded = decodeJWT(token);
    if (!decoded || isExpired(decoded)) return false;
    return true;
  },

  /** Lấy access token hiện tại (có thể hết hạn — hãy kiểm tra trước khi dùng) */
  getToken: () => localStorage.getItem("access_token"),

  /** (Tuỳ chọn) Lấy thông tin user đã lưu */
  getUserInfo: <T = { id?: string; email?: string; role?: any }>() => {
    const raw = localStorage.getItem("user_info");
    if (!raw) return null as unknown as T | null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null as unknown as T | null;
    }
  },
};

export default authAPI;
