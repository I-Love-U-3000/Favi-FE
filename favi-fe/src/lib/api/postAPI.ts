import { fetchWrapper } from "../fetchWrapper";
import type {
  CreatePostRequest,
  UpdatePostRequest,
  PostResponse,
  PostMediaResponse,
  PagedResult,
  ReactionType,
  PostReactionResponse,
} from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

// ---------- helpers ----------
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

// ---------- media upload with manual refresh ----------
async function uploadFiles(postId: string, files: File[]): Promise<PostMediaResponse[]> {
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");
  const url = `${baseUrl}/Posts/${postId}/media`;
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const doUpload = async (bearer?: string | null) => {
    const res = await fetch(url, {
      method: "POST",
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined, // KHÔNG set Content-Type cho FormData
      body: form,
    });
    return res;
  };

  // first try
  let res = await doUpload(token);

  if (res.status === 401) {
    // 🔁 self-refresh: backend /auth/refresh nhận body là STRING
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

    // retry upload with new access
    res = await doUpload(newAccess);
  }

  if (!res.ok) {
    let message = "Upload failed";
    try {
      const data = await res.json();
      message = data?.message || data?.error || message;
    } catch {}
    throw new Error(message);
  }

  return camelize<PostMediaResponse[]>(await res.json());
}

export const postAPI = {
  // Reads
  getById: async (id: string) =>
    camelize<PostResponse>(await fetchWrapper.get<any>(`/Posts/${id}`)),

  getByProfile: async (profileId: string, page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/Posts/profile/${profileId}?page=${page}&pageSize=${pageSize}`)
    ),

  getFeed: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/Posts/feed?page=${page}&pageSize=${pageSize}`, true)
    ),

  getGuestFeed: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(
        `/Posts/guest-feed?page=${page}&pageSize=${pageSize}`, 
        false 
      )
    ),

  getExplore: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/Posts/explore?page=${page}&pageSize=${pageSize}`, true)
    ),

  getLatest: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/Posts/latest?page=${page}&pageSize=${pageSize}`, false)
    ),

  getByTag: async (tagId: string, page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/Posts/tag/${tagId}?page=${page}&pageSize=${pageSize}`)
    ),

  // Mutations
  create: (formData: FormData) =>
  fetchWrapper.post<PostResponse>("/posts", formData, true),
  update: (id: string, payload: UpdatePostRequest) =>
    fetchWrapper.put<any>(`/posts/${id}`, payload, true),
  delete: (id: string) =>
    fetchWrapper.del<any>(`/posts/${id}`, undefined, true),

  uploadMedia: (postId: string, files: File[]) => uploadFiles(postId, files),

  toggleReaction: (postId: string, type: ReactionType) =>
    fetchWrapper.post<any>(`/posts/${postId}/reactions?type=${encodeURIComponent(type)}`, undefined, true),

  getReactors: async (postId: string) =>
    camelize<PostReactionResponse[]>(
      await fetchWrapper.get<any>(`/posts/${postId}/reactors`, true)
    ),

  // ---------- Recycle Bin ----------
  restore: (id: string) =>
    fetchWrapper.post<any>(`/posts/${id}/restore`, undefined, true),

  getRecycleBin: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/posts/recycle-bin?page=${page}&pageSize=${pageSize}`, true)
    ),

  // ---------- Archive ----------
  archive: (id: string) =>
    fetchWrapper.post<any>(`/posts/${id}/archive`, undefined, true),

  unarchive: (id: string) =>
    fetchWrapper.post<any>(`/posts/${id}/unarchive`, undefined, true),

  getArchived: async (page = 1, pageSize = 20) =>
    camelize<PagedResult<PostResponse>>(
      await fetchWrapper.get<any>(`/posts/archived?page=${page}&pageSize=${pageSize}`, true)
    ),
};

export default postAPI;
