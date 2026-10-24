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
    
    if (res.status === 404) {
      console.debug(`[API 404] ${method} ${url} (Resource not found or private)`);
    } else {
      console.error(`[API Error] ${method} ${url} failed with status ${res.status}:`, {
        code: thrownError.code,
        message: thrownError.message,
        details: thrownError.details,
        rawResponse: data
      });
    }

    if (res.status === 409 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("favi-concurrency-conflict", { detail: thrownError }));
    }

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
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth-token-expired"));
    }
    console.warn(`[API Auth] Session expired or refresh token invalid (${refreshRes.status}). Cleared tokens.`);
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

const DEFAULT_MAX_RETRIES = 3;
const MAX_RETRY_INTERVAL_MS = 15000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates progressive retry delay:
 * - Retry 1: 0ms (immediate)
 * - Retry 2: 5000ms (5 seconds after Retry 1)
 * - Retry 3: 10000ms (10 seconds after Retry 2)
 * - Subsequent retries: capped at 15000ms (15 seconds max)
 */
export function calculateRetryDelay(retryCount: number): number {
  if (retryCount <= 1) return 0;
  return Math.min((retryCount - 1) * 5000, MAX_RETRY_INTERVAL_MS);
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
  customBaseUrl?: string,
  maxRetries = DEFAULT_MAX_RETRIES
): Promise<ApiResponse<T>> {
  const base = customBaseUrl || baseUrl;
  if (!base && !path.startsWith("http")) throw new Error("Missing API URL");
  
  const isAbsoluteUrl = path.startsWith("http://") || path.startsWith("https://");
  const url = isAbsoluteUrl ? path : String(base) + path;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  const idempotencyKey = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // KHÔNG set Content-Type nếu là FormData
  const headers: Record<string, string> = {
    ...(auth ? getAuthHeaders() : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(isMutating ? { "Idempotency-Key": idempotencyKey } : {}),
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

  let retryCount = 0;

  while (true) {
    // Keep Authorization header synchronized with latest token if updated between retries
    if (auth) {
      const currentAuth = getAuthHeaders();
      if (currentAuth.Authorization) {
        (init.headers as Record<string, string>)["Authorization"] = currentAuth.Authorization;
      }
    }

    let res: Response | null = null;
    let networkError: Error | null = null;

    try {
      res = await fetch(url, init);
    } catch (e: unknown) {
      networkError = e as Error;
      console.warn(`[API Network Error] ${method} ${url} failed to connect (attempt ${retryCount + 1}):`, networkError?.message);
    }

    // 1. If network error occurred (fetch threw, status: 0)
    if (!res) {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = calculateRetryDelay(retryCount);
        console.warn(`[API Retry] ${method} ${url} retrying attempt ${retryCount}/${maxRetries} in ${delay}ms...`);
        if (delay > 0) await sleep(delay);
        continue;
      }

      console.error(`[API Network Failure] ${method} ${url} failed after ${maxRetries} retries:`, networkError);
      throw { status: 0, error: networkError?.message || "Network error" };
    }

    // 2. HTTP 401 Unauthorized: handled exclusively via tryRefreshAndRetry
    if (res.status === 401 && auth) {
      try {
        return await tryRefreshAndRetry<T>(url, init);
      } catch (err: unknown) {
        console.warn("[API Auth] Token refresh failed, terminating retry:", err);
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        throw err;
      }
    }

    // 3. HTTP 404 Not Found: explicitly excluded from retries
    if (res.status === 404) {
      return handleResponse<T>(res, method, url);
    }

    // 4. Successful response: return immediately
    if (res.ok) {
      return handleResponse<T>(res, method, url);
    }

    // 5. Any other failure status (except 404 and 401): retry according to policy
    if (retryCount < maxRetries) {
      retryCount++;
      const delay = calculateRetryDelay(retryCount);
      console.warn(`[API Retry] ${method} ${url} failed with status ${res.status}. Retrying attempt ${retryCount}/${maxRetries} in ${delay}ms...`);
      if (delay > 0) await sleep(delay);
      continue;
    }

    // 6. Max retries exhausted: handle and throw standard ApiError
    return handleResponse<T>(res, method, url);
  }
}

export const fetchWrapper = {
  get:  <T>(path: string, auth = true, customBaseUrl?: string, maxRetries = DEFAULT_MAX_RETRIES) => request<T>("GET", path, undefined, auth, customBaseUrl, maxRetries),
  post: <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string, maxRetries = DEFAULT_MAX_RETRIES) => request<T>("POST", path, body, auth, customBaseUrl, maxRetries),
  put:  <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string, maxRetries = DEFAULT_MAX_RETRIES) => request<T>("PUT", path, body, auth, customBaseUrl, maxRetries),
  patch:<T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string, maxRetries = DEFAULT_MAX_RETRIES) => request<T>("PATCH", path, body, auth, customBaseUrl, maxRetries),
  del:  <T>(path: string, body?: RequestBody, auth = true, customBaseUrl?: string, maxRetries = DEFAULT_MAX_RETRIES) => request<T>("DELETE", path, body, auth, customBaseUrl, maxRetries),
};