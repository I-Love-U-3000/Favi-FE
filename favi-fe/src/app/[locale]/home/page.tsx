"use client";

import Dock from "@/components/Dock";
// StoriesStrip and mock FeedCard removed in favor of real data


import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import useProfile from "@/lib/hooks/useProfile";
import { useRouter, Link } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse, ReactionType } from "@/types";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { readPostReaction, writePostReaction } from "@/lib/postCache";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const me = useProfile(user?.id);
  const [view, setView] = useState<"list" | "grid">("list");
  const router = useRouter();
  const [quickQ, setQuickQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!isAuthenticated) {
          if (!cancelled) {
            setPosts([]);
            setError("Vui lòng đăng nhập để xem bảng feed của bạn.");
          }
        } else {
          const res = await postAPI.getFeed(1, 24);
          if (!cancelled) setPosts(res.items || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.error || e?.message || "Failed to load feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const gridPosts = useMemo(() => posts.filter(p => (p.medias || []).length > 0), [posts]);

        // ====== UI ======
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Dock cố định giữa bên trái */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
        <Dock />
      </div>

      {/* Nội dung */}
      <main className="flex-1 p-6 ">
        <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* Cột trái (ẩn mock) */}
          <aside className="hidden lg:block" style={{ display: 'none' }} />

          {/* Cột giữa (Feed) */}
          <section>
            {/* Top search bar (sticky) */}
            <div className="sticky top-0 z-30 -mt-6 pt-6 pb-3" style={{ background: "linear-gradient(var(--bg),var(--bg))", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <div className="shrink-0 flex items-center gap-2" title={user?.email || (user?.id ?? '')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={me.profile?.avatarUrl || "/avatar-default.svg"}
                      alt={me.profile?.username || "avatar"}
                      className="w-9 h-9 rounded-full border"
                    />
                  </div>
                )}
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-search" />
                  <input
                    value={quickQ}
                    onChange={(e) => setQuickQ(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e as any).key === "Enter") {
                        router.push(`/search?mode=keyword&q=${encodeURIComponent(quickQ)}`);
                      }
                    }}
                    placeholder="Search photos, captions, tags…"
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--input-border)" }}
                  />
                </span>
                <button
                  onClick={() => router.push(`/search?mode=keyword&q=${encodeURIComponent(quickQ)}`)}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "var(--primary)", color: "white" }}
                >
                  Search
                </button>
              </div>
            </div>
            {/* Feed from database */}
            {loading && (
              <div className="mt-6 text-sm opacity-70">Loading posts…</div>
            )}
            {error && (
              <div className="mt-6 text-sm text-red-500">{error}</div>
            )}

            {/* Feed controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm opacity-70">Your feed</div>
              <div className="inline-flex rounded-full p-1 bg-black/5">
                <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs rounded-full ${view==="list"?"bg-white shadow ring-1 ring-black/10":"opacity-70 hover:opacity-100"}`}>List</button>
                <button onClick={() => setView("grid")} className={`px-3 py-1.5 text-xs rounded-full ${view==="grid"?"bg-white shadow ring-1 ring-black/10":"opacity-70 hover:opacity-100"}`}>Grid</button>
              </div>
            </div>

            {view === "list" ? (
              <div className="mt-4 space-y-6">
                {posts.map((p) => (
                  <PostListItem key={p.id} post={p} />
                ))}
                {!loading && posts.length === 0 && (
                  <div className="mt-8 text-center text-sm opacity-70">No posts yet.</div>
                )}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {gridPosts.map((p) => (
                  <Link key={p.id} href={`/posts/${p.id}`} className="group relative overflow-hidden rounded-xl ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.medias![0].thumbnailUrl || p.medias![0].url} alt={p.caption ?? ""} className="h-44 w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Cột phải (ẩn mock) */}
          <aside className="hidden xl:block" />
        </div>
      </main>
    </div>
  );
}

