"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "primereact/button";
import { useSignalRContext } from "@/lib/contexts/SignalRContext";
import { NotificationType } from "@/types";

type FilterType = NotificationType | "all";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useSignalRContext();
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await fetchNotifications(1, 10);
      if (result) {
        setHasMore(result.hasNext ?? false);
        setPage(1);
      }
    })();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchNotifications(nextPage, 10);
      if (result) {
        setHasMore(result.hasNext ?? false);
        setPage(result.page || nextPage);
      }
    } catch (e: any) {
      console.error("Failed to load more notifications:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : n.type === filter
  );

  function open(notification: any) {
    markAsRead(notification.id);
    // Navigate by type
    if (notification.targetPostId) {
      router.push(`/posts/${notification.targetPostId}`);
      return;
    }
    if (notification.type === NotificationType.Follow) {
      router.push(`/profile/${encodeURIComponent(notification.actorUsername)}`);
      return;
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button label="Mark all read" className="p-button-text" onClick={markAllAsRead} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", NotificationType.Like, NotificationType.Comment, NotificationType.Follow] as FilterType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs rounded-full ${filter === t ? "bg-black/10" : "bg-black/5"}`}
            style={{ border: "1px solid var(--border)" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 opacity-70">No notifications</div>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className="flex items-center justify-between rounded-xl p-3 w-full text-left hover:opacity-100"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                opacity: n.isRead ? 0.7 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                {n.actorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.actorAvatarUrl} alt={n.actorUsername} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {n.actorUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <div className="text-sm">
                    <b>@{n.actorUsername}</b> {n.message}
                  </div>
                  <div className="text-xs opacity-70">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
            </button>
          ))
        )}

        {hasMore && filtered.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary, #3b82f6)",
                color: "white",
              }}
            >
              {loadingMore ? (
                <>
                  <i className="pi pi-spin pi-spinner text-sm" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load more</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
