import { fetchWrapper } from "@/lib/fetchWrapper";
import type { PostMediaResponse, ProfileResponse, SocialKind, FollowResponse } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

function isPlainObject(val: any) {
  return Object.prototype.toString.call(val) === "[object Object]";
}
function camelKey(k: string): string {
  if (!k) return k;
  return k[0].toLowerCase() + k.slice(1);
}
function camelize<T = any>(input: any): T {
  if (Array.isArray(input)) return input.map(camelize) as any;
  if (!isPlainObject(input)) return input;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) out[camelKey(k)] = camelize(v);
  return out as T;
}

async function uploadProfileAsset(path: string, file: File): Promise<PostMediaResponse> {
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");
  const url = `${baseUrl}${path}`;
  const form = new FormData();
  form.append("file", file);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const doUpload = async (bearer?: string | null) => {
    const headers = bearer ? { Authorization: `Bearer ${bearer}` } : undefined;
    const res = await fetch(url, { method: "POST", headers, body: form });
    return res;
  };

  let res = await doUpload(token);

  if (res.status === 401) {
    const rt = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!rt) throw new Error("No refresh token");
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rt),
    });
    if (!refreshRes.ok) throw new Error("Refresh token expired");
    const data = await refreshRes.json();
    const newAccess = data?.accessToken ?? data?.access_token;
    const newRefresh = data?.refreshToken ?? data?.refresh_token;
    if (newAccess && typeof window !== "undefined") localStorage.setItem("access_token", newAccess);
    if (newRefresh && typeof window !== "undefined") localStorage.setItem("refresh_token", newRefresh);
    res = await doUpload(newAccess);
  }

  if (!res.ok) {
    let message = "Upload failed";
    try {
      const err = await res.json();
      message = err?.message || err?.error || message;
    } catch { }
    throw new Error(message);
  }

  return camelize<PostMediaResponse>(await res.json());
}

export const profileAPI = {
  getById: (id: string) => fetchWrapper.get<ProfileResponse>(`/profiles/${id}`, true),
  getRecommendations: (skip?: number, take?: number) => {
    const q: string[] = [];
    if (typeof skip === "number") q.push(`skip=${skip}`);
    if (typeof take === "number") q.push(`take=${take}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    return fetchWrapper.get<ProfileResponse[]>(`/profiles/recommendations${qs}`, true);
  },
  getAvatar: (id: string) => fetchWrapper.get<string>(`/profiles/avatar/${id}`, false),
  getPoster: (id: string) => fetchWrapper.get<string>(`/profiles/poster/${id}`, false),
  uploadAvatar: (file: File) => uploadProfileAsset("/profiles/avatar", file),
  uploadPoster: (file: File) => uploadProfileAsset("/profiles/poster", file),

  update: async (payload: any) => {
    // Perform update, then try to update local cache if possible
    const res = await fetchWrapper.put<any>("/profiles", payload, true);
    try {
      // Best-effort: normalize and cache if response includes profile
      const { normalizeProfile, writeCachedProfile } = await import("@/lib/profileCache");
      const norm = normalizeProfile(res);
      if (norm?.id) writeCachedProfile(norm.id, norm);
    } catch { }
    return res;
  },

  follow: (targetId: string) => fetchWrapper.post<any>(`/profiles/follow/${targetId}`, undefined, true),

  unfollow: (targetId: string) => fetchWrapper.del<any>(`/profiles/follow/${targetId}`, undefined, true),

  followers: async (id: string, skip?: number, take?: number) => {
    const q: string[] = [];
    if (skip !== undefined) q.push(`skip=${skip}`);
    if (take !== undefined) q.push(`take=${take}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    const res = await fetchWrapper.get<any>(`/profiles/${id}/followers${qs}`, true);
    // Backend returns PascalCase so normalize to camelCase for UI consumption
    return camelize<FollowResponse[] | { items: FollowResponse[] }>(res);
  },

  followings: async (id: string, skip?: number, take?: number) => {
    const q: string[] = [];
    if (skip !== undefined) q.push(`skip=${skip}`);
    if (take !== undefined) q.push(`take=${take}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    const res = await fetchWrapper.get<any>(`/profiles/${id}/followings${qs}`, true);
    return camelize<FollowResponse[] | { items: FollowResponse[] }>(res);
  },

  getLinksPublic: (id: string) => fetchWrapper.get<any>(`/profiles/${id}/links`, false),

  getMyLinks: () => fetchWrapper.get<any>("/profiles/me/links", true),

  addLink: (dto: { socialKind: SocialKind | "Website" | string; url: string; label?: string }) =>
    fetchWrapper.post<any>("/profiles/links", dto, true),

  removeLink: (linkId: string) =>
    fetchWrapper.del<any>(`/profiles/links/${linkId}`, undefined, true),

  deleteMyAccount: () => fetchWrapper.del<any>("/profiles", undefined, true),

  // Normalize response to always expose { valid, message }
  checkUsername: async (username: string) => {
    const data = await fetchWrapper.get<any>(
      `/profiles/check-username?username=${encodeURIComponent(username)}`,
      false
    );
    const valid = Boolean(
      (data && (data.valid ?? data.available ?? data.isAvailable ?? data.is_valid ?? data.ok ?? data.success))
    );
    return { valid, message: data?.message } as { valid: boolean; message?: string };
  },

  getOnlineFriends: (withinLastMinutes?: number) => {
    const q: string[] = [];
    if (typeof withinLastMinutes === "number") q.push(`withinLastMinutes=${withinLastMinutes}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    return fetchWrapper.get<ProfileResponse[]>(`/profiles/online-friends${qs}`, true);
  },

  heartbeat: () => fetchWrapper.post<{ message: string; lastActiveAt: string }>("/profiles/heartbeat", undefined, true),
};

export default profileAPI;
