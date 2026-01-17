import { useState, useEffect, useCallback, useRef } from "react";
import { ConversationSummaryResponse } from "@/types";
import chatAPI from "@/lib/api/chatAPI";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/app/supabase-client";

export function useChat() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  // Fetch conversations and calculate total unread count - exactly like chat page does
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await chatAPI.getConversations(1, 100);
      // Sum up unreadCount from all conversations - same as chat page
      const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
      return total;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return 0;
    }
  }, [user]);

  // Setup: listen for refresh event from chat page + periodic refresh
  useEffect(() => {
    if (!user) return;

    // Listen for chat page telling us to refresh
    const channel = supabase
      .channel(`navbar-chat-updates:${user.id}`)
      .on("broadcast", { event: "refresh-chat-count" }, async () => {
        await fetchUnreadCount();
      })
      .subscribe();

    channelRef.current = channel;

    // Initial fetch
    fetchUnreadCount();

    // Also refresh every 10 seconds as fallback
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(interval);
    };
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    fetchUnreadCount,
  };
}
