import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import profileAPI from "@/lib/api/profileAPI";

/**
 * Hook to periodically send heartbeat to update user's online status.
 * This should be used at the root level of the app (e.g., in layout or root provider)
 * to ensure the user's LastActiveAt timestamp is updated while they're active.
 *
 * @param intervalMs - Heartbeat interval in milliseconds (default: 2 minutes)
 */
export function useHeartbeat(intervalMs: number = 2 * 60 * 1000) {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only start heartbeat if user is authenticated
    if (!user) {
      // Clear interval if user logs out
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await profileAPI.heartbeat();
      } catch (error) {
        // Silently fail - heartbeat is not critical
        console.debug("Heartbeat failed:", error);
      }
    };

    // Send heartbeat immediately when user is detected
    sendHeartbeat();

    // Set up interval
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, intervalMs);

    // Cleanup on unmount or when user changes
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [user, intervalMs]);
}
