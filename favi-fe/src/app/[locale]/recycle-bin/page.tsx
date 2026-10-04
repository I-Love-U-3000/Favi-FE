"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse, PagedResult } from "@/types";
import { useTranslations } from "next-intl";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";

export default function RecycleBinPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("RecycleBinPage");

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadRecycleBin = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await postAPI.getRecycleBin(1, 10);

        // Fetch full post data for each recycled post (including media)
        const recycledPosts = result.data || result.items || [];
        const fullPosts = await Promise.all(
          recycledPosts.map((post) => postAPI.getById(post.id))
        );

        setPosts(fullPosts);
        setPage(1);
        setHasNext(result.hasNext ?? false);
      } catch (e: any) {
        setError(e?.error || e?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadRecycleBin();
  }, [isAuthenticated, router, t]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await postAPI.getRecycleBin(nextPage, 10);
      const recycledPosts = result.data || result.items || [];
      const fullPosts = await Promise.all(
        recycledPosts.map((post) => postAPI.getById(post.id))
      );
      setPosts((prev) => [...prev, ...fullPosts]);
      setPage(result.page || nextPage);
      setHasNext(result.hasNext ?? false);
    } catch (e: any) {
      console.error("Failed to load more recycled posts:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRestore = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    if (!confirm(t("RestoreConfirm"))) return;

    try {
      setRestoring(prev => new Set(prev).add(postId));
      await postAPI.restore(postId);
      // Remove the restored post from the list
      setPosts(posts.filter(p => p.id !== postId));
      alert(t("PostRestored"));
    } catch (e: any) {
      alert(e?.error || e?.message || t("RestoreFailed"));
    } finally {
      setRestoring(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handlePermanentDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    if (!confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) return;

    try {
      setDeleting(prev => new Set(prev).add(postId));
      await postAPI.permanentDelete(postId);
      // Remove the deleted post from the list
      setPosts(posts.filter(p => p.id !== postId));
      alert("Post has been permanently deleted.");
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to delete post permanently.");
    } finally {
      setDeleting(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t("Title")}</h1>
            <p className="text-sm opacity-70">
              Các bài viết đã bị xoá sẽ được giữ ở đây trong 30 ngày.
            </p>
          </div>
          <div className="text-sm opacity-70">
            {posts.length} bài viết
          </div>
        </div>

        {/* Content */}
        {loading && (
          <PostSkeleton variant="card" count={6} />
        )}

        {error && (
          <div className="text-center py-12 text-sm text-red-500">
            <i className="pi pi-exclamation-triangle text-2xl mb-2" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-sm opacity-70">
            <i className="pi pi-inbox text-4xl mb-2" />
            <p>{t("Empty")}</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative rounded-xl overflow-hidden ring-1 ring-black/5 group"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {/* Buttons overlay */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => handleRestore(post.id, e)}
                    disabled={restoring.has(post.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                    style={{
                      backgroundColor: '#22c55e',
                      color: 'white'
                    }}
                  >
                    {restoring.has(post.id) ? (
                      <>
                        <i className="pi pi-spin pi-spinner" />
                      </>
                    ) : (
                      <>
                        <i className="pi pi-undo" />
                        {t("RestoreAction")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => handlePermanentDelete(post.id, e)}
                    disabled={deleting.has(post.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white'
                    }}
                  >
                    {deleting.has(post.id) ? (
                      <>
                        <i className="pi pi-spin pi-spinner" />
                      </>
                    ) : (
                      <>
                        <i className="pi pi-trash" />
                        Delete Forever
                      </>
                    )}
                  </button>
                </div>

                <PostCard post={post} />
              </div>
            ))}
            {loadingMore && (
              <PostSkeleton variant="card" count={3} wrap={false} />
            )}
          </div>

          {!loadingMore && hasNext && (
            <div className="mt-6 flex justify-center">
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
        </>
        )}
      </div>
    </div>
  );
}
