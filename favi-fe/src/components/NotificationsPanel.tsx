"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { NotificationItem } from "@/components/NotificationItem";

export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMoreNotifications();
  }, []);

  const loadMoreNotifications = async () => {
    const result = await fetchNotifications(page, 20);
    if (result) {
      setHasMore(result.items.length + notifications.length < result.totalCount);
    }
  };

  return (
    <div className="relative" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            )}
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>
        {unreadCount > 0 && (
          <p className="text-sm opacity-70 mt-1">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center opacity-70">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        )}

        {hasMore && notifications.length > 0 && (
          <button
            onClick={() => {
              setPage((p) => p + 1);
              loadMoreNotifications();
            }}
            className="w-full p-3 text-center text-sm text-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
