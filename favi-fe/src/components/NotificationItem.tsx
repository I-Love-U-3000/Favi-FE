"use client";

import Link from "next/link";
import { NotificationDto, NotificationType } from "@/types";

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getNotificationLink = () => {
    if (notification.targetPostId) {
      return `/posts/${notification.targetPostId}`;
    }
    if (notification.type === NotificationType.Follow) {
      return `/profile/${notification.actorUsername}`;
    }
    return "#";
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
    <Link href={getNotificationLink()} onClick={handleClick}>
      <div
        className={`p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
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
    </Link>
  );
}
