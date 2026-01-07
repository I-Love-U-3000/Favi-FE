"use client";

import { useRouter } from "next/navigation";
import { NotificationDto, NotificationType } from "@/types";

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkAsRead: (id: string) => Promise<boolean>;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    // Mark as read first, then navigate
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }

    // Navigate after marking as read
    if (notification.targetPostId) {
      router.push(`/posts/${notification.targetPostId}`);
    } else if (notification.type === NotificationType.Follow) {
      router.push(`/profile/${notification.actorUsername}`);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.Like:
        return "❤️";
      case NotificationType.Comment:
        return "💬";
      case NotificationType.Follow:
        return "👤";
      default:
        return "🔔";
    }
  };

  const timeAgo = new Date(notification.createdAt).toLocaleString();

  return (
    <style>{`.notif-item-panel:hover { background-color: var(--bg) !important; }`}</style>
    <div
      onClick={handleClick}
      className={`p-4 notif-item-panel transition-colors cursor-pointer ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
      style={{ color: "var(--text)" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          {notification.actorAvatarUrl && (
            <img
              src={notification.actorAvatarUrl}
              alt={notification.actorDisplayName || notification.actorUsername}
              className="w-10 h-10 rounded-full object-cover mb-2"
            />
          )}
          <p className="text-sm">
            <span className="font-semibold">
              @{notification.actorUsername}
            </span>{" "}
            {notification.message}
          </p>
          <p className="text-xs opacity-70 mt-1">{timeAgo}</p>
        </div>

        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
