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
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [hasNextRecommendations, setHasNextRecommendations] = useState(false);
  const [loadingMoreRecommendations, setLoadingMoreRecommendations] = useState(false);
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [hasNextFriends, setHasNextFriends] = useState(false);
  const [loadingMoreFriends, setLoadingMoreFriends] = useState(false);
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
        const recRes = await profileAPI.getRecommendations(1, 10);

        let followRes: any = null;
        if (user?.id) {
          followRes = await profileAPI.followings(
            user.id,
            1,
            10
          );
        }

        if (cancelled) return;

        const recItems: ProfileResponse[] = recRes.data || recRes.items || (Array.isArray(recRes) ? recRes : []);

        let friendProfiles: ProfileResponse[] = [];

        if (followRes) {
          const followItems: FollowResponse[] = followRes.data || followRes.items || [];
          const followList = (followItems || []).filter(Boolean);

          const followeeIds = Array.from(
            new Set(followList.map((f) => f.followeeId).filter(Boolean))
          );

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
        }

        setRecommendations(recItems);
        setRecommendationsPage(recRes.page || 1);
        setHasNextRecommendations(recRes.hasNext ?? false);
        setFriends(friendProfiles);
        setFriendsPage(1);
        setHasNextFriends(followRes?.hasNext ?? false);
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

  const handleLoadMoreRecommendations = async () => {
    if (loadingMoreRecommendations || !hasNextRecommendations) return;
    setLoadingMoreRecommendations(true);
    try {
      const nextPage = recommendationsPage + 1;
      const recRes = await profileAPI.getRecommendations(nextPage, 10);
      const recItems: ProfileResponse[] = recRes.data || recRes.items || (Array.isArray(recRes) ? recRes : []);
      setRecommendations((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = recItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
      setRecommendationsPage(recRes.page || nextPage);
      setHasNextRecommendations(recRes.hasNext ?? false);
    } catch (e) {
      console.error("Failed to load more recommendations:", e);
    } finally {
      setLoadingMoreRecommendations(false);
    }
  };

  const handleLoadMoreFriends = async () => {
    if (!user?.id || loadingMoreFriends || !hasNextFriends) return;
    setLoadingMoreFriends(true);
    try {
      const nextPage = friendsPage + 1;
      const followRes = await profileAPI.followings(user.id, nextPage, 10);
      const followItems: FollowResponse[] = followRes.data || followRes.items || [];
      const followeeIds = Array.from(
        new Set(followItems.map((f) => f.followeeId).filter(Boolean))
      );
      const profilesResult = await Promise.allSettled(
        followeeIds.map((id) => profileAPI.getById(id))
      );
      const newProfiles = profilesResult
        .filter((r): r is PromiseFulfilledResult<ProfileResponse> => r.status === "fulfilled")
        .map((r) => r.value);

      setFriends((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newProfiles.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
      setFriendsPage(followRes.page || nextPage);
      setHasNextFriends(followRes.hasNext ?? false);
    } catch (e) {
      console.error("Failed to load more friends:", e);
    } finally {
      setLoadingMoreFriends(false);
    }
  };

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

            {hasNextFriends && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreFriends}
                  disabled={loadingMoreFriends}
                  className="px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--primary, #3b82f6)",
                    color: "white",
                  }}
                >
                  {loadingMoreFriends ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
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

            {hasNextRecommendations && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreRecommendations}
                  disabled={loadingMoreRecommendations}
                  className="px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--primary, #3b82f6)",
                    color: "white",
                  }}
                >
                  {loadingMoreRecommendations ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}