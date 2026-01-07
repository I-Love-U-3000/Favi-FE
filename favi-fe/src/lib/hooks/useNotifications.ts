import { useState, useEffect, useCallback, useRef } from "react";
import { NotificationDto } from "@/types";
import notificationAPI from "@/lib/api/notificationAPI";
import { supabase } from "@/app/supabase-client";
import { useAuth } from "@/components/AuthProvider";

const NOTIFICATIONS_CHANNEL = "notifications";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, pageSize = 20) => {
    try {
      const data = await notificationAPI.getNotifications(page, pageSize);
      if (page === 1) {
        setNotifications(data.items);
      } else {
        setNotifications(prev => [...prev, ...data.items]);
      }
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return null;
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error("Error marking all as read:", error);
      return false;
    }
  }, []);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    // Create channel for notifications
    const channel = supabase
      .channel(`${NOTIFICATIONS_CHANNEL}:${user.id}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "broadcast",
        { event: "new-notification" },
        (payload) => {
          const notification = payload.payload as NotificationDto;
          console.log("New notification received:", notification);

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Optionally show browser notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(notification.message, {
              icon: notification.actorAvatarUrl || "/favicon.ico",
              badge: "/favicon.ico",
              tag: notification.id,
            });
          }
        }
      )
      .on(
        "broadcast",
        { event: "unread-count-updated" },
        (payload) => {
          const count = payload.payload as number;
          setUnreadCount(count);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          console.log("Notifications channel connected");
        }
      });

    channelRef.current = channel;

    // Initial fetch
    fetchUnreadCount();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}
