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
  const [isConnected, setIsConnected] = useState(false);

  // Fetch conversations and calculate total unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
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
    if (!user || !user.id) {
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
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/chat`, {
        skipNegotiation: false,
        withCredentials: false,
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect({
        reconnectDelay: [0, 2000, 10000, 30000],
        maxRetries: 5
      })
      .configureLogging(LogLevel.Information)
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
        console.error("Error connecting to ChatHub:", error);
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
