"use client";

import type { ReactionType } from "@/types";

const PREFIX = "post_cache:";

export type ReactionCache = {
  byType: Record<ReactionType, number>;
  currentUserReaction?: ReactionType | null;
  updatedAt: number; // epoch ms
};

function keyFor(id: string) {
  return `${PREFIX}${id}`;
}

export function readPostReaction(id: string): ReactionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReactionCache;
    if (!parsed || !parsed.byType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePostReaction(id: string, data: Omit<ReactionCache, "updatedAt"> & { updatedAt?: number }) {
  if (typeof window === "undefined") return;
  try {
    const payload: ReactionCache = {
      byType: data.byType,
      currentUserReaction: data.currentUserReaction,
      updatedAt: data.updatedAt ?? Date.now(),
    };
    localStorage.setItem(keyFor(id), JSON.stringify(payload));
    localStorage.setItem(`${keyFor(id)}:v`, String(payload.updatedAt));
  } catch {}
}

