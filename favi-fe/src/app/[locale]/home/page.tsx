"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthProvider";
import useProfile from "@/lib/hooks/useProfile";
import { useRouter, Link } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse, ReactionType, ReportTarget } from "@/types";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { readCachedProfile } from "@/lib/profileCache";
import { readPostReaction, writePostReaction } from "@/lib/postCache";
import {
  getHomeFeedCache,
  updateHomeFeedCache,
  saveHomeScroll,
  removeHomePost,
  updateHomePostReaction,
} from "@/lib/cache/homeCache";
import { useTranslations } from "next-intl";
import { PagedResult, PaginationResult } from "@/types";
import { useOverlay } from "@/components/RootProvider";
import TrendingCollections from "@/components/TrendingCollections";
import ShareToChatDialog from "@/components/ShareToChatDialog";
import PostMenuDialog from "@/components/PostMenuDialog";
import ReportDialog from "@/components/ReportDialog";
import StoryFeedStrip from "@/components/StoryFeedStrip";
import PostReactorsDialog from "@/components/PostReactorsDialog";
import OnlineFriends from "@/components/OnlineFriends";
import PostSkeleton from "@/components/PostSkeleton";

type PrivacyKind = "Public" | "Followers" | "Private";

const PRIVACY_ICON_MAP: Record<PrivacyKind, string> = {
  Public: "pi pi-globe",
  Followers: "pi pi-users",
  Private: "pi pi-lock",
};

