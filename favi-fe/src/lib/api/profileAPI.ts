import { fetchWrapper } from "@/lib/fetchWrapper";

export const profileAPI = {
  getById: (id: string) => fetchWrapper.get<any>(`/profiles/${id}`, false),

  update: async (payload: any) => {
    // Perform update, then try to update local cache if possible
    const res = await fetchWrapper.put<any>("/profiles", payload, true);
    try {
      // Best-effort: normalize and cache if response includes profile
      const { normalizeProfile, writeCachedProfile } = await import("@/lib/profileCache");
      const norm = normalizeProfile(res);
      if (norm?.id) writeCachedProfile(norm.id, norm);
    } catch {}
    return res;
  },

  follow: (targetId: string) => fetchWrapper.post<any>(`/profiles/follow/${targetId}`, undefined, true),

  unfollow: (targetId: string) => fetchWrapper.del<any>(`/profiles/follow/${targetId}`, undefined, true),

  followers: (id: string, skip?: number, take?: number) => {
    const q: string[] = [];
    if (skip !== undefined) q.push(`skip=${skip}`);
    if (take !== undefined) q.push(`take=${take}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    return fetchWrapper.get<any>(`/profiles/${id}/followers${qs}`, false);
  },

  followings: (id: string, skip?: number, take?: number) => {
    const q: string[] = [];
    if (skip !== undefined) q.push(`skip=${skip}`);
    if (take !== undefined) q.push(`take=${take}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    return fetchWrapper.get<any>(`/profiles/${id}/followings${qs}`, false);
  },

  getLinksPublic: (id: string) => fetchWrapper.get<any>(`/profiles/${id}/links`, false),

  getMyLinks: () => fetchWrapper.get<any>("/profiles/me/links", true),

  addLink: (dto: { type: string; url: string; label?: string }) =>
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
};

export default profileAPI;
