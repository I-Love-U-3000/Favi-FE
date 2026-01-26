import { useState, useEffect, useCallback, useRef } from "react";
import { NotificationDto } from "@/types";
import notificationAPI from "@/lib/api/notificationAPI";
import { useAuth } from "@/components/AuthProvider";
import * as signalR from "@microsoft/signalr";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export function useSignalRNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

  // Setup SignalR connection
  useEffect(() => {
    if (!user || !user.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      console.warn("No access token found for SignalR connection");
      return;
    }

    // Build connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_HUB_URL}/notificationHub`, {
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    // Set up event handlers
    connection.on("ReceiveNotification", (notification: NotificationDto) => {
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
    });

    connection.on("UnreadCountUpdated", (count: number) => {
      console.log("Unread count updated:", count);
      setUnreadCount(count);
    });

    connection.onclose(async (error?) => {
      console.log("NotificationHub connection closed:", error);
      setIsConnected(false);
    });

    connection.onreconnecting(async (error?) => {
      console.log("NotificationHub reconnecting:", error);
      setIsConnected(false);
    });

    connection.onreconnected(async (connectionId?: string | null) => {
      console.log("NotificationHub reconnected, connectionId:", connectionId);
      setIsConnected(true);
      // Refresh notifications after reconnect
      fetchNotifications();
      fetchUnreadCount();
    });

    // Start connection
    connection
      .start()
      .then(() => {
        console.log("NotificationHub connected");
        setIsConnected(true);
        // Initial fetch after connection
        fetchNotifications();
        fetchUnreadCount();
      })
      .catch((error: Error) => {
        console.error("Error connecting to NotificationHub:", error);
        setIsConnected(false);
      });

    connectionRef.current = connection;

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(console.error);
        connectionRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications, fetchUnreadCount]);

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
