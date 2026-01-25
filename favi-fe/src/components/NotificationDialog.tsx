"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useSignalRContext } from "@/lib/contexts/SignalRContext";
import { NotificationDto, NotificationType } from "@/types";
import { notificationTypeToString } from "@/types";

interface NotificationDialogProps {
  visible: boolean;
  onHide: () => void;
}

export default function NotificationDialog({ visible, onHide }: NotificationDialogProps) {
  const router = useRouter();
  const { notifications, unreadCount, isConnected, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useSignalRContext();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (visible && page === 1) {
      loadMoreNotifications();
    }
  }, [visible]);

  const loadMoreNotifications = async () => {
    const result = await fetchNotifications(page, 20);
    if (result) {
      setHasMore(result.items.length + notifications.length < result.totalCount);
    }
  };

  const getIcon = (type: number | NotificationType) => {
    switch (Number(type)) {
      case 0:
      case NotificationType.Like:
        return "❤️";
      case 1:
      case NotificationType.Comment:
        return "💬";
      case 2:
      case NotificationType.Follow:
        return "👤";
      default:
        return "🔔";
    }
  };

  const handleClickNotification = async (notification: NotificationDto) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.targetPostId) {
      // If it's a comment notification, add the commentId to scroll and highlight
      if (notification.targetCommentId) {
        router.push(`/posts/${notification.targetPostId}?comment=${encodeURIComponent(notification.targetCommentId)}`);
      } else {
        router.push(`/posts/${notification.targetPostId}`);
      }
    } else if (notification.type === NotificationType.Follow || notification.type === 2) {
      router.push(`/profile/${encodeURIComponent(notification.actorUsername)}`);
    }

    // Close dialog
    onHide();
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent triggering the notification click


    try {
      const success = await deleteNotification(notificationId);
      if (success) {
        console.log("Notification deleted");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getFilterLabel = (type: number | NotificationType) => {
    switch (Number(type)) {
      case 0:
      case NotificationType.Like:
        return "Likes";
      case 1:
      case NotificationType.Comment:
        return "Comments";
      case 2:
      case NotificationType.Follow:
        return "Follows";
      default:
        return "All";
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <i className="pi pi-bell text-xl" />
            <span className="font-semibold">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                label="Mark all read"
                className="p-button-text p-button-sm"
                onClick={markAllAsRead}
              />
            )}
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>
      }
      style={{ width: "90vw", maxWidth: "600px", height: "80vh" }}
      className="rounded-xl"
      contentClassName="!p-0"
      headerClassName="!py-3 !px-4 border-b"
    >
      <style>{`.notif-item:hover { background-color: var(--bg) !important; }`}</style>
      <div className="flex flex-col h-full" style={{ color: "var(--text)" }}>
        {/* Unread count banner */}
        {unreadCount > 0 && (
          <div
            className="px-4 py-2 text-sm text-center"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-64 opacity-70">
              <div className="text-center">
                <i className="pi pi-bell text-4xl mb-2" />
                <p>No notifications yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleClickNotification(notification)}
                  className="w-full text-left notif-item transition-colors cursor-pointer"
                  style={{
                    backgroundColor: !notification.isRead ? "var(--bg-highlight)" : "transparent",
                  }}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getIcon(notification.type)}
                    </div>

                    {notification.actorAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={notification.actorAvatarUrl}
                        alt={notification.actorDisplayName || notification.actorUsername}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">@{notification.actorUsername}</span>
                        {" "}
                        {notification.message}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      {deleteNotification && (
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete notification"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500">
                            <path d="M18 6 6 12 12 12 12-6 6 12 12"></path>
                            <path d="M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <button
              onClick={() => {
                setPage((p) => p + 1);
                loadMoreNotifications();
              }}
              className="w-full p-3 text-center text-sm notif-item transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
