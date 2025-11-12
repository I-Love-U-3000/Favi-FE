// src/lib/api/authAPI.ts
import { fetchWrapper } from "@/lib/fetchWrapper";

type SupabaseAuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; 
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
  };
  weak_password?: string | null;
};

type DecodedJwt = { exp?: number; sub?: string; email?: string; role?: any };

const decodeJWT = (token: string | null | undefined): DecodedJwt | null => {
  if (!token) return null;
  try {
    const [_, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
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

function persistAuth(res: SupabaseAuthResponse) {
  const access = res.access_token;
  const refresh = res.refresh_token;

  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);

  // user_info dùng cho UI nhanh
  const decoded = decodeJWT(access);
  const user_info = {
    id: decoded?.sub ?? res.user?.id,
    email: decoded?.email ?? res.user?.email,
    role: decoded?.role ?? res.user?.role,
  };
  localStorage.setItem("user_info", JSON.stringify(user_info));
}

export const authAPI = {
  // BE chỉ hỗ trợ email + password
  loginWithIdentifier: async (identifier: string, password: string) => {
    const email = identifier.trim();
    if (!isEmail(email)) throw new Error("Vui lòng dùng email (backend không hỗ trợ username).");
    return authAPI.login({ email, password });
  },

  login: async (payload: { email: string; password: string }) => {
    // POST /auth/login -> SupabaseAuthResponse (snake_case)
    const res = await fetchWrapper.post<SupabaseAuthResponse>("/auth/login", payload, false);
    persistAuth(res);
    return res;
  },

  // Nếu bạn dùng /auth/refresh ở BE: body là chuỗi token
  refresh: async () => {
    const rt = localStorage.getItem("refresh_token");
    if (!rt) throw new Error("No refresh token");

    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // hoặc text/plain
      body: JSON.stringify(rt),                         // 👈 gửi string, không phải { refreshToken: ... }
    });
    if (!res.ok) throw new Error("Refresh token expired");
    const data = (await res.json()) as SupabaseAuthResponse;
    persistAuth(data);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  },

  // Register new account -> returns SupabaseAuthResponse like login
  register: async (payload: { username: string; email: string; password: string }) => {
    const res = await fetchWrapper.post<SupabaseAuthResponse>("/auth/register", payload, false);
    // In case backend returns tokens on successful registration, persist them
    if (res && (res as any).access_token) {
      persistAuth(res);
    }
    return res;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("access_token");
    const decoded = decodeJWT(token);
    return !!token && !isExpired(decoded);
  },

  getToken: () => localStorage.getItem("access_token"),

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