function normalizePrivacy(raw: unknown): PrivacyKind {
  // backend: 0,1,2 hoặc string
  if (raw === 0 || raw === "0" || raw === "Public") return "Public";
  if (raw === 1 || raw === "1" || raw === "Followers") return "Followers";
  if (raw === 2 || raw === "2" || raw === "Private") return "Private";
  // fallback an toàn
  return "Public";
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const me = useProfile(user?.id);
  const t = useTranslations("HomePage");
  const router = useRouter();
  const { openAddToCollectionDialog } = useOverlay();

  // Read existing cached feed
  const cachedFeed = getHomeFeedCache(user?.id);

  const [view, setView] = useState<"list" | "grid">(
    cachedFeed.isInitialized ? cachedFeed.view : "list"
  );
  const [loading, setLoading] = useState(!cachedFeed.isInitialized);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(cachedFeed.isInitialized ? cachedFeed.page : 1);
  const [hasNext, setHasNext] = useState(
    cachedFeed.isInitialized ? cachedFeed.hasNext : false
  );
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>(() => {
    const initialPosts = cachedFeed.isInitialized ? cachedFeed.posts : [];
    return initialPosts.map((p) => {
      const c = readPostReaction(p.id);
      if (c && typeof c.total === "number") {
        return {
          ...p,
          reactions: {
            ...p.reactions,
            total: c.total,
            byType: c.byType ?? p.reactions?.byType,
            currentUserReaction: c.currentUserReaction ?? p.reactions?.currentUserReaction,
          },
        };
      }
      return p;
    });
  });
  const [nsfwConfirmedGridPosts, setNsfwConfirmedGridPosts] = useState<Set<string>>(
    cachedFeed.isInitialized ? cachedFeed.nsfwConfirmedGridPosts : new Set()
  );

  // Track whether we are in the middle of restoring scroll or unmounting
  const isRestoringScrollRef = useRef(cachedFeed.isInitialized && cachedFeed.scrollY > 0);
  const isNavigatingAwayRef = useRef(false);

  // Temporary minHeight to prevent the browser from clamping window.scrollTo
  const [restorationMinHeight, setRestorationMinHeight] = useState<number | undefined>(
    cachedFeed.isInitialized && cachedFeed.scrollY > 0
      ? cachedFeed.scrollY + 1200
      : undefined
  );

  // Set manual scroll restoration so browser doesn't randomly jump to 0 on back/forward
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Restore scroll position after mount if returning to cached page
  useEffect(() => {
    if (!cachedFeed.isInitialized || cachedFeed.scrollY <= 0) {
      isRestoringScrollRef.current = false;
      return;
    }

    const targetY = cachedFeed.scrollY;
    isRestoringScrollRef.current = true;

    // Immediate attempt
    window.scrollTo({ top: targetY, behavior: "instant" });

    // Cancel restoration if user starts scrolling or interacting
    const cancelRestoration = () => {
      isRestoringScrollRef.current = false;
      setRestorationMinHeight(undefined);
    };

    window.addEventListener("wheel", cancelRestoration, { passive: true, once: true });
    window.addEventListener("touchstart", cancelRestoration, { passive: true, once: true });
    window.addEventListener("keydown", cancelRestoration, { passive: true, once: true });

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (!isRestoringScrollRef.current) {
        clearInterval(interval);
        return;
      }

      window.scrollTo({ top: targetY, behavior: "instant" });

      if (Math.abs(window.scrollY - targetY) < 15 || attempts >= 20) {
        clearInterval(interval);
        setTimeout(() => {
          isRestoringScrollRef.current = false;
          setRestorationMinHeight(undefined);
        }, 150);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      window.removeEventListener("wheel", cancelRestoration);
      window.removeEventListener("touchstart", cancelRestoration);
      window.removeEventListener("keydown", cancelRestoration);
    };
  }, [cachedFeed.isInitialized, cachedFeed.scrollY]);

  // Continuously record scroll position
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (isRestoringScrollRef.current || isNavigatingAwayRef.current) {
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isRestoringScrollRef.current && !isNavigatingAwayRef.current) {
            saveHomeScroll(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      // Mark navigating away so unmount scroll collapse doesn't overwrite saved scroll with 0
      isNavigatingAwayRef.current = true;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    // If already initialized in memory, do NOT re-fetch! The page is static unless reloaded.
    if (cachedFeed.isInitialized) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let res: PaginationResult<PostResponse>;

        if (isAuthenticated) {
          // personal feed
          res = await postAPI.getFeed(1, 10);
        } else {
          // guest feed
          res = await postAPI.getGuestFeed(1, 10);
        }

        if (!cancelled) {
          const loadedPosts = res.data || res.items || [];
          const loadedPage = res.page || 1;
          const loadedHasNext = res.hasNext ?? false;

          setPosts(loadedPosts);
          setPage(loadedPage);
          setHasNext(loadedHasNext);

          updateHomeFeedCache({
            posts: loadedPosts,
            page: loadedPage,
            hasNext: loadedHasNext,
            isInitialized: true,
            userId: user?.id,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.error || e?.message || t("LoadFeedFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, t, cachedFeed.isInitialized, user?.id]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = isAuthenticated
        ? await postAPI.getFeed(nextPage, 10)
        : await postAPI.getGuestFeed(nextPage, 10);
      const newItems = res.data || res.items || [];
      const updatedPosts = [...posts, ...newItems];
      const updatedPage = res.page || nextPage;
      const updatedHasNext = res.hasNext ?? false;

      setPosts(updatedPosts);
      setPage(updatedPage);
      setHasNext(updatedHasNext);

      updateHomeFeedCache({
        posts: updatedPosts,
        page: updatedPage,
        hasNext: updatedHasNext,
        userId: user?.id,
      });
    } catch (e: any) {
      console.error("Failed to load more feed posts:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSetView = (nextView: "list" | "grid") => {
    setView(nextView);
    updateHomeFeedCache({ view: nextView, userId: user?.id });
  };

  const handleNsfwConfirm = (postId: string) => {
    setNsfwConfirmedGridPosts((prev) => {
      const next = new Set(prev).add(postId);
      updateHomeFeedCache({ nsfwConfirmedGridPosts: next, userId: user?.id });
      return next;
    });
  };

  const handlePostDeletedOrArchived = (postId: string) => {
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      updateHomeFeedCache({ posts: updated, userId: user?.id });
      return updated;
    });
    removeHomePost(postId);
  };

  const handleReactionChange = (postId: string, newReactions: any) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactions: {
                ...p.reactions,
                ...newReactions,
              },
            }
          : p
      );
      updateHomeFeedCache({ posts: updated, userId: user?.id });
      return updated;
    });
    updateHomePostReaction(postId, newReactions);
  };

  const gridPosts = useMemo(() => posts.filter(p => (p.medias || []).length > 0), [posts]);

  // ====== UI ======
  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        minHeight: restorationMinHeight ? `${restorationMinHeight}px` : undefined,
      }}
    >
      {/* Nội dung */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
        <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 md:gap-6">
          {/* Cột trái (ẩn mock) */}
          <aside className="hidden lg:block" style={{ display: 'none' }} />

          {/* Cột giữa (Feed) */}
          <section>
            {/* Stories Strip */}
            <StoryFeedStrip />

            {/* Feed controls - displayed above feed and loading skeletons */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm opacity-70">{t("FeedTitle")}</div>
              <div className="inline-flex rounded-full p-1 bg-black/5">
                <button onClick={() => handleSetView("list")} className={`px-3 py-1.5 text-xs rounded-full ${view === "list" ? "bg-white shadow ring-1 ring-black/10 text-gray-900" : "opacity-70 hover:opacity-100"}`}>{t("ViewList")}</button>
                <button onClick={() => handleSetView("grid")} className={`px-3 py-1.5 text-xs rounded-full ${view === "grid" ? "bg-white shadow ring-1 ring-black/10 text-gray-900" : "opacity-70 hover:opacity-100"}`}>{t("ViewGrid")}</button>
              </div>
            </div>

            {/* Feed from database */}
            {loading && (
              <div className="mt-6">
                <PostSkeleton
                  variant={view === "list" ? "feed" : "grid"}
                  count={view === "list" ? 3 : 8}
                />
              </div>
            )}
            {error && (
              <div className="mt-6 text-sm text-red-500">{error}</div>
            )}

            {view === "list" ? (
              <div className="mt-4 space-y-6">
                {posts.map((p) => (
                  <PostListItem
                    key={p.id}
                    post={p}
                    onDeleted={() => handlePostDeletedOrArchived(p.id)}
                    onReactionChange={handleReactionChange}
                  />
                ))}
                {loadingMore && (
                  <PostSkeleton variant="feed" count={2} wrap={false} />
                )}
                {!loading && posts.length === 0 && (
                  <div className="mt-8 text-center text-sm opacity-70">{t("EmptyFeed")}</div>
                )}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {gridPosts.map((p) => (
                  <Link key={p.id} href={`/posts/${p.id}`} className="group relative overflow-hidden rounded-xl ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.medias![0].thumbnailUrl || p.medias![0].url}
                      alt={p.caption ?? ""}
                      className={`h-44 w-full object-cover transition-transform group-hover:scale-105 ${p.isNSFW && !nsfwConfirmedGridPosts.has(p.id) ? 'blur-2xl scale-110' : ''}`}
                    />

                    {/* NSFW overlay */}
                    {p.isNSFW && !nsfwConfirmedGridPosts.has(p.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNsfwConfirm(p.id);
                          }}
                          className="px-3 py-1.5 bg-black/70 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
                        >
                          <i className="pi pi-eye mr-1" />
                          Show NSFW
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openAddToCollectionDialog(p.id);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-black shadow-md transition-all"
                        title="Add to collection"
                      >
                        <i className="pi pi-bookmark text-sm" />
                      </button>
                    </div>
                  </Link>
                ))}
                {loadingMore && (
                  <PostSkeleton variant="grid" count={4} wrap={false} />
                )}
              </div>
            )}

            {!loadingMore && hasNext && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--primary, #3b82f6)",
                    color: "white",
                  }}
                >
                  <span>Load more</span>
                </button>
              </div>
            )}
            {/* Mobile / Tablet Trending Collections Section */}
            <div className="block xl:hidden mt-10 pt-6 border-t border-white/10 dark:border-white/5">
              <TrendingCollections />
            </div>
          </section>

          {/* Cột phải (Online Friends + Trending Collections) - Sticky scrollable panel */}
          <aside className="hidden xl:block xl:h-screen xl:sticky xl:top-0 xl:self-start w-full overflow-y-auto">
            <div className="flex flex-col gap-6 p-4">
              <OnlineFriends />
              <TrendingCollections />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PostListItem({
  post,
  onDeleted,
  onReactionChange,
}: {
  post: PostResponse;
  onDeleted?: () => void;
  onReactionChange?: (postId: string, newReactions: any) => void;
}) {
  const { requireAuth, user, isAdmin } = useAuth();
  const router = useRouter();
  const t = useTranslations("HomePage");
  const tReactions = useTranslations("Reactions");
  const { openAddToCollectionDialog } = useOverlay();

  const handleTagClick = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/search?q=${encodeURIComponent(tagName)}&mode=tag`);
  };

  const cachedProfile = post.authorProfileId ? readCachedProfile(post.authorProfileId) : null;
  const avatar = post.authorAvatarUrl || cachedProfile?.avatarUrl || "/avatar-default.svg";
  const display =
    post.authorDisplayName ||
    post.authorUsername ||
    cachedProfile?.displayName ||
    cachedProfile?.username ||
    t("FallbackDisplayName");
  const username = post.authorUsername || cachedProfile?.username;
  const fallbackUsername = t("FallbackUsername");

  const medias = post.medias || [];
  const [mediaIdx, setMediaIdx] = useState(0);
  const [showNSFW, setShowNSFW] = useState(false);
  const isNSFW = post.isNSFW === true;
  useEffect(() => {
    if (mediaIdx >= medias.length) setMediaIdx(0);
  }, [medias.length]);

  const time = new Date(post.createdAt).toLocaleString();
  const tags = (post.tags || []).map((t) => t.name);

  const cached = readPostReaction(post.id);
  const [byType, setByType] = useState<Record<ReactionType, number>>(() => {
    if (cached?.byType) return cached.byType;
    if (post.reactions?.byType) return post.reactions.byType;
    return {
      Like: 0,
      Love: 0,
      Haha: 0,
      Wow: 0,
      Sad: 0,
      Angry: 0,
    };
  });

  const [userReaction, setUserReaction] = useState<ReactionType | null>(() => {
    if (cached && typeof cached.currentUserReaction !== "undefined") {
      return cached.currentUserReaction;
    }
    return (post.reactions?.currentUserReaction ?? null) as any;
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const openPicker = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setPickerOpen(true);
  };
  const closePickerWithDelay = (ms = 120) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPickerOpen(false), ms) as unknown as number;
  };

  const [totalReacts, setTotalReacts] = useState<number>(() => {
    if (typeof cached?.total === "number") return cached.total;
    if (typeof post.reactions?.total === "number") return post.reactions.total;
    const initialByType = cached?.byType ?? post.reactions?.byType ?? {};
    return Object.values(initialByType).reduce((a, b) => a + Number(b || 0), 0);
  });

  useEffect(() => {
    const latest = readPostReaction(post.id);
    if (latest && typeof latest.total === "number") {
      setTotalReacts(latest.total);
      if (latest.byType) setByType(latest.byType);
      if (typeof latest.currentUserReaction !== "undefined") {
        setUserReaction(latest.currentUserReaction);
      }
    } else {
      if (typeof post.reactions?.total === "number") {
        setTotalReacts(post.reactions.total);
      }
      if (post.reactions?.byType) {
        setByType(post.reactions.byType);
      }
      if (typeof post.reactions?.currentUserReaction !== "undefined") {
        setUserReaction(post.reactions.currentUserReaction as any);
      }
    }
  }, [post.reactions, post.id]);

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reactorsOpen, setReactorsOpen] = useState(false);

  const commentSource = (
    post.commentsCount ??
    (post as any).commentCount ??
    (post as any).comments ??
    (post as any).stats?.comments ??
    0
  ) as
    | number
    | string
    | { total?: number; count?: number; length?: number }
    | { [key: string]: any }
    | any[]
    | null
    | undefined;

  const commentCount = (() => {
    if (typeof commentSource === "number") return commentSource;
    if (Array.isArray(commentSource)) return commentSource.length;
    if (typeof commentSource === "string") return Number(commentSource) || 0;
    if (commentSource && typeof commentSource === "object") {
      if (typeof (commentSource as any).total === "number") return (commentSource as any).total;
      if (typeof (commentSource as any).count === "number") return (commentSource as any).count;
      if (typeof (commentSource as any).length === "number") return (commentSource as any).length;
    }
    return 0;
  })();

  const privacy: PrivacyKind = normalizePrivacy(
    (post as any).privacyLevel ?? (post as any).privacy
  );

  const shareCount = (post as any).shareCount ?? (post as any).shares ?? 0;

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!imageViewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [imageViewerOpen]);

  const chooseReaction = async (type: ReactionType) => {
    if (!requireAuth()) return;
    try {
      const prev = userReaction;
      const nextUserReaction = prev === type ? null : type;

      let diff = 0;
      if (prev && !nextUserReaction) diff = -1;
      else if (!prev && nextUserReaction) diff = 1;
      else if (prev && nextUserReaction && prev !== nextUserReaction) diff = 0;

      const newTotal = Math.max(0, totalReacts + diff);
      setTotalReacts(newTotal);

      const nextByType = { ...byType };
      if (prev && nextByType[prev] > 0) nextByType[prev] -= 1;
      if (nextUserReaction) nextByType[nextUserReaction] = (nextByType[nextUserReaction] || 0) + 1;
      setByType(nextByType);

      setUserReaction(nextUserReaction);

      // Save to localStorage immediately with correct values
      writePostReaction(post.id, {
        byType: nextByType,
        currentUserReaction: nextUserReaction,
        total: newTotal,
      });

      onReactionChange?.(post.id, {
        byType: nextByType,
        currentUserReaction: nextUserReaction,
        total: newTotal,
      });

      const res = await postAPI.toggleReaction(post.id, type);
      if (res && res.removed) {
        setUserReaction(null);
        onReactionChange?.(post.id, {
          byType: nextByType,
          currentUserReaction: null,
          total: newTotal,
        });
      }
    } catch {
      // ignore
    } finally {
      setPickerOpen(false);
    }
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const key = `post_cache:${post.id}`;
      if (!e || !e.key || (e.key !== key && e.key !== `${key}:v`)) return;
      const c = readPostReaction(post.id);
      if (c?.byType) setByType(c.byType as any);
      if (typeof c?.currentUserReaction !== "undefined")
        setUserReaction(c.currentUserReaction ?? null);
      if (typeof c?.total === "number")
        setTotalReacts(c.total);
      if (c) onReactionChange?.(post.id, c);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [post.id, onReactionChange]);

  const canDelete = isAdmin || (post.authorProfileId && user?.id === post.authorProfileId);

  // ===== UI (layout mới) =====
  return (
    <article
      className="group transition hover:-translate-y-[1px]"
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      <div
        className="relative glass-post rounded-2xl overflow-visible
                   hover:shadow-[0_14px_46px_0_rgba(0,0,0,0.22)] transition"
        style={{ color: "var(--text)" }}
      >
        {/* highlight kính */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
          }}
        />

        <div className="relative p-4 md:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <ProfileHoverCard
                user={{
                  id: cachedProfile?.id || post.authorProfileId,
                  username: username || fallbackUsername,
                  name: display,
                  avatarUrl: avatar,
                  bio: cachedProfile?.bio || undefined,
                  followersCount: cachedProfile?.stats?.followers,
                  followingCount: cachedProfile?.stats?.following,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={username || display}
                  className="w-10 h-10 rounded-full border border-white/20 dark:border-white/10 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    const authorId = cachedProfile?.id || post.authorProfileId;
                    if (authorId) router.push(`/profile/${authorId}`);
                  }}
                />
              </ProfileHoverCard>

              <div
                className="min-w-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const authorId = cachedProfile?.id || post.authorProfileId;
                  if (authorId) router.push(`/profile/${authorId}`);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-sm md:text-[15px] font-semibold truncate hover:underline">
                    {display}
                  </div>
                  {username && (
                    <div className="text-xs opacity-70 truncate">@{username}</div>
                  )}
                </div>

                <div
                  className="mt-0.5 flex items-center gap-2 text-xs opacity-70 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">{time}</span>

                  {/* privacy icon ngay sau time (cách 1 chút) */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full glass-chip">
                    <i className={`${PRIVACY_ICON_MAP[privacy]} text-xs`} />
                  </span>
                </div>

                {/* chips row: giờ chỉ để location (nếu có) */}
                {post.location?.name && (
                  <div
                    className="mt-2 flex items-center gap-2 text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full glass-chip max-w-[200px] truncate">
                      <i className="pi pi-map-marker text-xs" />
                      <span className="truncate">{post.location.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* menu owner/admin */}
            {canDelete && (
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <PostMenuDialog
                  postId={post.id}
                  onEdit={() => router.push(`/posts/${post.id}/edit`)}
                  onDeleted={() => {
                    onDeleted?.();
                    router.refresh();
                  }}
                  onArchived={() => {
                    onDeleted?.();
                    router.refresh();
                  }}
                />
              </div>
            )}
          </div>

          {/* Body layout: media + content (desktop split, mobile stack) */}
          <div
            className={`mt-4 ${medias.length > 0
              ? "grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4"
              : ""
              }`}
          >
            {/* Media column */}
            {medias.length > 0 && (
              <div
                className="relative rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={medias[mediaIdx]?.url}
                  alt={post.caption ?? ""}
                  className={`w-full h-[260px] sm:h-[320px] md:h-[380px] object-cover cursor-zoom-in ${isNSFW && !showNSFW ? 'blur-3xl scale-110' : ''}`}
                  onClick={() => {
                    if (isNSFW && !showNSFW) return;
                    setImageViewerOpen(true);
                    setZoomScale(1);
                  }}
                />

                {/* NSFW overlay */}
                {isNSFW && !showNSFW && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNSFW(true);
                      }}
                      className="px-4 py-2 bg-black/70 hover:bg-black/80 text-white text-sm rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <i className="pi pi-eye mr-2" />
                      Show NSFW content
                    </button>
                  </div>
                )}

                {/* media controls */}
                {medias.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 glass-chip text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-white/10 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaIdx((i) => (i - 1 + medias.length) % medias.length);
                      }}
                      aria-label={t("AriaPrevious")}
                    >
                      <i className="pi pi-chevron-left" />
                    </button>

                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 glass-chip text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-white/10 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaIdx((i) => (i + 1) % medias.length);
                      }}
                      aria-label={t("AriaNext")}
                    >
                      <i className="pi pi-chevron-right" />
                    </button>

                    <div className="absolute bottom-3 right-3 glass-chip text-white text-xs px-2 py-1 rounded-full">
                      {mediaIdx + 1}/{medias.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Content column */}
            <div className="flex flex-col gap-3">
              {/* Description box (no border, heavy text) */}
              {post.caption && (
                <div
                  className="rounded-2xl px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="text-sm md:text-[15px] leading-relaxed overflow-hidden font-semibold"
                    style={{
                      color: "var(--text)",
                      opacity: 0.95,
                      maxHeight: medias.length > 0 ? "152px" : "220px",
                      display: "-webkit-box",
                      WebkitLineClamp: medias.length > 0 ? 6 : 10,
                      WebkitBoxOrient: "vertical",
                    } as any}
                  >
                    {post.caption}
                  </div>
                </div>
              )}

              {/* Tags (if any) */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => handleTagClick(tag, e)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full transition
                        bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10
                        border border-black/20 dark:border-white/10 hover:opacity-80"
                      style={{ color: "var(--text)" }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action bar at the bottom of the post */}
          <div
            className="mt-4 relative flex items-center justify-between gap-2 px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: reaction + count */}
            <div
              className="relative inline-flex items-center"
              onMouseEnter={openPicker}
              onMouseLeave={() => closePickerWithDelay(140)}
            >
              <button
                className="px-3 py-2 rounded-full glass-chip hover:bg-white/15 dark:hover:bg-white/10 transition
                  text-white dark:text-white
                  bg-black/60 dark:bg-white/15
                  hover:bg-black/70 dark:hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  userReaction ? chooseReaction(userReaction) : chooseReaction("Like" as any);
                }}
                aria-label={t("AriaReact")}
              >
                {userReaction ? (
                  <span className="text-lg">
                    {({ Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😡" } as any)[userReaction]}
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/reaction-default.svg" alt={t("ReactIconAlt")} className="w-6 h-6" />
                )}
              </button>

              {pickerOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 z-[70] text-white rounded-full px-2 py-1 flex items-center gap-1.5 shadow-lg"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                  onMouseEnter={openPicker}
                  onMouseLeave={() => closePickerWithDelay(120)}
                >
                  {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((r) => (
                    <button
                      key={r}
                      className="w-8 h-8 grid place-items-center text-xl hover:scale-110 transition"
                      onClick={() => chooseReaction(r as ReactionType)}
                      title={tReactions(r as any)}
                    >
                      {({ Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😡" } as any)[r]}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="ml-2 text-base font-semibold opacity-90 hover:opacity-100 transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (totalReacts > 0) {
                    setReactorsOpen(true);
                  }
                }}
                title={t("ViewReactors")}
              >
                {totalReacts}
              </button>
            </div>

            {/* Right: icons row */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm opacity-90">
              <button
                className="inline-flex items-center gap-1 hover:opacity-100 transition"
                title={t("CommentsLabel")}
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                <i className="pi pi-comments" /> {commentCount}
              </button>

              <button
                className="inline-flex items-center gap-1 hover:opacity-100 transition"
                title="Add to collection"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddToCollectionDialog(post.id);
                }}
              >
                <i className="pi pi-bookmark" />
              </button>

              <button
                className="inline-flex items-center gap-1 hover:opacity-100 transition"
                title="Share"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen(true);
                }}
              >
                <i className="pi pi-share-alt" /> {shareCount}
              </button>

              {!canDelete && (
                <button
                  className="inline-flex items-center gap-1 hover:opacity-100 text-red-500 transition"
                  title="Report post"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportOpen(true);
                  }}
                >
                  <i className="pi pi-flag" />
                </button>
              )}
            </div>

            {/* dialogs */}
            <ShareToChatDialog
              visible={shareOpen}
              postId={post.id}
              onShared={() => { }}
              onClose={() => setShareOpen(false)}
            />

            {!canDelete && (
              <ReportDialog
                visible={reportOpen}
                onHide={() => setReportOpen(false)}
                targetType={1 as ReportTarget}
                targetId={post.id}
                reporterProfileId={user?.id || ""}
                targetName={username || display}
              />
            )}

            <PostReactorsDialog
              visible={reactorsOpen}
              postId={post.id}
              onHide={() => setReactorsOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Image Viewer Overlay - rendered via portal to appear above all elements */}
      {isMounted && imageViewerOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setImageViewerOpen(false);
          }}
          onWheel={(e) => {
            e.preventDefault();
          }}
        >
          <div className="absolute top-3 right-3">
            <button
              className="w-9 h-9 grid place-items-center rounded-full glass-chip text-white hover:bg-white/10 transition"
              onClick={(e) => {
                e.stopPropagation();
                setImageViewerOpen(false);
              }}
              aria-label={t("AriaClose")}
            >
              <i className="pi pi-times" />
            </button>
          </div>

          {medias.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full glass-chip text-white hover:bg-white/10 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIdx((i) => (i - 1 + medias.length) % medias.length);
                  setZoomScale(1);
                }}
                aria-label={t("AriaPrevious")}
              >
                <i className="pi pi-chevron-left" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full glass-chip text-white hover:bg-white/10 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIdx((i) => (i + 1) % medias.length);
                  setZoomScale(1);
                }}
                aria-label={t("AriaNext")}
              >
                <i className="pi pi-chevron-right" />
              </button>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY;
              setZoomScale((prev) => {
                const next = Math.max(1, Math.min(2.5, prev + (delta < 0 ? 0.15 : -0.15)));
                return Number(next.toFixed(2));
              });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={medias[mediaIdx]?.url}
              alt={post.caption ?? ""}
              className={`mx-auto ${isNSFW && !showNSFW ? 'blur-3xl' : ''}`}
              style={{
                maxHeight: "85vh",
                maxWidth: "90vw",
                objectFit: "contain",
                transform: `scale(${zoomScale})`,
                transition: "transform 140ms ease",
                cursor: zoomScale > 1 ? "zoom-out" : "zoom-in",
              }}
              onClick={() => {
                if (isNSFW && !showNSFW) {
                  setShowNSFW(true);
                } else {
                  setZoomScale((z) => (z > 1 ? 1 : 1.7));
                }
              }}
            />

            {/* NSFW overlay in viewer */}
            {isNSFW && !showNSFW && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNSFW(true);
                  }}
                  className="px-6 py-3 bg-black/70 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  <i className="pi pi-eye" />
                  Show NSFW content
                </button>
              </div>
            )}

            <div className="absolute bottom-3 left-3 text-white text-xs glass-chip px-2 py-1 rounded-full">
              {mediaIdx + 1}/{medias.length}
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
