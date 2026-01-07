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
  const id = get(input, "id", "Id", "profileId", "profile_id");
  if (!id) return null;
  const username = get(input, "username", "Username");
  const displayName = get(input, "displayName", "DisplayName", "display_name", "name") ?? username ?? "";
  const avatarUrl = get(input, "avatarUrl", "AvatarUrl", "avatar_url", "avatarURL", "avatar");
  const coverUrl = get(input, "coverUrl", "CoverUrl", "cover_url");
  const bio = get(input, "bio", "Bio");

  const statsRaw = get(input, "stats", "Stats") ?? {};
  const postsCount = get(input, "postsCount", "PostsCount", "posts", "Posts") ?? statsRaw?.posts;
  const followersCount = get(input, "followersCount", "FollowersCount") ?? statsRaw?.followers;
  const followingCount = get(input, "followingCount", "FollowingCount") ?? statsRaw?.following;

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
      posts: Number(postsCount ?? 0),
      followers: Number(followersCount ?? 0),
      following: Number(followingCount ?? 0),
      likes: statsRaw?.likes !== undefined ? Number(statsRaw.likes) : undefined,
    },
    isMe: get(input, "isMe", "is_me"),
    isFollowing: get(input, "isFollowing", "is_following"),
    joinedAtISO: get(input, "joinedAtISO", "joined_at", "joinedAt", "createdAt", "CreatedAt"),
  } as UserProfile;
}
