"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse, PagedResult } from "@/types";
import { useTranslations } from "next-intl";
import PostCard from "@/components/PostCard";

export default function RecycleBinPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("RecycleBinPage");

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadRecycleBin = async () => {
      setLoading(true);
      setError(null);
      try {
        const result: PagedResult<PostResponse> = await postAPI.getRecycleBin(1, 50);
        setPosts(result.items || []);
      } catch (e: any) {
        setError(e?.error || e?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadRecycleBin();
  }, [isAuthenticated, router, t]);

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
          <div className="text-center py-12 text-sm opacity-70">
            <i className="pi pi-spin pi-spinner text-2xl mb-2" />
            <p>{t("Loading")}</p>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative rounded-xl overflow-hidden ring-1 ring-black/5 group"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {/* Restore button overlay */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>

                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
