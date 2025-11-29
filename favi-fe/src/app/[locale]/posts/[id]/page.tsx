"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import postAPI from "@/lib/api/postAPI";
import commentAPI from "@/lib/api/commentAPI";
import useProfile from "@/lib/hooks/useProfile";
import type { CommentResponse, CommentTreeResponse, PostResponse, ReactionType, ReactionSummaryDto } from "@/types";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { useCallback, useEffect, useRef, useState } from "react";
import { readPostReaction, writePostReaction } from "@/lib/postCache";
import Dock from "@/components/Dock";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "primereact/button";

type PrivacyKind = "Public" | "Followers" | "Private";

const PRIVACY_ICON_MAP: Record<PrivacyKind, string> = {
  Public: "pi pi-globe",
  Followers: "pi pi-users",
  Private: "pi pi-lock",
};

function normalizePrivacy(raw: unknown): PrivacyKind {
  if (raw === 0 || raw === "0" || raw === "Public") return "Public";
  if (raw === 1 || raw === "1" || raw === "Followers") return "Followers";
  if (raw === 2 || raw === "2" || raw === "Private") return "Private";

  return "Public";
}

export default function PostPage() {
  const routeParams = useParams() as any;
  const id = Array.isArray(routeParams?.id) ? routeParams.id[0] : String(routeParams?.id || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await postAPI.getById(id);
        if (!cancelled) setPost(p);
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 404) {
            notFound();
            return;
          }
          setError(e?.error || e?.message || "Failed to load post");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-6 opacity-70 text-sm">Loading…</div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;
  if (!post) notFound();

  return <PostDetailDataView post={post!} />;
}

