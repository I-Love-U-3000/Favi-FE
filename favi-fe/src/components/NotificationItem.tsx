"use client";

import { useRouter } from "next/navigation";
import { NotificationDto, NotificationType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = async () => {
    // Mark as read first, then navigate
    if (!notification.isRead) {
      const success = await onMarkAsRead(notification.id);
      if (success) {
        toast({
          title: "Marked as read",
          description: "Notification marked as read",
        });
      }
    }

    // Navigate after marking as read
    if (notification.targetPostId) {
      router.push(`/posts/${notification.targetPostId}`);
    } else if (notification.type === NotificationType.Follow) {
      router.push(`/profile/${notification.actorUsername}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the click handler

    if (!onDelete) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(notification.id);
      if (success) {
        toast({
          title: "Deleted",
          description: "Notification has been deleted",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      className={`relative p-4 notif-item-panel transition-colors cursor-pointer border-b ${
        !notification.isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : "opacity-70"
      }`}
      style={{
        color: "var(--text)",
        borderColor: "var(--border)"
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={handleClick}>
          <p className="text-sm">
            <span className="font-semibold">
              @{notification.actorUsername}
            </span>{" "}
            {notification.message}
          </p>
          <p className="text-xs opacity-70 mt-1">{timeAgo}</p>
        </div>

        {/* Right side: Delete button and unread indicator */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Check className="w-3 h-3 text-blue-500" />
            </div>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
              title="Delete notification"
            >
              {isDeleting ? (
                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