function PostListItem({ post }: { post: PostResponse }) {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const author = useProfile(post.authorProfileId);
  const avatar = author.profile?.avatarUrl || "/avatar-default.svg";
  const display = author.profile?.displayName || author.profile?.username || "User";
  const username = author.profile?.username;
  const medias = post.medias || [];
  const [mediaIdx, setMediaIdx] = useState(0);
  useEffect(() => {
    if (mediaIdx >= medias.length) setMediaIdx(0);
  }, [medias.length]);
  const time = new Date(post.createdAt).toLocaleString();
  const tags = (post.tags || []).map(t => t.name);

  const cached = readPostReaction(post.id);
  const [byType, setByType] = useState<Record<ReactionType, number>>(
    cached?.byType ?? {
      Like: post.reactions?.byType?.Like ?? 0,
      Love: post.reactions?.byType?.Love ?? 0,
      Haha: post.reactions?.byType?.Haha ?? 0,
      Wow:  post.reactions?.byType?.Wow  ?? 0,
      Sad:  post.reactions?.byType?.Sad  ?? 0,
      Angry:post.reactions?.byType?.Angry?? 0,
    }
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    (cached?.currentUserReaction ?? post.reactions?.currentUserReaction ?? null) as any
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const openPicker = () => {
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setPickerOpen(true);
  };
  const closePickerWithDelay = (ms = 120) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPickerOpen(false), ms) as unknown as number;
  };
  const totalReacts = Object.values(byType).reduce((a,b)=>a+b,0);
  const [shareOpen, setShareOpen] = useState(false);
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
  const shareCount = (post as any).shareCount ?? (post as any).shares ?? 0;
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  // Lock body scroll while viewer is open
  useEffect(() => {
    if (!imageViewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [imageViewerOpen]);

  const chooseReaction = async (type: ReactionType) => {
    if (!requireAuth()) return;
    try {
      const prev = userReaction;
      // optimistic update
      setByType(prevCounts => {
        const next = { ...prevCounts };
        if (prev && next[prev] > 0) next[prev] -= 1;
        if (prev !== type) next[type] = (next[type] || 0) + 1;
        return next;
      });
      setUserReaction(prev === type ? null : type);
      const res = await postAPI.toggleReaction(post.id, type);
      // res may be { removed: true } or { type: "Like" }
      if (res && res.removed) {
        setUserReaction(null);
      }
      // persist latest reaction snapshot for cross-view consistency
      const snapshot = { ...byType } as Record<ReactionType, number>;
      if (prev && snapshot[prev] > 0) snapshot[prev] -= 1;
      if (prev !== type) snapshot[type] = (snapshot[type] || 0) + 1;
      writePostReaction(post.id, { byType: snapshot, currentUserReaction: prev === type ? null : type });
    } catch (e) {
      // on error, reload from server next time; for now, ignore
    } finally {
      setPickerOpen(false);
    }
  };

  // Sync from other views (detail page) via localStorage version key
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const key = `post_cache:${post.id}`;
      if (!e || !e.key || (e.key !== key && e.key !== `${key}:v`)) return;
      const c = readPostReaction(post.id);
      if (c?.byType) setByType(c.byType as any);
      if (typeof c?.currentUserReaction !== 'undefined') setUserReaction(c.currentUserReaction ?? null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [post.id]);

  return (
    <article
      className="rounded-2xl overflow-visible ring-1 ring-black/5 cursor-pointer"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      {/* Header: author with hover card */}
      <div className="px-4 py-3 flex items-center gap-3">
        <ProfileHoverCard
          user={{
            id: author.profile?.id || post.authorProfileId,
            username: username || "user",
            name: display,
            avatarUrl: avatar,
            bio: author.profile?.bio || undefined,
            followersCount: author.profile?.stats?.followers,
            followingCount: author.profile?.stats?.following,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={username || display} className="w-9 h-9 rounded-full border cursor-pointer" />
        </ProfileHoverCard>
        <div className="min-w-0">
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{display}</div>
          <div className="text-xs opacity-70 truncate">{username ? `@${username}` : ''} {username && '•'} {time}</div>
        </div>
      </div>

      {/* Media (slider) */}
      {medias.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={medias[mediaIdx]?.url}
            alt={post.caption ?? ''}
            className="w-full h-72 md:h-80 object-cover cursor-zoom-in"
            onClick={() => { setImageViewerOpen(true); setZoomScale(1); }}
          />
          {medias.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center"
                onClick={(e)=>{ e.stopPropagation(); setMediaIdx(i=> (i-1+medias.length)%medias.length); }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center"
                onClick={(e)=>{ e.stopPropagation(); setMediaIdx(i=> (i+1)%medias.length); }}
                aria-label="Next"
              >
                ›
              </button>
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {mediaIdx + 1}/{medias.length}
              </div>
            </>
          )}
        </div>
      )}
      {/* Image Viewer Overlay */}
      {imageViewerOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center"
          onClick={(e)=>{ e.stopPropagation(); if (e.target === e.currentTarget) setImageViewerOpen(false); }}
          onWheel={(e)=>{ e.preventDefault(); }}
        >
          <div className="absolute top-3 right-3">
            <button
              className="w-9 h-9 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
              onClick={(e)=>{ e.stopPropagation(); setImageViewerOpen(false); }}
              aria-label="Close"
            >
              <i className="pi pi-times" />
            </button>
          </div>
          {/* Prev/Next in viewer */}
          {medias.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={(e)=>{ e.stopPropagation(); setMediaIdx(i=> (i-1+medias.length)%medias.length); setZoomScale(1); }}
                aria-label="Previous"
              >
                <i className="pi pi-chevron-left" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={(e)=>{ e.stopPropagation(); setMediaIdx(i=> (i+1)%medias.length); setZoomScale(1); }}
                aria-label="Next"
              >
                <i className="pi pi-chevron-right" />
              </button>
            </>
          )}
          <div
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e)=>e.stopPropagation()}
            onWheel={(e)=>{
              e.preventDefault();
              const delta = e.deltaY;
              setZoomScale(prev => {
                const next = Math.max(1, Math.min(2.5, prev + (delta < 0 ? 0.15 : -0.15)));
                return Number(next.toFixed(2));
              });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={medias[mediaIdx]?.url}
              alt={post.caption ?? ''}
              className="mx-auto"
              style={{
                maxHeight: '85vh',
                maxWidth: '90vw',
                objectFit: 'contain',
                transform: `scale(${zoomScale})`,
                transition: 'transform 140ms ease',
                cursor: zoomScale > 1 ? 'zoom-out' : 'zoom-in',
              }}
              onClick={()=> setZoomScale(z => (z > 1 ? 1 : 1.7))}
            />
            {/* Removed magnify button; use mouse wheel or click to toggle */}
            <div className="absolute bottom-3 left-3 text-white text-xs bg-black/40 px-2 py-1 rounded-full">{mediaIdx + 1}/{medias.length}</div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {post.caption && (
          <div
            className="text-sm"
            style={{
              color: 'var(--text)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as any}
          >
            {post.caption}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>#{t}</span>
            ))}
          </div>
        )}
        {/* Reactions + counts + share */}
        <div className="flex items-center justify-between">
          <div />
          <div className="relative flex items-center gap-4 text-sm opacity-80" onClick={(e)=>e.stopPropagation()}>
            <div
              className="relative inline-flex items-center"
              onMouseEnter={openPicker}
              onMouseLeave={() => closePickerWithDelay(140)}
            >
              <button
                className="px-2 py-1 rounded-full border hover:bg-black/5"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                onClick={(e) => { e.stopPropagation(); userReaction ? chooseReaction(userReaction) : chooseReaction('Like' as any); }}
                aria-label="React"
              >
                {userReaction ? (
                  <span className="text-base">{({ Like:'👍', Love:'❤️', Haha:'😂', Wow:'😮', Sad:'😢', Angry:'😡' } as any)[userReaction]}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/reaction-default.svg" alt="react" className="w-4 h-4" />
                )}
              </button>
              {pickerOpen && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[70] bg-black/75 text-white rounded-full px-1.5 py-1 flex items-center gap-1.5 shadow-lg"
                  onMouseEnter={openPicker}
                  onMouseLeave={() => closePickerWithDelay(120)}
                >
                  {["Like","Love","Haha","Wow","Sad","Angry"].map(r => (
                    <button
                      key={r}
                      className="w-8 h-8 grid place-items-center text-xl hover:scale-110 transition"
                      onClick={() => chooseReaction(r as ReactionType)}
                      title={r}
                    >
                      {({ Like:'👍', Love:'❤️', Haha:'😂', Wow:'😮', Sad:'😢', Angry:'😡' } as any)[r]}
                    </button>
                  ))}
                </div>
              )}
              <span className="ml-2 text-xs opacity-70">{totalReacts}</span>
            </div>

            <button className="inline-flex items-center gap-1 hover:opacity-100" title="Share" onClick={()=>router.push(`/posts/${post.id}`)}>
              <span className="inline-flex items-center gap-1" title="Comments"><i className="pi pi-comments" /> {commentCount}</span>
            </button>

            <button className="inline-flex items-center gap-1 hover:opacity-100" title="Share" onClick={()=>setShareOpen(v=>!v)}>
              <i className="pi pi-share-alt" /> {shareCount}
            </button>
            {shareOpen && (
              <div className="absolute translate-y-10 right-0 z-[70] bg-white dark:bg-neutral-900 border rounded-lg shadow p-2 flex flex-col text-sm">
                <button className="px-3 py-1 text-left hover:bg-black/5" onClick={()=>{alert('Share to chat (todo)'); setShareOpen(false);}}>Share to chat</button>
                <button className="px-3 py-1 text-left hover:bg-black/5" onClick={()=>{alert('Share to your profile (todo)'); setShareOpen(false);}}>Share to profile</button>
                <button className="px-3 py-1 text-left hover:bg-black/5" onClick={()=>{navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`); alert('Link copied'); setShareOpen(false);}}>Copy link</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
