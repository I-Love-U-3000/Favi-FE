// Generic type for request body
export type RequestBody = unknown;

// Error response type
export interface ApiError {
  status: number;
  error?: string;
  message?: string;
}

// Response wrapper type
export type ApiResponse<T> = T;

// Refresh token response type
export interface RefreshTokenResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
}

/**
 * Recursively convert PascalCase keys to camelCase
 * Handles nested objects and arrays
 */
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    // Convert PascalCase to camelCase
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>);
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      error: (data as ApiError)?.error || (data as ApiError)?.message || "Request failed",
    };
  }
  // Convert backend PascalCase to frontend camelCase
  return toCamelCase(data) as ApiResponse<T>;
}

async function tryRefreshAndRetry<T>(
  url: string,
  init: RequestInit
): Promise<ApiResponse<T>> {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refreshToken) throw { status: 401, message: "No refresh token" };

  const refreshRes = await fetch(String(baseUrl) + "/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refreshToken), // backend nhận body là string
  });

  if (!refreshRes.ok) throw { status: 401, message: "Refresh token expired" };

  const refreshData = await refreshRes.json() as RefreshTokenResponse;
  const newAccess = refreshData?.accessToken ?? refreshData?.access_token;
  const newRefresh = refreshData?.refreshToken ?? refreshData?.refresh_token;

  if (newAccess && typeof window !== "undefined") localStorage.setItem("access_token", newAccess);
  if (newRefresh && typeof window !== "undefined") localStorage.setItem("refresh_token", newRefresh);

  const retryInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${newAccess}`,
    },
  };

  const retryRes = await fetch(url, retryInit);
  return handleResponse<T>(retryRes);
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: RequestBody,
  auth = true
): Promise<ApiResponse<T>> {
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");
  const url = String(baseUrl) + path;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  // KHÔNG set Content-Type nếu là FormData
  const headers: Record<string, string> = {
    ...(auth ? getAuthHeaders() : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  const init: RequestInit = {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
        ? body
        : JSON.stringify(body),
  };

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e: unknown) {
    const error = e as Error;
    throw { status: 0, error: error?.message || "Network error" };
  }

  if (res.status === 401 && auth) {
    try {
      return await tryRefreshAndRetry<T>(url, init);
    } catch (err: unknown) {
      console.warn("Token refresh failed", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      throw err;
    }
  }

  return handleResponse<T>(res);
}

export const fetchWrapper = {
  get:  <T>(path: string, auth = true) => request<T>("GET", path, undefined, auth),
  post: <T>(path: string, body?: RequestBody, auth = true) => request<T>("POST", path, body, auth),
  put:  <T>(path: string, body?: RequestBody, auth = true) => request<T>("PUT", path, body, auth),
  patch:<T>(path: string, body?: RequestBody, auth = true) => request<T>("PATCH", path, body, auth),
  del:  <T>(path: string, body?: RequestBody, auth = true) => request<T>("DELETE", path, body, auth),
};