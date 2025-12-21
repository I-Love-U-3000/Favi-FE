const baseUrl = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      error: (data as any)?.error || (data as any)?.message || "Request failed",
    };
  }
  return data;
}

async function tryRefreshAndRetry(url: string, init: RequestInit): Promise<any> {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refreshToken) throw { status: 401, message: "No refresh token" };

  const refreshRes = await fetch(String(baseUrl) + "/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refreshToken), // backend nhận body là string
  });

  if (!refreshRes.ok) throw { status: 401, message: "Refresh token expired" };

  const refreshData = await refreshRes.json();
  const newAccess = refreshData?.accessToken ?? refreshData?.access_token;
  const newRefresh = refreshData?.refreshToken ?? refreshData?.refresh_token;

  if (newAccess) localStorage.setItem("access_token", newAccess);
  if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

  const retryInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${newAccess}`,
    },
  };

  const retryRes = await fetch(url, retryInit);
  return handleResponse(retryRes);
}

async function request<T>(
  method: string,
  path: string,
  body?: any,
  auth = true
): Promise<T> {
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
  } catch (e: any) {
    throw { status: 0, error: e?.message || "Network error" };
  }

  if (res.status === 401 && auth) {
    try {
      return await tryRefreshAndRetry(url, init);
    } catch (err) {
      console.warn("Token refresh failed", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      throw err;
    }
  }

  return handleResponse(res);
}

export const fetchWrapper = {
  get:  <T>(path: string, auth = true) => request<T>("GET", path, undefined, auth),
  post: <T>(path: string, body?: any, auth = true) => request<T>("POST", path, body, auth),
  put:  <T>(path: string, body?: any, auth = true) => request<T>("PUT", path, body, auth),
  patch:<T>(path: string, body?: any, auth = true) => request<T>("PATCH", path, body, auth),
  del:  <T>(path: string, body?: any, auth = true) => request<T>("DELETE", path, body, auth),
};