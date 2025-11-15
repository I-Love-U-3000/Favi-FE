"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import profileAPI from "@/lib/api/profileAPI";
import { normalizeProfile, readCachedProfile, writeCachedProfile } from "@/lib/profileCache";
import type { UserProfile } from "@/types";

type Options = {
  revalidateOnMount?: boolean; // default: only if no cache
};

export function useProfile(profileId: string | undefined | null, opts?: Options) {
  const id = profileId ?? null;
  const revalidateOnMount = opts?.revalidateOnMount ?? false;
  const [profile, setProfile] = useState<UserProfile | null>(() => (id ? readCachedProfile(id) : null));
  const [loading, setLoading] = useState<boolean>(!profile && !!id);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchAndCache = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await profileAPI.getById(id);
      const norm = normalizeProfile(raw);
      if (norm) {
        writeCachedProfile(id, norm);
        if (mounted.current) setProfile(norm);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.error || e?.message || "Failed to load profile");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    const cached = readCachedProfile(id);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      if (revalidateOnMount) fetchAndCache();
    } else {
      fetchAndCache();
    }

    const onStorage = (e: StorageEvent) => {
      if (!e) return;
      if (e.key === `profile_cache:${id}` || e.key === `profile_cache:${id}:v`) {
        const latest = readCachedProfile(id);
        if (latest) setProfile(latest);
      }
      if (e.key === "access_token" || e.key === "refresh_token" || e.key === "user_info") {
        // auth context changed; best-effort to reflect any change
        const latest = readCachedProfile(id);
        if (latest) setProfile(latest);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id, fetchAndCache, revalidateOnMount]);

  const refresh = useCallback(() => fetchAndCache(), [fetchAndCache]);

  return useMemo(() => ({ profile, loading, error, refresh }), [profile, loading, error, refresh]);
}

export default useProfile;

