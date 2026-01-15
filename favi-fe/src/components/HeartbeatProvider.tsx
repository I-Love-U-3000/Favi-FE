"use client";

import { useHeartbeat } from "@/lib/hooks/useHeartbeat";

/**
 * Client component that enables heartbeat for online status tracking.
 * This component should be included in the app layout to ensure the user's
 * LastActiveAt timestamp is updated periodically while they're active.
 */
export function HeartbeatProvider() {
  // Send heartbeat every 1 minute to update online status (faster response)
  useHeartbeat(1 * 60 * 1000);

  // This component doesn't render anything
  return null;
}
