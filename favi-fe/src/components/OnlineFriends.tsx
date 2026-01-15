"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProfileHoverCard from "./ProfileHoverCard";
import profileAPI from "@/lib/api/profileAPI";
import type { ProfileResponse } from "@/types";

const DEFAULT_AVATAR = "/avatar-default.svg";

export default function OnlineFriends() {
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchOnlineFriends = async () => {
    let cancelled = false;

    try {
      setLoading(true);
      const response = await profileAPI.getOnlineFriends(3);
      if (!cancelled) {
        setFriends(response || []);
        hasFetchedRef.current = true;
      }
    } catch (e: any) {
      if (!cancelled) {
        console.error("Error fetching online friends:", e);
        setError(e?.error || e?.message || "Failed to load online friends");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchOnlineFriends();
    }
  }, []);

  // Refetch when component becomes visible (when user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasFetchedRef.current) {
        fetchOnlineFriends();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Also refetch periodically (every 1 minute) to update online status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOnlineFriends();
    }, 1 * 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  if (loading && !hasFetchedRef.current) {
    return (
      <div className="relative rounded-2xl p-4 glass">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        />
        <div className="relative text-sm font-semibold pb-3 mb-3 border-b border-white/10 dark:border-white/5" style={{ color: "var(--text)" }}>
          Online Friends
        </div>
        <div className="relative space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 dark:bg-white/5 shrink-0" />
              <div className="flex-1">
                <div className="h-3 rounded w-24 bg-white/10 dark:bg-white/5 mb-1" />
                <div className="h-2 rounded w-16 bg-white/10 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className="relative rounded-2xl p-4 glass">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
        }}
      />
      <div className="relative flex items-center justify-between py-3 border-b border-white/10 dark:border-white/5">
        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Online Friends
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {friends.length}
          </span>
        </div>
      </div>

      <div className="relative space-y-2 mt-3">
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-user-minus text-3xl mb-3" style={{ color: "var(--text-secondary)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No friends online
            </p>
          </div>
        ) : (
          friends.map((friend) => (
            <FriendItem key={friend.id} friend={friend} />
          ))
        )}
      </div>
    </div>
  );
}

function FriendItem({ friend }: { friend: ProfileResponse }) {
  const avatar = friend.avatarUrl || DEFAULT_AVATAR;
  const displayName = friend.displayName || friend.username || "User";
  const username = friend.username;

  return (
    <ProfileHoverCard
      user={{
        id: friend.id,
        username: username || "",
        name: displayName,
        avatarUrl: avatar,
        bio: friend.bio || undefined,
        followersCount: friend.followersCount ?? undefined,
        followingCount: friend.followingCount ?? undefined,
      }}
    >
      <Link
        href={`/profiles/${friend.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
      >
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={displayName}
            className="w-10 h-10 rounded-full border border-white/20 dark:border-white/10"
          />
          <span className="absolute bottom-0 right-0 flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
            {displayName}
          </div>
          {username && (
            <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              @{username}
            </div>
          )}
        </div>
      </Link>
    </ProfileHoverCard>
  );
}
