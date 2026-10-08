"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { useSignalRContext } from "@/lib/contexts/SignalRContext";
import { NotificationDto, NotificationType } from "@/types";
import { notificationTypeToString } from "@/types";
import { useTranslations } from "next-intl";

interface NotificationDialogProps {
  visible: boolean;
  onHide: () => void;
}

export default function NotificationDialog({ visible, onHide }: NotificationDialogProps) {
  const router = useRouter();
  const t = useTranslations("Notifications");
  const { notifications, unreadCount, isConnected, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllRead } = useSignalRContext();
  const [isDeletingRead, setIsDeletingRead] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (visible) {
      setPage(1);
      (async () => {
        const result = await fetchNotifications(1, 10);
        if (result) {
          setHasMore(result.hasNext ?? false);
        }
      })();
    }
  }, [visible]);

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
            <span className="font-semibold">{t("Title")}</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                label={t("MarkAllRead")}
                className="p-button-text p-button-sm text-xs"
                onClick={markAllAsRead}
              />
            )}
            {notifications.some(n => n.isRead) && (
              <Button
                label={t("DeleteRead")}
                icon={isDeletingRead ? "pi pi-spin pi-spinner" : "pi pi-trash"}
                disabled={isDeletingRead}
                className="p-button-text p-button-sm p-button-danger text-xs rounded-lg"
                onClick={() => {
                  confirmDialog({
                    message: t("DeleteAllReadConfirm"),
                    header: t("DeleteRead"),
                    icon: "pi pi-exclamation-triangle",
                    acceptClassName: "p-button-danger rounded-xl px-4 py-2 text-sm",
                    rejectClassName: "p-button-text rounded-xl px-4 py-2 text-sm",
                    accept: async () => {
                      setIsDeletingRead(true);
                      await deleteAllRead();
                      setIsDeletingRead(false);
                    },
                  });
                }}
              />
            )}
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isConnected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500 shadow-sm shadow-rose-500/50"
              }`}
              title={isConnected ? t("Connected") : t("Disconnected")}
            />
          </div>
        </div>
      }
      style={{ width: "90vw", maxWidth: "600px", height: "80vh" }}
      className="rounded-2xl overflow-hidden shadow-2xl"
      contentClassName="!p-0"
      headerClassName="!py-3.5 !px-5 border-b"
    >
      <style>{`.notif-item:hover { background-color: var(--bg-hover) !important; }`}</style>
      <div className="flex flex-col h-full" style={{ color: "var(--text)" }}>
        {/* Unread count banner */}
        {unreadCount > 0 && (
          <div
            className="px-4 py-2 text-xs font-semibold text-center tracking-wide"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            {t("UnreadBanner", { count: unreadCount })}
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-64 opacity-70">
              <div className="text-center">
                <i className="pi pi-bell text-4xl mb-2" />
                <p>{t("Empty")}</p>
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
                    backgroundColor: !notification.isRead ? "var(--primary-subtle, rgba(37, 99, 235, 0.08))" : "transparent",
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <div className="p-4 flex justify-center border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 rounded-full font-medium text-xs transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary, #3b82f6)",
                  color: "white",
                }}
              >
                {loadingMore ? (
                  <>
                    <i className="pi pi-spin pi-spinner text-xs" />
                    <span>{t("Loading")}</span>
                  </>
                ) : (
                  <span>{t("LoadMore")}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
