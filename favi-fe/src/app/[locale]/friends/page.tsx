"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { useTranslations } from "next-intl";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import profileAPI from "@/lib/api/profileAPI";
import { useAuth } from "@/components/AuthProvider";
import type { ProfileResponse, FollowResponse } from "@/types";
import { Link } from "@/i18n/routing"; // 🔹 THÊM DÒNG NÀY

type MaybePaged<T> = T[] | { items: T[] };

export default function FriendsPage() {
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user?: { id: string } | null;
  };

  const t = useTranslations("FriendsPage");

  const [recommendations, setRecommendations] = useState<ProfileResponse[]>([]);
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      console.log("FriendsPage auth state:", { isAuthenticated, user });

      if (!isAuthenticated) {
        console.log("Skip load: not authenticated");
        setRecommendations([]);
        setFriends([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const recRes = (await profileAPI.getRecommendations(
          0,
          20
        )) as MaybePaged<ProfileResponse>;

        let followRes: MaybePaged<FollowResponse> | null = null;
        if (user?.id) {
          followRes = (await profileAPI.followings(
            user.id,
            0,
            1000
          )) as MaybePaged<FollowResponse>;
        }

        if (cancelled) return;

        const recItems: ProfileResponse[] = Array.isArray(recRes)
          ? recRes
          : recRes.items ?? [];

        let friendProfiles: ProfileResponse[] = [];

        if (followRes) {
          const followItems: FollowResponse[] = Array.isArray(followRes)
            ? followRes
            : followRes.items ?? [];

          const followList = (followItems || []).filter(Boolean);
          console.log("Parsed followList:", followList);

          const followeeIds = Array.from(
            new Set(followList.map((f) => f.followeeId).filter(Boolean))
          );
          console.log("Followee IDs:", followeeIds);

          const profilesResult = await Promise.allSettled(
            followeeIds.map((id) => profileAPI.getById(id))
          );

          if (cancelled) return;

          friendProfiles = profilesResult
            .filter(
              (r): r is PromiseFulfilledResult<ProfileResponse> =>
                r.status === "fulfilled"
            )
            .map((r) => r.value);
          console.log("Resolved friend profiles:", friendProfiles);
        }

        setRecommendations(recItems);
        setFriends(friendProfiles);
      } catch (e) {
        console.error("FriendsPage load error:", e);
        const err = e as { message?: string; error?: string };
        if (!cancelled) {
          setError(err?.message || err?.error || "Failed to load friends");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const handleFollow = async (id: string) => {
    try {
      setActioning(id);
      await profileAPI.follow(id);

      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      setFriends((prev) => {
        const rec = recommendations.find((r) => r.id === id);
        return rec ? [...prev, rec] : prev;
      });
    } catch (e: any) {
      console.error("Follow failed:", e);
    } finally {
      setActioning((current) => (current === id ? null : current));
    }
  };

  const text = useMemo(
    () => ({
      title: t("Title", { defaultMessage: "Friends" }),
      sectionSuggestions: t("SuggestionsTitle", { defaultMessage: "Who you may know" }),
      sectionFriends: t("FriendsTitle", { defaultMessage: "People you follow" }),
      loginRequired: t("LoginRequired", { defaultMessage: "Please login to see your friends." }),
      emptySuggestions: t("EmptySuggestions", { defaultMessage: "No suggestions at the moment." }),
      emptyFriends: t("EmptyFriends", { defaultMessage: "You are not following anyone yet." }),
      follow: t("Follow", { defaultMessage: "Follow" }),
    }),
    [t]
  );

  // 🔹 SỬA HÀM renderUserCard: thêm Link + fallback avatar chắc cú hơn
  const renderUserCard = (p: ProfileResponse, showFollow: boolean) => {
    const display = p.displayName || p.username;
    const avatarSrc =
      p.avatarUrl && p.avatarUrl.trim().length > 0
        ? p.avatarUrl
        : "/avatar-default.svg";

    return (
      <div
        key={p.id}
        className="flex items-center justify-between rounded-xl p-3"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        {/* Bọc avatar + text bằng Link để navigate tới profile detail */}
        <Link href={`/profile/${p.id}`} className="flex items-center gap-3">
          <ProfileHoverCard
            user={{
              id: p.id,
              username: p.username,
              name: display || "",
              // Nếu dùng avatar default thì không nhất thiết phải truyền vào hoverCard
              avatarUrl: avatarSrc !== "/avatar-default.svg" ? avatarSrc : undefined,
              bio: p.bio || undefined,
              followersCount: p.followersCount ?? undefined,
              followingCount: p.followingCount ?? undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={display || p.username}
              className="w-10 h-10 rounded-full cursor-pointer border"
            />
          </ProfileHoverCard>
          <div>
            <div className="text-sm font-medium">{display}</div>
            <div className="text-xs opacity-70">@{p.username}</div>
          </div>
        </Link>

        {showFollow && (
          <Button
            label={text.follow}
            onClick={() => handleFollow(p.id)}
            loading={actioning === p.id}
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6" style={{ color: "var(--text)" }}>
      <h1 className="text-2xl font-semibold mb-6">{text.title}</h1>

      {!isAuthenticated && (
        <div className="text-sm opacity-70 mb-4">{text.loginRequired}</div>
      )}

      {isAuthenticated && (
        <>
          {/* Friends section */}
          <section className="mb-8">
            <h2 className="text-lg font-medium mb-3">{text.sectionFriends}</h2>

            {loading && <div className="text-sm opacity-70">Loading...</div>}
            {error && !loading && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            {!loading && !error && friends.length === 0 && (
              <div className="text-sm opacity-70">{text.emptyFriends}</div>
            )}

            <div className="mt-3 space-y-3">
              {friends.map((f) => renderUserCard(f, false))}
            </div>
          </section>

          {/* Suggestions section */}
          <section>
            <h2 className="text-lg font-medium mb-3">{text.sectionSuggestions}</h2>

            {loading && <div className="text-sm opacity-70">Loading...</div>}
            {error && !loading && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            {!loading && !error && recommendations.length === 0 && (
              <div className="text-sm opacity-70">{text.emptySuggestions}</div>
            )}

            <div className="mt-3 space-y-3">
              {recommendations.map((s) => renderUserCard(s, true))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}