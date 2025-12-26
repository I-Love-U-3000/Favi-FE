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

  console.log('=== AUTH RESPONSE FROM BACKEND ===');
  console.log('Full response:', res);
  console.log('Access token (first 50 chars):', access?.substring(0, 50) + '...');
  console.log('Response user object:', res.user);

  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);

  // user_info dùng cho UI nhanh
  const decoded = decodeJWT(access);
  console.log('Decoded JWT payload:', decoded);

  const user_info = {
    id: decoded?.sub ?? res.user?.id,
    email: decoded?.email ?? res.user?.email,
    role: decoded?.role ?? res.user?.role,
  };

  console.log('Final user_info being stored:', user_info);
  console.log('====================================');

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

    console.log('=== REFRESH TOKEN REQUEST ===');
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // hoặc text/plain
      body: JSON.stringify(rt),                         // 👈 gửi string, không phải { refreshToken: ... }
    });
    if (!res.ok) throw new Error("Refresh token expired");
    const data = (await res.json()) as SupabaseAuthResponse;
    console.log('Refresh response:', data);
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
    console.log('=== REGISTER REQUEST ===');
    console.log('Payload:', { ...payload, password: '***' });
    const res = await fetchWrapper.post<SupabaseAuthResponse>("/auth/register", payload, false);
    console.log('Register response:', res);
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

  // Check if current user is admin
  // Backend enum: User=0, Moderator=1, Admin=2

  // Debug helper to check current auth state
  debugAuthState: () => {
    const token = localStorage.getItem("access_token");
    const userInfo = authAPI.getUserInfo();
    const decoded = decodeJWT(token);

    console.log('=== CURRENT AUTH STATE ===');
    console.log('Access token exists:', !!token);
    console.log('Access token (first 50 chars):', token?.substring(0, 50) + '...');
    console.log('Decoded JWT:', decoded);
    console.log('User info from localStorage:', userInfo);
    console.log('Is admin?', authAPI.isAdmin());
    console.log('==========================');
    return { token, userInfo, decoded };
  },

  isAdmin: (): boolean => {
    const userInfo = authAPI.getUserInfo<{ id?: string; email?: string; role?: any }>();

    // Debug: log what we have
    console.log('[isAdmin] User info from localStorage:', userInfo);

    // ⚠️ TEMPORARY FIX: Hardcode admin email
    // TODO: Remove this once backend sends correct role
    if (userInfo?.email === 'nnguyenminhquang786@gmail.com') {
      console.log('[isAdmin] Temporary fix: User is admin by email');
      return true;
    }

    if (!userInfo?.role) {
      console.log('[isAdmin] No role found in user info');
      return false;
    }

    // Role can be a number (enum), string, or array
    const roles = Array.isArray(userInfo.role) ? userInfo.role : [userInfo.role];
    const isAdminOrMod = roles.some((r: any) => {
      // Handle numeric enum values: 0=User, 1=Moderator, 2=Admin
      if (typeof r === 'number') {
        return r === 2 || r === 1; // Admin or Moderator
      }
      // Handle string values
      if (typeof r === 'string') {
        const roleLower = r.toLowerCase();
        return roleLower === 'admin' ||
               roleLower === 'administrator' ||
               roleLower === 'moderator';
      }
      return false;
    });

    console.log('[isAdmin] Result:', isAdminOrMod, 'Role:', userInfo.role);
    return isAdminOrMod;
  },
};

export default authAPI;
