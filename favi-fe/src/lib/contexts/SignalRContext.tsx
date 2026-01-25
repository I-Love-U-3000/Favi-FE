"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "@/components/AuthProvider";
import { NotificationDto, PagedResult } from "@/types";
import notificationAPI from "@/lib/api/notificationAPI";
import { toast } from "@/hooks/use-toast";

interface SignalRContextValue {
  notifications: NotificationDto[];
  unreadCount: number;
  isConnected: boolean;
  fetchNotifications: (page?: number, pageSize?: number) => Promise<PagedResult<NotificationDto> | undefined>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
}

const SignalRContext = createContext<SignalRContextValue | undefined>(undefined);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const connectionRef = useRef<ReturnType<typeof HubConnectionBuilder> | null>(null);
  const isInitializedRef = useRef<string | null>(null); // Track userId to prevent duplicate connections

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, pageSize = 20) => {
    if (!user || !user.id) {
      console.warn("Cannot fetch notifications: user not authenticated");
      return undefined;
    }
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
      return undefined;
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user || !user.id) {
      console.warn("Cannot fetch unread count: user not authenticated");
      return;
    }
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
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
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error("Error marking all as read:", error);
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // Find the notification before deleting to check if it was unread
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      const wasUnread = notificationToDelete?.isRead === false;

      await notificationAPI.deleteNotification(notificationId);

      // Update both notifications and potentially unread count in one go
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== notificationId);

        // If the deleted notification was unread, update unread count
        if (wasUnread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }

        return filtered;
      });

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  };

  // Setup SignalR connection (only once)
  useEffect(() => {
    if (!user || !user.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      isInitializedRef.current = null;
      return;
    }

    // Prevent multiple connections for the same user
    if (isInitializedRef.current === user.id && connectionRef.current) {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      console.warn("No access token found for SignalR connection");
      return;
    }

    // Mark this user as initialized
    isInitializedRef.current = user.id;

    // Build connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_HUB_URL}/notificationHub`, {
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging({
        log: (logLevel, message) => {
          // Filter out expected cleanup errors to reduce console noise
          if (message.includes('stopped during negotiation') || 
              message.includes('Failed to start the connection') ||
              message.includes('connection was stopped')) {
            return; // Don't log these expected errors
          }
          console.log(`[SignalR ${LogLevel[logLevel]}]`, message);
        }
      })
      .build();

    // Set up event handlers
    connection.on("ReceiveNotification", (notification: NotificationDto) => {
      console.log("New notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast({
        title: "New notification",
        description: notification.message,
      });

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
      fetchNotifications();
      fetchUnreadCount();
    });

    // Start connection
    connection
      .start()
      .then(() => {
        console.log("NotificationHub connected");
        setIsConnected(true);
        fetchNotifications();
        fetchUnreadCount();
      })
      .catch((error: Error) => {
        // Silently ignore errors during cleanup (stopped during negotiation)
        if (error?.message?.includes('stopped') || error?.message?.includes('negotiation')) {
          // Expected error during cleanup, don't log
          return;
        }
        console.error("Error connecting to NotificationHub:", error);
        setIsConnected(false);
      });

    connectionRef.current = connection;

    // Cleanup on unmount
    return () => {
      // Stop the old connection safely
      if (connectionRef.current) {
        const oldConnection = connectionRef.current;
        connectionRef.current = null;
        // Stop the connection and ignore any errors during cleanup
        oldConnection.stop().catch((err) => {
          // Silently ignore errors during cleanup to prevent console spam
          if (err && typeof err === 'object' && 'message' in err) {
            const msg = (err as { message: string }).message;
            // Only log unexpected errors, not expected cleanup errors
            if (!msg.includes('stopped') && !msg.includes('negotiation')) {
              console.warn("SignalR cleanup warning:", msg);
            }
          }
        });
      }
      isInitializedRef.current = null;
    };
  }, [user?.id]);

  const value: SignalRContextValue = {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

export function useSignalRContext() {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalRContext must be used within a SignalRProvider");
  }
  return context;
}
