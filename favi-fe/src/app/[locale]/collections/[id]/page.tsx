"use client";

import { useEffect, useMemo, useState, use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "primereact/badge";
import { Button } from "primereact/button";

import { useAuth } from "@/components/AuthProvider";
import { useOverlay } from "@/components/RootProvider";
import CollectionReactionButton from "@/components/CollectionReactionButton";
import CollectionReactorsDialog from "@/components/CollectionReactorsDialog";

import collectionAPI from "@/lib/api/collectionAPI";
import postAPI from "@/lib/api/postAPI"; // ⚠️ đổi path nếu bạn khác

import type { CollectionResponse, PhotoPost } from "@/types";

type Props = { params: Promise<{ id: string }> };

const FALLBACK_COVER =
  "https://via.placeholder.com/1200x400/111827/ffffff?text=Collection";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function formatPrivacyLevel(level: number): string {
  if (level === 0) return "Public";
  if (level === 1) return "Followers";
  if (level === 2) return "Private";
  return "Public";
}

// Map "bất kỳ response post nào" -> PhotoPost
function mapToPhotoPost(p: any, fallbackId: string): PhotoPost | null {
  if (!p) return null;

  const id = p.id ?? fallbackId;
  const imageUrl =
    p.imageUrl ||
    p.thumbnailUrl ||
    p.coverUrl ||
    p.medias?.[0]?.url ||
    p.medias?.[0]?.thumbnailUrl ||
    p.mediaUrls?.[0] ||
    "";

  // width/height: cố gắng lấy đúng, không có thì fallback 1:1
  const width = Number(p.width ?? p.mediaWidth ?? p.medias?.[0]?.width ?? 1) || 1;
  const height = Number(p.height ?? p.mediaHeight ?? p.medias?.[0]?.height ?? 1) || 1;

  // Tags: extract name from TagDto objects or use as-is if strings
  const tags = Array.isArray(p.tags)
    ? p.tags.map((t: any) => typeof t === "string" ? t : t?.name).filter(Boolean)
    : [];

  return {
    id,
    imageUrl: imageUrl || FALLBACK_COVER,
    alt: p.caption ?? p.alt ?? "",
    width,
    height,
    createdAtISO: p.createdAtISO ?? p.createdAt ?? new Date().toISOString(),
    likeCount: Number(p.likeCount ?? p.reactions?.total ?? 0) || 0,
    commentCount: Number(p.commentCount ?? p.commentsCount ?? 0) || 0,
    tags,
  };
}

export default function CollectionDetail({ params }: Props) {
  const { id } = use(params);
  const { user } = useAuth();
  const { openCollectionComposer, openAddToCollectionDialog } = useOverlay();

  const [loading, setLoading] = useState(true);
  const [coll, setColl] = useState<CollectionResponse | null>(null);
  const [posts, setPosts] = useState<PhotoPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reactorsDialogOpen, setReactorsDialogOpen] = useState(false);

  const privacyLabel = useMemo(() => {
    if (!coll) return "";
    return formatPrivacyLevel(coll.privacyLevel);
  }, [coll]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const c = (await collectionAPI.getById(id)) as CollectionResponse | null;

        if (!alive) return;

        if (!c?.id) {
          setColl(null);
          setPosts([]);
          setLoading(false);
          return;
        }

        setColl(c);

        const ids = c.postIds ?? [];
        if (ids.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // ✅ Fetch từng post theo id (có thể tối ưu bằng batch endpoint)
        const results = await Promise.all(
          ids.map(async (pid) => {
            try {
              const p: any = await postAPI.getById(pid); // ⚠️ đổi theo API của bạn
              return mapToPhotoPost(p, pid);
            } catch {
              return null;
            }
          })
        );

        if (!alive) return;

        setPosts(results.filter(Boolean) as PhotoPost[]);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;

        const status = e?.status || e?.response?.status;
        if (status === 404) {
          setColl(null);
          setPosts([]);
          setLoading(false);
          return;
        }

        setError(e?.error || e?.message || "Failed to load collection");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (!loading && !coll) notFound();

  const isOwner = useMemo(() => {
    if (!coll?.ownerProfileId || !user?.id) return false;
    return user.id === coll.ownerProfileId;
  }, [coll, user]);

  const cover = coll?.coverImageUrl?.trim() ? coll.coverImageUrl : FALLBACK_COVER;

  return (
    <div className="min-h-screen" style={{ color: "var(--text)" }}>
      {/* Cover + header */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={coll?.title || "collection"} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {isOwner && !loading && coll && (
          <div className="absolute top-4 right-4">
            <Button
              label="Edit Collection"
              icon="pi pi-pencil"
              rounded
              onClick={() => openCollectionComposer(coll as any)}
              className="bg-white text-black hover:bg-gray-100"
            />
          </div>
        )}

        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-2xl font-semibold">{loading ? "Loading..." : coll?.title}</h1>
          {!loading && coll && (
            <div className="text-xs opacity-90 mt-1">
              {coll.postCount} posts • Created {formatDate(coll.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="mx-auto max-w-6xl px-6 mt-4 flex items-center justify-between gap-3">
        <div className="text-sm opacity-80">
          {coll?.description ? coll.description : ""}
        </div>
        <div className="flex items-center gap-3">
          {!loading && coll && (
            <CollectionReactionButton
              collectionId={coll.id}
              reactions={coll.reactions ?? undefined}
              onReactionChange={(newReactions) => {
                setColl({ ...coll, reactions: newReactions ?? undefined });
              }}
              onCountClick={() => setReactorsDialogOpen(true)}
              size="normal"
              showCount={true}
            />
          )}
          {!loading && coll && (
            <span
              className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary, #fff)" }}
            >
              {privacyLabel}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      <div className="mx-auto max-w-6xl px-6 mt-6">
        {!loading && error && (
          <div
            className="rounded-xl border p-4 flex items-center justify-between gap-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary, #fff)" }}
          >
            <div>
              <div className="font-semibold">Không tải được collection</div>
              <div className="text-sm opacity-80">{error}</div>
            </div>
            <Button label="Retry" icon="pi pi-refresh" onClick={() => location.reload()} />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 mt-6 pb-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden ring-1 ring-black/5 animate-pulse"
                style={{ backgroundColor: "var(--border)" }}
              >
                <div className="h-48" />
                <div className="h-10" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 && !error ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary, #fff)" }}
          >
            <div className="text-lg font-semibold">Chưa có bài viết</div>
            <div className="text-sm opacity-75 mt-1">Thêm post vào collection để hiển thị ở đây.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((p) => {
              // giữ đúng tỉ lệ ảnh: dùng aspect-ratio theo width/height
              const ratio = `${p.width} / ${p.height}`;

              const handleAddToCollection = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                openAddToCollectionDialog(p.id);
              };

              const handleRemoveFromCollection = async (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const confirmed = window.confirm("Remove this post from the collection?");
                if (!confirmed) return;

                try {
                  await collectionAPI.removePost(id, p.id);
                  // Refresh collection data to update post list
                  const updated = await collectionAPI.getById(id);
                  if (updated) {
                    setColl(updated);
                    const ids = updated.postIds ?? [];
                    if (ids.length === 0) {
                      setPosts([]);
                      return;
                    }
                    const results = await Promise.all(
                      ids.map(async (pid) => {
                        try {
                          const post: any = await postAPI.getById(pid);
                          return mapToPhotoPost(post, pid);
                        } catch {
                          return null;
                        }
                      })
                    );
                    setPosts(results.filter(Boolean) as PhotoPost[]);
                  }
                } catch (error: any) {
                  console.error("Error removing post from collection:", error);
                  alert(error?.error || error?.message || "Failed to remove post from collection");
                }
              };

              return (
                <div key={p.id} className="group block rounded-xl overflow-hidden ring-1 ring-black/5" style={{ backgroundColor: "var(--bg-secondary, #fff)" }}>
                  <Link href={`/posts/${p.id}`} className="block">
                    <div className="w-full" style={{ aspectRatio: ratio }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt={p.alt ?? ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="px-3 py-2 text-xs flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-3 opacity-90">
                        <span className="inline-flex items-center gap-1">
                          <i className="pi pi-heart" /> {p.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <i className="pi pi-comments" /> {p.commentCount}
                        </span>
                      </div>

                      <div className="flex gap-1 max-w-[55%] justify-end overflow-hidden items-center">
                        <button
                          type="button"
                          onClick={handleAddToCollection}
                          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          title="Add to collection"
                        >
                          <i className="pi pi-bookmark text-sm" />
                        </button>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={handleRemoveFromCollection}
                            className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                            title="Remove from collection"
                          >
                            <i className="pi pi-times text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {coll && (
        <CollectionReactorsDialog
          visible={reactorsDialogOpen}
          onHide={() => setReactorsDialogOpen(false)}
          collectionId={coll.id}
        />
      )}
    </div>
  );
}