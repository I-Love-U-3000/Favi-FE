"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import profileAPI from "@/lib/api/profileAPI";
import { useAuth } from "@/components/AuthProvider";
import type { ProfileResponse, FollowResponse } from "@/types";
import { Link } from "@/i18n/routing";

export default function FriendsPage() {
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user?: { id: string } | null;
  };

  const t = useTranslations("FriendsPage");

  // Following list state
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [hasNextFriends, setHasNextFriends] = useState(false);
  const [loadingMoreFriends, setLoadingMoreFriends] = useState(false);
  const [followingSearch, setFollowingSearch] = useState("");
  const [debouncedFollowingSearch, setDebouncedFollowingSearch] = useState("");
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Followers list state
  const [followers, setFollowers] = useState<ProfileResponse[]>([]);
  const [followersPage, setFollowersPage] = useState(1);
  const [hasNextFollowers, setHasNextFollowers] = useState(false);
  const [loadingMoreFollowers, setLoadingMoreFollowers] = useState(false);
  const [followersSearch, setFollowersSearch] = useState("");
  const [debouncedFollowersSearch, setDebouncedFollowersSearch] = useState("");
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<ProfileResponse[]>([]);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [hasNextRecommendations, setHasNextRecommendations] = useState(false);
  const [loadingMoreRecommendations, setLoadingMoreRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Tracking which IDs the current user is following
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFollowingSearch(followingSearch.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [followingSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFollowersSearch(followersSearch.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [followersSearch]);

  // Load Initial Following & Followers & Recommendations
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setFriends([]);
      setFollowers([]);
      setRecommendations([]);
      return;
    }

    let cancelled = false;

    // Load initial followings
    const loadFollowing = async () => {
      setLoadingFollowing(true);
      try {
        const res = await profileAPI.followings(
          user.id,
          1,
          10,
          undefined,
          undefined,
          debouncedFollowingSearch || undefined
        );
        if (cancelled) return;
        const items = res.data || res.items || [];
        const profiles: ProfileResponse[] = items.map((f: FollowResponse) => ({
          id: f.followeeId || "",
          username: f.username || "",
          displayName: f.displayName || f.username || "",
          avatarUrl: f.avatarUrl || "/avatar-default.svg",
          bio: f.bio || "",
          isMe: f.followeeId === user.id,
        })).filter((p: ProfileResponse) => Boolean(p.id));

        setFriends(profiles);
        setFriendsPage(1);
        setHasNextFriends(res.hasNext ?? false);

        // Update following IDs set when not filtering
        if (!debouncedFollowingSearch) {
          setFollowingIds(new Set(profiles.map(p => p.id)));
        }
      } catch (err: any) {
        console.error("Error loading following:", err);
      } finally {
        if (!cancelled) setLoadingFollowing(false);
      }
    };

    loadFollowing();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, debouncedFollowingSearch]);

  // Load followers when debounced search or user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let cancelled = false;

    const loadFollowers = async () => {
      setLoadingFollowers(true);
      try {
        const res = await profileAPI.followers(
          user.id,
          1,
          10,
          undefined,
          undefined,
          debouncedFollowersSearch || undefined
        );
        if (cancelled) return;
        const items = res.data || res.items || [];
        const profiles: ProfileResponse[] = items.map((f: FollowResponse) => ({
          id: f.followerId || "",
          username: f.username || "",
          displayName: f.displayName || f.username || "",
          avatarUrl: f.avatarUrl || "/avatar-default.svg",
          bio: f.bio || "",
          isMe: f.followerId === user.id,
        })).filter((p: ProfileResponse) => Boolean(p.id));

        setFollowers(profiles);
        setFollowersPage(1);
        setHasNextFollowers(res.hasNext ?? false);
      } catch (err: any) {
        console.error("Error loading followers:", err);
      } finally {
        if (!cancelled) setLoadingFollowers(false);
      }
    };

    loadFollowers();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, debouncedFollowersSearch]);

  // Load recommendations once
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadRecs = async () => {
      setLoadingRecommendations(true);
      try {
        const res = await profileAPI.getRecommendations(1, 8);
        if (cancelled) return;
        const recItems: ProfileResponse[] = res.data || res.items || (Array.isArray(res) ? res : []);
        setRecommendations(recItems);
        setRecommendationsPage(res.page || 1);
        setHasNextRecommendations(res.hasNext ?? false);
      } catch (err: any) {
        console.error("Error loading recommendations:", err);
      } finally {
        if (!cancelled) setLoadingRecommendations(false);
      }
    };

    loadRecs();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Load More Handlers
  const handleLoadMoreFollowing = async () => {
    if (!user?.id || loadingMoreFriends || !hasNextFriends) return;
    setLoadingMoreFriends(true);
    try {
      const nextPage = friendsPage + 1;
      const res = await profileAPI.followings(
        user.id,
        nextPage,
        10,
        undefined,
        undefined,
        debouncedFollowingSearch || undefined
      );
      const items = res.data || res.items || [];
      const newProfiles: ProfileResponse[] = items.map((f: FollowResponse) => ({
        id: f.followeeId || "",
        username: f.username || "",
        displayName: f.displayName || f.username || "",
        avatarUrl: f.avatarUrl || "/avatar-default.svg",
        bio: f.bio || "",
        isMe: f.followeeId === user.id,
      })).filter((p: ProfileResponse) => Boolean(p.id));

      setFriends((prev) => {
        const existing = new Set(prev.map(p => p.id));
        const filtered = newProfiles.filter(p => !existing.has(p.id));
        return [...prev, ...filtered];
      });
      setFriendsPage(res.page || nextPage);
      setHasNextFriends(res.hasNext ?? false);

      setFollowingIds(prev => {
        const next = new Set(prev);
        newProfiles.forEach(p => next.add(p.id));
        return next;
      });
    } catch (err) {
      console.error("Failed to load more following:", err);
    } finally {
      setLoadingMoreFriends(false);
    }
  };

  const handleLoadMoreFollowers = async () => {
    if (!user?.id || loadingMoreFollowers || !hasNextFollowers) return;
    setLoadingMoreFollowers(true);
    try {
      const nextPage = followersPage + 1;
      const res = await profileAPI.followers(
        user.id,
        nextPage,
        10,
        undefined,
        undefined,
        debouncedFollowersSearch || undefined
      );
      const items = res.data || res.items || [];
      const newProfiles: ProfileResponse[] = items.map((f: FollowResponse) => ({
        id: f.followerId || "",
        username: f.username || "",
        displayName: f.displayName || f.username || "",
        avatarUrl: f.avatarUrl || "/avatar-default.svg",
        bio: f.bio || "",
        isMe: f.followerId === user.id,
      })).filter((p: ProfileResponse) => Boolean(p.id));

      setFollowers((prev) => {
        const existing = new Set(prev.map(p => p.id));
        const filtered = newProfiles.filter(p => !existing.has(p.id));
        return [...prev, ...filtered];
      });
      setFollowersPage(res.page || nextPage);
      setHasNextFollowers(res.hasNext ?? false);
    } catch (err) {
      console.error("Failed to load more followers:", err);
    } finally {
      setLoadingMoreFollowers(false);
    }
  };

  const handleLoadMoreRecommendations = async () => {
    if (loadingMoreRecommendations || !hasNextRecommendations) return;
    setLoadingMoreRecommendations(true);
    try {
      const nextPage = recommendationsPage + 1;
      const res = await profileAPI.getRecommendations(nextPage, 8);
      const recItems: ProfileResponse[] = res.data || res.items || (Array.isArray(res) ? res : []);
      setRecommendations((prev) => {
        const existing = new Set(prev.map(p => p.id));
        const filtered = recItems.filter(p => !existing.has(p.id));
        return [...prev, ...filtered];
      });
      setRecommendationsPage(res.page || nextPage);
      setHasNextRecommendations(res.hasNext ?? false);
    } catch (err) {
      console.error("Failed to load more recommendations:", err);
    } finally {
      setLoadingMoreRecommendations(false);
    }
  };

  // Follow / Unfollow Toggle
  const handleToggleFollow = async (targetId: string, currentFollowing: boolean) => {
    try {
      setActioning(targetId);
      if (currentFollowing) {
        await profileAPI.unfollow(targetId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await profileAPI.follow(targetId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
        // Remove from recommendations if present
        setRecommendations((prev) => prev.filter((r) => r.id !== targetId));
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
    } finally {
      setActioning(null);
    }
  };

  // Modern Redesigned User Card
  const renderUserCard = (p: ProfileResponse) => {
    const display = p.displayName || p.username;
    const avatarSrc = p.avatarUrl && p.avatarUrl.trim().length > 0 ? p.avatarUrl : "/avatar-default.svg";
    const isMe = user?.id === p.id;
    const isFollowing = followingIds.has(p.id);

    return (
      <div
        key={p.id}
        className="group relative flex items-center justify-between rounded-2xl p-4 transition-all duration-200 border"
        style={{
          backgroundColor: "var(--bg-secondary, rgba(255, 255, 255, 0.85))",
          borderColor: "var(--border, rgba(0, 0, 0, 0.08))",
          boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Link href={`/profile/${p.id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
          <ProfileHoverCard
            user={{
              id: p.id,
              username: p.username,
              name: display || "",
              avatarUrl: avatarSrc !== "/avatar-default.svg" ? avatarSrc : undefined,
              bio: p.bio || undefined,
              followersCount: p.followersCount ?? undefined,
              followingCount: p.followingCount ?? undefined,
            }}
          >
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt={display || p.username}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all shadow-sm"
              />
            </div>
          </ProfileHoverCard>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {display}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{p.username}
            </div>
            {p.bio && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 opacity-80">
                {p.bio}
              </p>
            )}
            {p.recommendationReason && (
              <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <i className="pi pi-sparkles text-[10px]" />
                <span className="truncate">{p.recommendationReason}</span>
              </div>
            )}
          </div>
        </Link>

        {!isMe && (
          <div className="flex-shrink-0 ml-3">
            {isFollowing ? (
              <button
                type="button"
                onClick={() => handleToggleFollow(p.id, true)}
                disabled={actioning === p.id}
                className="group/btn px-3.5 py-1.5 text-xs font-medium rounded-full border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-400 transition-all flex items-center gap-1.5 shadow-xs"
              >
                {actioning === p.id ? (
                  <i className="pi pi-spin pi-spinner text-xs" />
                ) : (
                  <>
                    <i className="pi pi-check text-xs group-hover/btn:hidden" />
                    <i className="pi pi-user-minus text-xs hidden group-hover/btn:inline-block" />
                    <span className="group-hover/btn:hidden">{t("Following")}</span>
                    <span className="hidden group-hover/btn:inline-block">{t("Unfollow")}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleFollow(p.id, false)}
                disabled={actioning === p.id}
                className="px-4 py-1.5 text-xs font-medium rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                {actioning === p.id ? (
                  <i className="pi pi-spin pi-spinner text-xs" />
                ) : (
                  <>
                    <i className="pi pi-user-plus text-xs" />
                    <span>{t("Follow")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Title")}</h1>
          <p className="text-sm opacity-70 mt-1">
            Quản lý và kết nối với mạng lưới bạn bè của bạn
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
          <i className="pi pi-lock text-3xl opacity-50 mb-3 block" />
          <div className="text-base font-semibold">{t("LoginRequired")}</div>
        </div>
      )}

      {isAuthenticated && (
        <>
          {/* Main 2-Column Section: Followers & Following */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Followers Column */}
            <section className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{t("FollowersTitle")}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--border)", opacity: 0.8 }}>
                    {followers.length}
                  </span>
                </div>
              </div>

              {/* Followers Search Bar */}
              <div className="relative mb-4">
                <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={followersSearch}
                  onChange={(e) => setFollowersSearch(e.target.value)}
                  placeholder={t("SearchFollowers")}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: "var(--bg-secondary, #fff)",
                    borderColor: "var(--border, #e5e7eb)",
                  }}
                />
                {followersSearch && (
                  <button
                    onClick={() => setFollowersSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                )}
              </div>

              {loadingFollowers && (
                <div className="py-8 text-center text-sm opacity-60">
                  <i className="pi pi-spin pi-spinner text-lg mb-2 block" />
                  Đang tìm kiếm...
                </div>
              )}

              {!loadingFollowers && followers.length === 0 && (
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <i className="pi pi-users text-2xl opacity-40 mb-2 block" />
                  <div className="text-sm opacity-70">{t("EmptyFollowers")}</div>
                </div>
              )}

              {!loadingFollowers && followers.length > 0 && (
                <div className="space-y-3 flex-1">
                  {followers.map((f) => renderUserCard(f))}
                </div>
              )}

              {hasNextFollowers && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreFollowers}
                    disabled={loadingMoreFollowers}
                    className="px-5 py-2 rounded-full font-medium text-xs border hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {loadingMoreFollowers ? (
                      <i className="pi pi-spin pi-spinner text-xs" />
                    ) : (
                      <i className="pi pi-chevron-down text-xs" />
                    )}
                    <span>{t("LoadMore")}</span>
                  </button>
                </div>
              )}
            </section>

            {/* Following Column */}
            <section className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{t("FriendsTitle")}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--border)", opacity: 0.8 }}>
                    {friends.length}
                  </span>
                </div>
              </div>

              {/* Following Search Bar */}
              <div className="relative mb-4">
                <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={followingSearch}
                  onChange={(e) => setFollowingSearch(e.target.value)}
                  placeholder={t("SearchFollowing")}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    backgroundColor: "var(--bg-secondary, #fff)",
                    borderColor: "var(--border, #e5e7eb)",
                  }}
                />
                {followingSearch && (
                  <button
                    onClick={() => setFollowingSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                )}
              </div>

              {loadingFollowing && (
                <div className="py-8 text-center text-sm opacity-60">
                  <i className="pi pi-spin pi-spinner text-lg mb-2 block" />
                  Đang tìm kiếm...
                </div>
              )}

              {!loadingFollowing && friends.length === 0 && (
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <i className="pi pi-user-plus text-2xl opacity-40 mb-2 block" />
                  <div className="text-sm opacity-70">{t("EmptyFriends")}</div>
                </div>
              )}

              {!loadingFollowing && friends.length > 0 && (
                <div className="space-y-3 flex-1">
                  {friends.map((f) => renderUserCard(f))}
                </div>
              )}

              {hasNextFriends && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreFollowing}
                    disabled={loadingMoreFriends}
                    className="px-5 py-2 rounded-full font-medium text-xs border hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {loadingMoreFriends ? (
                      <i className="pi pi-spin pi-spinner text-xs" />
                    ) : (
                      <i className="pi pi-chevron-down text-xs" />
                    )}
                    <span>{t("LoadMore")}</span>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Suggestions Section */}
          <section className="pt-8 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{t("SuggestionsTitle")}</h2>
                <p className="text-xs opacity-70 mt-0.5">Những người bạn có thể quan tâm hoặc có bạn chung</p>
              </div>
            </div>

            {loadingRecommendations && recommendations.length === 0 && (
              <div className="py-8 text-center text-sm opacity-60">
                <i className="pi pi-spin pi-spinner text-lg mb-2 block" />
                Đang tải đề xuất...
              </div>
            )}

            {!loadingRecommendations && recommendations.length === 0 && (
              <div className="text-sm opacity-70 py-4">{t("EmptySuggestions")}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((s) => renderUserCard(s))}
            </div>

            {hasNextRecommendations && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreRecommendations}
                  disabled={loadingMoreRecommendations}
                  className="px-6 py-2.5 rounded-full font-medium text-xs border hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                >
                  {loadingMoreRecommendations ? (
                    <i className="pi pi-spin pi-spinner text-xs" />
                  ) : (
                    <i className="pi pi-chevron-down text-xs" />
                  )}
                  <span>{t("LoadMore")}</span>
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}