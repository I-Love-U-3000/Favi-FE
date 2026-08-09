// Generic type for request body
export type RequestBody = unknown;

// Error response type
export interface ApiError {
  status: number;
  error?: string;
  message?: string;
  code?: string;
  details?: string;
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

async function handleResponse<T>(res: Response, method: string, url: string): Promise<ApiResponse<T>> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiError = data as Record<string, unknown>;
    const thrownError: ApiError = {
      status: res.status,
      error: (apiError.error || apiError.message || "Request failed") as string,
      message: apiError.message as string | undefined,
      code: apiError.code as string | undefined,
      details: apiError.details as string | undefined,
    };
    
    console.error(`[API Error] ${method} ${url} failed with status ${res.status}:`, {
      code: thrownError.code,
      message: thrownError.message,
      details: thrownError.details,
      rawResponse: data
    });

    throw thrownError;
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

  if (!refreshRes.ok) {
    console.error(`[API Auth Error] Token refresh request failed with status ${refreshRes.status}`);
    throw { status: 401, message: "Refresh token expired" };
  }

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
  return handleResponse<T>(retryRes, init.method || "GET", url);
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
  auth = true,
  customBaseUrl?: string
): Promise<ApiResponse<T>> {
  const base = customBaseUrl || baseUrl;
  if (!base && !path.startsWith("http")) throw new Error("Missing API URL");
  
  const isAbsoluteUrl = path.startsWith("http://") || path.startsWith("https://");
  const url = isAbsoluteUrl ? path : String(base) + path;

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
    console.error(`[API Network Error] ${method} ${url} failed to connect:`, error);
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

  return handleResponse<T>(res, method, url);
}

export const fetchWrapper = {
  get:  <T>(path: string, auth = true, customBaseUrl?: string) => request<T>("GET", path, undefined, auth, customBaseUrl),
  post: <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string) => request<T>("POST", path, body, auth, customBaseUrl),
  put:  <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string) => request<T>("PUT", path, body, auth, customBaseUrl),
  patch:<T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string) => request<T>("PATCH", path, body, auth, customBaseUrl),
  del:  <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string) => request<T>("DELETE", path, body, auth, customBaseUrl),
};