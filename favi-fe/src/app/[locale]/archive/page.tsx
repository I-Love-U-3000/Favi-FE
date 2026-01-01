"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import storyAPI from "@/lib/api/storyAPI";
import type { PostResponse, PagedResult, StoryResponse } from "@/types";
import { useTranslations } from "next-intl";
import PostCard from "@/components/PostCard";

export default function ArchivePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("ArchivePage");

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"posts" | "stories">("posts");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadArchived = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load archived posts
        const result: PagedResult<PostResponse> = await postAPI.getArchived(1, 50);

        // Fetch full post data for each archived post (including media)
        const archivedPosts = result.items || [];
        const fullPosts = await Promise.all(
          archivedPosts.map((post) => postAPI.getById(post.id))
        );

        setPosts(fullPosts);

        // Load archived stories
        const archivedStories = await storyAPI.getArchived();
        setStories(archivedStories);
      } catch (e: any) {
        setError(e?.error || e?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadArchived();
  }, [isAuthenticated, router, t]);

  const handleUnarchive = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    if (!confirm(t("UnarchiveConfirm"))) return;

    try {
      setUnarchiving(prev => new Set(prev).add(postId));
      await postAPI.unarchive(postId);
      // Remove the unarchived post from the list
      setPosts(posts.filter(p => p.id !== postId));
      alert(t("PostUnarchived"));
    } catch (e: any) {
      alert(e?.error || e?.message || t("UnarchiveFailed"));
    } finally {
      setUnarchiving(prev => {
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

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this story? This action cannot be undone.")) return;

    try {
      setDeleting(prev => new Set(prev).add(storyId));
      await storyAPI.delete(storyId);
      setStories(stories.filter(s => s.id !== storyId));
      alert("Story has been permanently deleted.");
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to delete story permanently.");
    } finally {
      setDeleting(prev => {
        const next = new Set(prev);
        next.delete(storyId);
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
              Các bài viết đã lưu trữ sẽ không hiển thị trên bảng feed của bạn.
            </p>
          </div>
          <div className="text-sm opacity-70">
            {posts.length + stories.length} items
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-neutral-700"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "stories"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-neutral-700"
            }`}
          >
            Stories ({stories.length})
          </button>
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

        {!loading && !error && activeTab === "posts" && posts.length === 0 && (
          <div className="text-center py-12 text-sm opacity-70">
            <i className="pi pi-inbox text-4xl mb-2" />
            <p>No archived posts</p>
          </div>
        )}

        {!loading && !error && activeTab === "stories" && stories.length === 0 && (
          <div className="text-center py-12 text-sm opacity-70">
            <i className="pi pi-inbox text-4xl mb-2" />
            <p>No archived stories</p>
          </div>
        )}

        {/* Posts Grid */}
        {!loading && !error && activeTab === "posts" && posts.length > 0 && (
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
                    onClick={(e) => handleUnarchive(post.id, e)}
                    disabled={unarchiving.has(post.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white'
                    }}
                  >
                    {unarchiving.has(post.id) ? (
                      <>
                        <i className="pi pi-spin pi-spinner" />
                      </>
                    ) : (
                      <>
                        <i className="pi pi-undo" />
                        {t("UnarchiveAction")}
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
          </div>
        )}

        {/* Stories Grid */}
        {!loading && !error && activeTab === "stories" && stories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="relative aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-black/5 group"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {/* Story media */}
                {story.mediaUrl.endsWith('.mp4') || story.mediaUrl.endsWith('.mov') || story.mediaUrl.endsWith('.webm') ? (
                  <video
                    src={story.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.thumbnailUrl || story.mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Delete button overlay */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDeleteStory(story.id, e)}
                    disabled={deleting.has(story.id)}
                    className="px-2 py-1 rounded-lg text-xs font-medium shadow-lg disabled:opacity-50 flex items-center gap-1"
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white'
                    }}
                  >
                    {deleting.has(story.id) ? (
                      <i className="pi pi-spin pi-spinner" />
                    ) : (
                      <i className="pi pi-trash" />
                    )}
                  </button>
                </div>

                {/* Time overlay */}
                <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                  {new Date(story.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
