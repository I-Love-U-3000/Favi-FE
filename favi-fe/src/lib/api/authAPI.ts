// src/lib/api/authAPI.ts
import { fetchWrapper } from "@/lib/fetchWrapper";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  message: string;
};

type DecodedJwt = { exp?: number; sub?: string; unique_name?: string; email?: string; "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string; "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string };

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

function persistAuth(res: AuthResponse) {
  const access = res.accessToken;
  const refresh = res.refreshToken;

  console.log('=== AUTH RESPONSE FROM BACKEND ===');
  console.log('Full response:', res);
  console.log('Access token (first 50 chars):', access?.substring(0, 50) + '...');

  if (typeof window !== "undefined") {
    if (access) localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  }

  // user_info dùng cho UI nhanh
  const decoded = decodeJWT(access);
  console.log('Decoded JWT payload:', decoded);

  // Extract claims from JWT
  const user_info = {
    id: decoded?.sub,
    email: decoded?.email,
    username: decoded?.unique_name || decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
    role: decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  };

  console.log('Final user_info being stored:', user_info);
  console.log('====================================');

  if (typeof window !== "undefined") {
    localStorage.setItem("user_info", JSON.stringify(user_info));
  }
}

export const authAPI = {
  // Backend supports both email and username login
  loginWithIdentifier: async (identifier: string, password: string) => {
    return authAPI.login({ emailOrUsername: identifier.trim(), password });
  },

  login: async (payload: { emailOrUsername: string; password: string }) => {
    // POST /auth/login -> AuthResponse
    const res = await fetchWrapper.post<AuthResponse>("/auth/login", payload, false);
    persistAuth(res);
    return res;
  },

  // Refresh token - body is the refresh token string
  refresh: async () => {
    if (typeof window === "undefined") throw new Error("Cannot refresh on server");
    const rt = localStorage.getItem("refresh_token");
    if (!rt) throw new Error("No refresh token");

    console.log('=== REFRESH TOKEN REQUEST ===');
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rt),
    });
    if (!res.ok) throw new Error("Refresh token expired");
    const data = (await res.json()) as AuthResponse;
    console.log('Refresh response:', data);
    persistAuth(data);
    return data;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
    }
  },

  // Register new account -> returns AuthResponse
  register: async (payload: { username: string; email: string; password: string; displayName?: string }) => {
    console.log('=== REGISTER REQUEST ===');
    console.log('Payload:', { ...payload, password: '***' });
    const res = await fetchWrapper.post<AuthResponse>("/auth/register", payload, false);
    console.log('Register response:', res);
    // Backend returns tokens on successful registration
    if (res && res.accessToken) {
      persistAuth(res);
    }
    return res;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("access_token");
    const decoded = decodeJWT(token);
    return !!token && !isExpired(decoded);
  },

  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  getUserInfo: <T = { id?: string; email?: string; role?: any }>() => {
    if (typeof window === "undefined") return null as unknown as T | null;
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
  isAdmin: (): boolean => {
    const userInfo = authAPI.getUserInfo<{ id?: string; email?: string; role?: any }>();

    // Debug: log what we have
    console.log('[isAdmin] User info from localStorage:', userInfo);

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
      // Handle string values (backend sends lowercase roles)
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

  // Debug helper to check current auth state
  debugAuthState: () => {
    if (typeof window === "undefined") {
      return { token: null, userInfo: null, decoded: null };
    }
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
};

export default authAPI;
