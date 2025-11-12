"use client";

import type { UserProfile } from "@/types";

const PREFIX = "profile_cache:";

type CachedProfile = {
  data: UserProfile;
  at: number; // ms epoch when cached
};

function keyFor(id: string) {
  return `${PREFIX}${id}`;
}

export function readCachedProfile(id: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfile;
    if (!parsed?.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedProfile(id: string, data: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedProfile = { data, at: Date.now() };
    localStorage.setItem(keyFor(id), JSON.stringify(payload));
    // bump version to notify other tabs/components
    localStorage.setItem(`${keyFor(id)}:v`, String(payload.at));
  } catch {}
}

export function clearCachedProfile(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(keyFor(id));
    localStorage.setItem(`${keyFor(id)}:v`, String(Date.now()));
  } catch {}
}

// Best-effort normalizer to map various API shapes -> UserProfile
export function normalizeProfile(input: any): UserProfile | null {
  if (!input) return null;
  const get = (obj: any, ...candidates: string[]) => {
    for (const k of candidates) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };
  const id = get(input, "id", "profileId", "profile_id");
  if (!id) return null;
  const username = get(input, "username");
  const displayName = get(input, "displayName", "display_name", "name") ?? username ?? "";
  const avatarUrl = get(input, "avatarUrl", "avatar_url", "avatarURL", "avatar");
  const coverUrl = get(input, "coverUrl", "cover_url");
  const bio = get(input, "bio");
  const stats = get(input, "stats") ?? { posts: 0, followers: 0, following: 0 };

  return {
    id,
    username: String(username ?? ""),
    displayName: String(displayName ?? ""),
    bio: bio ?? null,
    avatarUrl: avatarUrl ?? null,
    coverUrl: coverUrl ?? null,
    website: get(input, "website") ?? null,
    location: get(input, "location") ?? null,
    stats: {
      posts: Number(stats?.posts ?? 0),
      followers: Number(stats?.followers ?? 0),
      following: Number(stats?.following ?? 0),
      likes: stats?.likes !== undefined ? Number(stats.likes) : undefined,
    },
    isMe: get(input, "isMe", "is_me"),
    isFollowing: get(input, "isFollowing", "is_following"),
    joinedAtISO: get(input, "joinedAtISO", "joined_at", "joinedAt"),
    interests: get(input, "interests") ?? undefined,
  } as UserProfile;
}