function PostDetailDataView({ post }: { post: PostResponse }) {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const privacy: PrivacyKind = normalizePrivacy(
    (post as any).privacyLevel ?? (post as any).privacy
  );

  const author = useProfile(post.authorProfileId);
  const avatar = author.profile?.avatarUrl || "/avatar-default.svg";
  const display = author.profile?.displayName || author.profile?.username || "";
  const username = author.profile?.username;

  const medias = post.medias || [];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= medias.length) setIdx(0);
  }, [medias.length]);

  // reactions (kept as-is; call your API)
  const cached = readPostReaction(post.id);
  const [byType, setByType] = useState<Record<ReactionType, number>>(
    cached?.byType ?? {
      Like: post.reactions?.byType?.Like ?? 0,
      Love: post.reactions?.byType?.Love ?? 0,
      Haha: post.reactions?.byType?.Haha ?? 0,
      Wow: post.reactions?.byType?.Wow ?? 0,
      Sad: post.reactions?.byType?.Sad ?? 0,
      Angry: post.reactions?.byType?.Angry ?? 0,
    }
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    (cached?.currentUserReaction ?? post.reactions?.currentUserReaction ?? null) as any
  );
  const totalReacts = Object.values(byType).reduce((a, b) => a + b, 0);
  const initialCommentCount =
    post.commentsCount ??
    (post as any).commentCount ??
    (post as any).comments ??
    0;
  const [commentCount, setCommentCount] = useState<number>(initialCommentCount);
  const [shareCount, setShareCount] = useState<number>((post as any).shareCount ?? (post as any).shares ?? 0);
  const [shareOpen, setShareOpen] = useState(false);
  // reaction picker like feed
  const [pickerOpen, setPickerOpen] = useState(false);
  let pickerTimer: number | null = null as any;
  const openPicker = () => { if (pickerTimer) { window.clearTimeout(pickerTimer); pickerTimer = null as any; } setPickerOpen(true); };
  const closePickerWithDelay = (ms = 140) => { if (pickerTimer) window.clearTimeout(pickerTimer); pickerTimer = window.setTimeout(() => setPickerOpen(false), ms) as unknown as number; };

  // image viewer overlay
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [viewerOpen]);

  const toggleReact = async (type: ReactionType) => {
    if (!requireAuth()) return;
    const prev = userReaction;
    const nextType = prev === type ? null : type;
    try {
      setByType((prevCounts) => {
        const next = { ...prevCounts };
        if (prev && next[prev] > 0) next[prev] -= 1;
        if (nextType) next[nextType] = (next[nextType] || 0) + 1;
        return next;
      });
      setUserReaction(nextType);
      await postAPI.toggleReaction(post.id, type);
      // persist to cache for feed sync
      const snapshot = { ...byType } as Record<ReactionType, number>;
      if (prev && snapshot[prev] > 0) snapshot[prev] -= 1;
      if (nextType) snapshot[nextType] = (snapshot[nextType] || 0) + 1;
      writePostReaction(post.id, { byType: snapshot, currentUserReaction: nextType });
    } catch { }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
        <Dock />
      </div>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* Media + caption */}
          <section
            className="rounded-2xl overflow-visible ring-1 ring-black/5"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <ProfileHoverCard
                user={{
                  id: author.profile?.id || post.authorProfileId,
                  username: username || "",
                  name: display || username || "",
                  avatarUrl: avatar,
                  bio: author.profile?.bio || undefined,
                  followersCount: author.profile?.stats?.followers,
                  followingCount: author.profile?.stats?.following,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={username || display || ""}
                  className="w-10 h-10 rounded-full border cursor-pointer"
                  onClick={() => router.push(`/profile/${author.profile?.id || post.authorProfileId}`)}
                />
              </ProfileHoverCard>
              <div className="min-w-0">
                <div className="text-sm font-medium">{display || username}</div>
                {username && <div className="text-xs opacity-70">@{username}</div>}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-600">
                  {/* Privacy */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-white/70">
                    <i className={`${PRIVACY_ICON_MAP[privacy]} text-xs`} />
                  </span>

                  {/* Location (nếu có) */}
                  {post.location?.name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-white/70 max-w-[200px] truncate">
                      <i className="pi pi-map-marker text-xs" />
                      <span className="truncate">{post.location.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {medias[0]?.url && (
              <div className="relative rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={medias[idx]?.url} alt={post.caption ?? ""} className="w-full h-[60vh] max-h-[640px] object-cover cursor-zoom-in" onClick={() => { setViewerOpen(true); setZoom(1); }} />
                {medias.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 grid place-items-center"
                      onClick={() => setIdx((i) => (i - 1 + medias.length) % medias.length)}
                      aria-label="Prev"
                    >
                      ‹
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 grid place-items-center"
                      onClick={() => setIdx((i) => (i + 1) % medias.length)}
                      aria-label="Next"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {idx + 1}/{medias.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="px-4 py-3 space-y-2">
              {post.caption && (
                <div
                  className="text-sm"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } as any}
                >
                  {post.caption}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                {post.location?.name && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-white/70 max-w-[240px] truncate">
                    <i className="pi pi-map-marker text-xs" />
                    <span className="truncate">
                      {post.location.name}
                      {post.location.fullAddress ? ` · ${post.location.fullAddress}` : ""}
                    </span>
                  </span>
                )}
              </div>
              {(post.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end text-sm opacity-80 relative">
                <div className="flex items-center gap-4">
                  <div
                    className="relative"
                    onMouseEnter={openPicker}
                    onMouseLeave={() => closePickerWithDelay(140)}
                  >
                    <button
                      type="button"
                      onClick={() => toggleReact(userReaction ?? "Like")}
                      className="px-2 py-1 rounded-full cursor-pointer hover:bg-black/5 inline-flex items-center justify-center border"
                      style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      {userReaction ? (
                        <span className="text-base">
                          {
                            ({
                              Like: "👍",
                              Love: "❤️",
                              Haha: "😂",
                              Wow: "😮",
                              Sad: "😢",
                              Angry: "😡",
                            } as any)[userReaction]
                          }
                        </span>
                      ) : (
                        <img src="/reaction-default.svg" alt="react" className="w-4 h-4" />
                      )}
                    </button>
                    {pickerOpen && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] bg-black/75 text-white rounded-full px-1.5 py-1 flex items-center gap-1.5 shadow-lg"
                        onMouseEnter={openPicker}
                        onMouseLeave={() => closePickerWithDelay(120)}
                      >
                        {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((r) => (
                          <button
                            key={r}
                            className="w-8 h-8 grid place-items-center text-xl hover:scale-110 transition"
                            onClick={() => toggleReact(r as ReactionType)}
                            title={r}
                            type="button"
                          >
                            {
                              ({
                                Like: "👍",
                                Love: "❤️",
                                Haha: "😂",
                                Wow: "😮",
                                Sad: "😢",
                                Angry: "😡",
                              } as any)[r]
                            }
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1">{totalReacts}</span>
                  <span className="inline-flex items-center gap-1">
                    <i className="pi pi-comments" /> {commentCount}
                  </span>
                  <div className="relative">
                    <button
                      className="inline-flex items-center gap-1 hover:opacity-100"
                      title="Share"
                      onClick={() => setShareOpen((v) => !v)}
                    >
                      <i className="pi pi-share-alt" /> {shareCount}
                    </button>
                    {shareOpen && (
                      <div className="absolute right-0 mt-2 z-[100] bg-white dark:bg-neutral-900 border rounded-lg shadow p-2 flex flex-col text-sm">
                        <button
                          className="px-3 py-1 text-left hover:bg-black/5"
                          onClick={() => {
                            alert("Share to chat (todo)");
                            setShareOpen(false);
                            setShareCount((c) => c + 1);
                          }}
                        >
                          Share to chat
                        </button>
                        <button
                          className="px-3 py-1 text-left hover:bg-black/5"
                          onClick={() => {
                            alert("Share to your profile (todo)");
                            setShareOpen(false);
                            setShareCount((c) => c + 1);
                          }}
                        >
                          Share to profile
                        </button>
                        <button
                          className="px-3 py-1 text-left hover:bg-black/5"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`);
                            setShareOpen(false);
                            setShareCount((c) => c + 1);
                          }}
                        >
                          Copy link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right rail: comments (bật hiển thị ở mọi size để test) */}
          <aside className="block space-y-4">
            <CommentsPanel postId={post.id} onCountChange={setCommentCount} />
          </aside>
        </div>
      </main>

      {/* Image Viewer Overlay */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setViewerOpen(false); }}
          onWheel={(e) => { e.preventDefault(); }}
        >
          <div className="absolute top-3 right-3">
            <button className="w-9 h-9 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setViewerOpen(false); }} aria-label="Close">
              <i className="pi pi-times" />
            </button>
          </div>
          {medias.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + medias.length) % medias.length); setZoom(1); }} aria-label="Previous"><i className="pi pi-chevron-left" /></button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % medias.length); setZoom(1); }} aria-label="Next"><i className="pi pi-chevron-right" /></button>
            </>
          )}
          <div
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => { e.preventDefault(); setZoom(z => Number(Math.max(1, Math.min(2.5, z + (e.deltaY < 0 ? 0.15 : -0.15))).toFixed(2))); }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={medias[idx]?.url}
              alt={post.caption ?? ''}
              className="mx-auto"
              style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 140ms ease', cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
              onClick={() => setZoom(z => (z > 1 ? 1 : 1.7))}
            />
            <div className="absolute bottom-3 left-3 text-white text-xs bg-black/40 px-2 py-1 rounded-full">{idx + 1}/{medias.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const norm = (v: unknown) => (v == null ? "" : String(v).trim());

const getId = (c: any): string =>
  norm(c?.id ?? c?.commentId ?? c?.comment_id);

const getParentId = (c: any): string | undefined => {
  const pid =
    c?.parentCommentId ??
    c?.parentId ??
    c?.replyToCommentId ??
    c?.parent_comment_id;
  const p = norm(pid);
  return p ? p : undefined;
};

const COMMENT_REACTION_TYPES: ReactionType[] = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"];
const COMMENT_REACTION_EMOJIS: Record<ReactionType, string> = {
  Like: "👍",
  Love: "❤️",
  Haha: "😂",
  Wow: "😮",
  Sad: "😢",
  Angry: "😡",
};

const buildCommentReactionCounts = (summary?: ReactionSummaryDto | null): Record<ReactionType, number> => ({
  Like: summary?.byType?.Like ?? 0,
  Love: summary?.byType?.Love ?? 0,
  Haha: summary?.byType?.Haha ?? 0,
  Wow: summary?.byType?.Wow ?? 0,
  Sad: summary?.byType?.Sad ?? 0,
  Angry: summary?.byType?.Angry ?? 0,
});

/** Flatten dữ liệu dạng cây từ API (root có field replies: CommentTreeResponse[]) */
const flattenFromApi = (roots: CommentTreeResponse[]): CommentResponse[] => {
  const out: CommentResponse[] = [];
  const walk = (node?: CommentTreeResponse) => {
    if (!node) return;
    const { replies, ...rest } = node;
    const flat: CommentResponse = { ...rest };
    out.push(flat);
    (replies ?? []).forEach(walk);
  };
  (roots ?? []).forEach(walk);
  return out;
};

function CommentsPanel({ postId, onCountChange }: { postId: string; onCountChange?: (n: number) => void }) {
  const { requireAuth, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedRoots, setExpandedRoots] = useState<Record<string, boolean>>({});
  const syncedInitialCount = useRef(false);

  useEffect(() => {
    if (!syncedInitialCount.current) {
      syncedInitialCount.current = true;
      return;
    }
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await commentAPI.getByPost(postId, 1, 200);
        if (!cancelled) {
          const flat = flattenFromApi(res.items || []);
          setItems(flat);
          onCountChange?.(Number(res.totalCount ?? flat.length));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.error || e?.message || "Failed to load comments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId, onCountChange]);

  const byId = new Map(items.map(c => [getId(c), c] as const));
  const childrenMap = new Map<string, CommentResponse[]>();
  for (const c of items) {
    const pid = getParentId(c);
    if (!pid) continue;
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid)!.push(c);
  }

  const roots = items.filter(c => !getParentId(c));

  const gatherAllDescendants = (rootId: string): CommentResponse[] => {
    const out: CommentResponse[] = [];
    const stack = [...(childrenMap.get(rootId) || [])];
    while (stack.length) {
      const cur = stack.shift()!;
      out.push(cur);
      const kids = childrenMap.get(getId(cur)) || [];
      stack.push(...kids);
    }
    return out;
  };

  const submit = async () => {
    const content = newComment.trim();
    if (!content || !requireAuth()) return;
    try {
      setPosting(true);
      const created = await commentAPI.create({ postId, content });
      setItems(prev => [created, ...prev]);
      setNewComment("");
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to comment");
    } finally { setPosting(false); }
  };

  const submitReply = async (parentId: string) => {
    const content = replyText.trim();
    if (!content || !requireAuth()) return;
    try {
      setPosting(true);
      const created = await commentAPI.create({ postId, content, parentCommentId: parentId });
      setItems(prev => [created, ...prev]);
      setReplyToId(null);
      setReplyText("");
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to reply");
    } finally { setPosting(false); }
  };

  const handleUpdateComment = useCallback(async (commentId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Nội dung không được để trống");
    if (!requireAuth()) throw new Error("Bạn cần đăng nhập để chỉnh sửa bình luận.");
    try {
      const updated = await commentAPI.update(commentId, { content: trimmed });
      setItems(prev => prev.map(item => (getId(item) === getId(updated) ? updated : item)));
    } catch (e: any) {
      throw new Error(e?.error || e?.message || "Failed to update comment");
    }
  }, [requireAuth]);


  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!requireAuth()) throw new Error("Bạn cần đăng nhập để xóa bình luận.");
    try {
      await commentAPI.delete(commentId);
      setItems(prev => {
        const childMap = new Map<string, string[]>();
        prev.forEach(item => {
          const pid = getParentId(item);
          if (!pid) return;
          if (!childMap.has(pid)) childMap.set(pid, []);
          childMap.get(pid)!.push(getId(item));
        });

        const toRemove = new Set<string>();
        const stack = [commentId];
        while (stack.length) {
          const cur = stack.pop()!;
          if (toRemove.has(cur)) continue;
          toRemove.add(cur);
          (childMap.get(cur) || []).forEach(child => stack.push(child));
        }

        const next = prev.filter(item => !toRemove.has(getId(item)));
        onCountChange?.(next.length);
        return next;
      });
    } catch (e: any) {
      throw new Error(e?.error || e?.message || "Failed to delete comment");
    }
  }, [requireAuth, onCountChange]);

  return (
    <div className="rounded-2xl ring-1 ring-black/5" style={{ backgroundColor: "var(--bg-secondary)", overflow: "visible" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold">Comments</div>
      </div>

      <div className="max-h-[58vh] overflow-auto p-3">
        {loading && <div className="text-xs opacity-70">Loading…</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        {!loading && roots.length === 0 && <div className="text-xs opacity-70">No comments.</div>}

        <div className="space-y-4">
          {roots.map(root => {
            const rootId = getId(root);
            const repliesFlat = gatherAllDescendants(rootId);
            const expanded = !!expandedRoots[rootId];
            const visible = expanded ? repliesFlat : repliesFlat.slice(0, 2);
            const remaining = Math.max(0, repliesFlat.length - visible.length);

            return (
              <div key={rootId}>
                <CommentRow
                  c={root}
                  onReply={() => { setReplyToId(rootId); setReplyText(""); }}
                  replying={replyToId === rootId}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  submitReply={() => submitReply(rootId)}
                  posting={posting}
                  currentUserId={user?.id}
                  onEditComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  requireAuth={requireAuth}
                />

                {visible.length > 0 && (
                  <div className="mt-2 ml-8 space-y-3">
                    {visible.map(r => {
                      const rid = getId(r);
                      return (
                        <CommentRow
                          key={rid}
                          c={r}
                          onReply={() => { setReplyToId(rid); setReplyText(""); }}
                          replying={replyToId === rid}
                          replyText={replyText}
                          setReplyText={setReplyText}
                          submitReply={() => submitReply(rid)}
                          posting={posting}
                          currentUserId={user?.id}
                          onEditComment={handleUpdateComment}
                          onDeleteComment={handleDeleteComment}
                          requireAuth={requireAuth}
                        />
                      );
                    })}

                    {repliesFlat.length > 2 && (
                      <button
                        className="text-xs opacity-80 hover:opacity-100"
                        onClick={() => setExpandedRoots(prev => ({ ...prev, [rootId]: !expanded }))}
                      >
                        {expanded ? "Ẩn bớt" : `Hiển thị thêm (${remaining})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            placeholder={isAuthenticated ? "Write a comment…" : "Login to comment"}
            className="flex-1 px-3 py-2 rounded-lg border"
            style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--input-border)" }}
          />
          <button
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--primary)", color: "white", opacity: newComment.trim() && !posting ? 1 : 0.6 }}
            onClick={submit}
            disabled={!newComment.trim() || posting}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  c,
  onReply,
  replying,
  replyText,
  setReplyText,
  submitReply,
  posting,
  currentUserId,
  onEditComment,
  onDeleteComment,
  requireAuth,
}: {
  c: CommentResponse;
  onReply: () => void;
  replying: boolean;
  replyText: string;
  setReplyText: (v: string) => void;
  submitReply: () => void;
  posting: boolean;
  currentUserId?: string | null;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  requireAuth: () => boolean;
}) {
  const router = useRouter();
  const prof = useProfile(c.authorProfileId);
  const commentId = getId(c);

  // Không fallback "User" nữa
  const username = prof.profile?.username || c.authorUsername || "";
  const displayName = prof.profile?.displayName || c.authorDisplayName || username;
  const avatar = prof.profile?.avatarUrl || c.authorAvatarUrl || "/avatar-default.svg";
  const authorId = prof.profile?.id || c.authorProfileId || null;
  const canManage = !!currentUserId && !!authorId && currentUserId === authorId;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(c.content ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>(
    () => buildCommentReactionCounts(c.reactions)
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    ((c.reactions?.currentUserReaction ?? null) as ReactionType | null)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerHoverTimers = useRef<{ open: number | null; close: number | null }>({ open: null, close: null });

  useEffect(() => {
    setDraft(c.content ?? "");
    setReactionCounts(buildCommentReactionCounts(c.reactions));
    setUserReaction((c.reactions?.currentUserReaction ?? null) as ReactionType | null);
    setPickerOpen(false);
    if (pickerHoverTimers.current.open) {
      window.clearTimeout(pickerHoverTimers.current.open);
      pickerHoverTimers.current.open = null;
    }
    if (pickerHoverTimers.current.close) {
      window.clearTimeout(pickerHoverTimers.current.close);
      pickerHoverTimers.current.close = null;
    }
  }, [c]);

  useEffect(() => {
    return () => {
      if (pickerHoverTimers.current.open) {
        window.clearTimeout(pickerHoverTimers.current.open);
        pickerHoverTimers.current.open = null;
      }
      if (pickerHoverTimers.current.close) {
        window.clearTimeout(pickerHoverTimers.current.close);
        pickerHoverTimers.current.close = null;
      }
    };
  }, []);

  const handleSaveEdit = async () => {
    const next = draft.trim();
    if (!next || saving) return;
    try {
      setSaving(true);
      await onEditComment(commentId, next);
      setIsEditing(false);
    } catch (e: any) {
      alert(e?.message || "Failed to update comment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");
    if (!confirmed) return;
    try {
      setDeleting(true);
      await onDeleteComment(commentId);
    } catch (e: any) {
      alert(e?.message || "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!requireAuth()) return;
    setPickerOpen(false);
    const previousReaction = userReaction;
    const previousCounts = { ...reactionCounts };
    const nextCounts = { ...reactionCounts };
    if (previousReaction) {
      nextCounts[previousReaction] = Math.max(0, (nextCounts[previousReaction] || 0) - 1);
    }
    if (previousReaction !== type) {
      nextCounts[type] = (nextCounts[type] || 0) + 1;
    }
    setReactionCounts(nextCounts);
    setUserReaction(previousReaction === type ? null : type);
    try {
      await commentAPI.toggleReaction(commentId, type);
    } catch (e: any) {
      setReactionCounts(previousCounts);
      setUserReaction(previousReaction);
      alert(e?.error || e?.message || "Failed to react to comment");
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const openPicker = (delay = 360) => {
    if (pickerHoverTimers.current.close) {
      window.clearTimeout(pickerHoverTimers.current.close);
      pickerHoverTimers.current.close = null;
    }
    if (pickerOpen) return;
    if (pickerHoverTimers.current.open) return;
    pickerHoverTimers.current.open = window.setTimeout(() => {
      setPickerOpen(true);
      if (pickerHoverTimers.current.open) {
        window.clearTimeout(pickerHoverTimers.current.open);
        pickerHoverTimers.current.open = null;
      }
    }, delay) as unknown as number;
  };

  const closePickerWithDelay = (ms = 140) => {
    if (pickerHoverTimers.current.open) {
      window.clearTimeout(pickerHoverTimers.current.open);
      pickerHoverTimers.current.open = null;
    }
    if (pickerHoverTimers.current.close) window.clearTimeout(pickerHoverTimers.current.close);
    pickerHoverTimers.current.close = window.setTimeout(() => {
      setPickerOpen(false);
      if (pickerHoverTimers.current.close) {
        window.clearTimeout(pickerHoverTimers.current.close);
        pickerHoverTimers.current.close = null;
      }
    }, ms) as unknown as number;
  };

  return (
    <div className="flex items-start gap-2">
      <ProfileHoverCard
        user={{
          id: prof.profile?.id || c.authorProfileId || c.id,
          username: username || "",
          name: displayName || username || "",
          avatarUrl: avatar,
          bio: prof.profile?.bio || undefined,
          followersCount: prof.profile?.stats?.followers,
          followingCount: prof.profile?.stats?.following,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={username || displayName || ""}
          className="w-8 h-8 rounded-full border cursor-pointer"
          onClick={() => router.push(`/profile/${prof.profile?.id || c.authorProfileId || c.id}`)}
        />
      </ProfileHoverCard>

      <div className="min-w-0 flex-1">
        <div className="text-xs">
          <span className="font-medium">{displayName}</span>
          {username && username !== displayName && <span className="opacity-70"> @{username}</span>}
          <span className="opacity-60"> · {new Date(c.createdAt).toLocaleString()}</span>
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--input-border)" }}
              disabled={saving}
            />
            <div className="flex items-center gap-2">
              <Button
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: "var(--primary)", color: "white", opacity: draft.trim() && !saving ? 1 : 0.6 }}
                disabled={!draft.trim() || saving}
                onClick={handleSaveEdit}
              >
                Lưu
              </Button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(c.content ?? "");
                }}
                style={{ border: "1px solid var(--border)", opacity: saving ? 0.6 : 1 }}
                disabled={saving}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm" style={{ color: "var(--text)" }}>
            {c.content}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <ReactionButton
            active={!!userReaction}
            emoji={userReaction ? COMMENT_REACTION_EMOJIS[userReaction] : COMMENT_REACTION_EMOJIS.Like}
            onPrimaryReact={() => handleReaction(userReaction ?? "Like")}
            pickerOpen={pickerOpen}
            onReact={handleReaction}
            onHoverStart={openPicker}
            onHoverEnd={closePickerWithDelay}
          />
          {totalReactions > 0 && (
            <span className="text-xs opacity-70">{totalReactions}</span>
          )}
          <button className="text-xs opacity-80 hover:opacity-100" onClick={onReply}>
            Trả lời
          </button>
          {canManage && !isEditing && (
            <>
              <button className="text-xs opacity-80 hover:opacity-100" onClick={() => setIsEditing(true)}>
                Sửa
              </button>
              <button
                className="text-xs text-red-500 hover:opacity-100"
                style={{ opacity: deleting ? 0.6 : 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xóa…" : "Xóa"}
              </button>
            </>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
              placeholder="Viết phản hồi…"
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
              style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--input-border)" }}
            />
            <Button
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: "var(--primary)", color: "white", opacity: replyText.trim() ? 1 : 0.6 }}
              disabled={!replyText.trim() || posting}
              onClick={submitReply}
            >
              Gửi
            </Button>
            <button
              className="px-2 py-1.5 rounded-lg text-xs"
              onClick={() => {
                setReplyText("");
                onReply();
              }}
              style={{ border: "1px solid var(--border)" }}
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReactionButton({
  active,
  emoji,
  onPrimaryReact,
  pickerOpen,
  onReact,
  onHoverStart,
  onHoverEnd,
}: {
  active: boolean;
  emoji: string;
  onPrimaryReact: () => void;
  pickerOpen: boolean;
  onReact: (type: ReactionType) => void;
  onHoverStart: () => void;
  onHoverEnd: (ms?: number) => void;
}) {
  return (
    <div
      className="relative inline-flex items-center gap-1 text-xs"
      onMouseEnter={onHoverStart}
      onMouseLeave={() => onHoverEnd(160)}
    >
      <button
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
          }`}
        onClick={onPrimaryReact}
        type="button"
      >
        <span className="text-base">
          {active ? (
            emoji
          ) : (
            <img src="/reaction-default.svg" alt="react" className="w-4 h-4" />
          )}
        </span>
      </button>

      {pickerOpen && (
        <div
          className="absolute left-1/2 bottom-full mb-1 z-10 flex gap-1 rounded-full bg-black/80 px-2 py-1 text-white"
          style={{ transform: "translate(-35%, 0)" }}
          onMouseEnter={onHoverStart}
          onMouseLeave={() => onHoverEnd(120)}
        >
          {COMMENT_REACTION_TYPES.map(type => (
            <button
              key={type}
              className="text-base hover:scale-110 transition"
              onClick={() => onReact(type)}
              title={type}
              type="button"
            >
              {COMMENT_REACTION_EMOJIS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
