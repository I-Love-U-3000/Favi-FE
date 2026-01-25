import { useState, useEffect, useCallback, useRef } from "react";
import { ConversationSummaryResponse } from "@/types";
import chatAPI from "@/lib/api/chatAPI";
import { useAuth } from "@/components/AuthProvider";
import * as signalR from "@microsoft/signalr";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export function useSignalRChat() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const initializedRef = useRef<string | null>(null); // Track initialized userId to prevent duplicate connections
  const [isConnected, setIsConnected] = useState(false);

  // Fetch conversations and calculate total unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !user.id) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await chatAPI.getConversations(1, 100);
      // Sum up unreadCount from all conversations
      const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
      return total;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return 0;
    }
  }, [user]);

  // Setup SignalR connection
  useEffect(() => {
    // Guard: Don't connect if no user
    if (!user || !user.id) {
      setUnreadCount(0);
      setIsConnected(false);
      initializedRef.current = null;
      return;
    }

    // Guard: Don't create a new connection if we already have one for this user
    if (initializedRef.current === user.id && connectionRef.current) {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      console.warn("No access token found for SignalR connection");
      return;
    }

    // Mark this user as initialized
    initializedRef.current = user.id;

    // Custom logger to filter out cleanup errors
    // Build connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_HUB_URL}/chatHub`, {
        skipNegotiation: false,
        withCredentials: false,
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect({
        reconnectDelay: [0, 2000, 10000, 30000],
        maxRetries: 5
      })
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

    // Listen for new messages - update unread count
    connection.on("ReceiveMessage", (message) => {
      console.log("New message received:", message);
      // Refresh unread count when new message arrives
      fetchUnreadCount();
    });

    // Listen for message read events - update unread count
    connection.on("MessageRead", (data) => {
      console.log("Message read event:", data);
      // Refresh unread count when someone reads a message
      fetchUnreadCount();
    });

    connection.onclose(async (error?) => {
      console.log("ChatHub connection closed:", error);
      setIsConnected(false);
    });

    connection.onreconnecting(async (error?) => {
      console.log("ChatHub reconnecting:", error);
      setIsConnected(false);
    });

    connection.onreconnected(async (connectionId?: string | null) => {
      console.log("ChatHub reconnected, connectionId:", connectionId);
      setIsConnected(true);
      // Refresh unread count after reconnect
      fetchUnreadCount();
    });

    // Start connection
    connection
      .start()
      .then(() => {
        console.log("ChatHub connected");
        setIsConnected(true);
        // Initial fetch after connection
        fetchUnreadCount();
      })
      .catch((error: Error) => {
        // Silently ignore errors during cleanup (connection stopped while starting/negotiating)
        const errorMsg = error?.message || '';
        if (errorMsg.includes('stopped') || errorMsg.includes('negotiation') || errorMsg.includes('Failed to start')) {
          // Expected error during cleanup, don't log
          return;
        }
        console.error("Error connecting to ChatHub:", error);
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
    };
  }, [user?.id, fetchUnreadCount]);

  // Fallback periodic refresh (every 30 seconds instead of 10)
  useEffect(() => {
    if (!isConnected || !user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, user, fetchUnreadCount]);

  return {
    unreadCount,
    isConnected,
    fetchUnreadCount,
  };
}
