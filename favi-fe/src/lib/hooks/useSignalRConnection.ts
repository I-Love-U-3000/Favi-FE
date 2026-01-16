import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

/**
 * Options for configuring the SignalR connection
 */
export interface SignalRConnectionOptions {
  /** Whether to enable the connection (default: true) */
  enabled?: boolean;
  /** Automatic reconnect delay in milliseconds (default: [0, 2000, 10000]) */
  reconnectDelays?: number[];
  /** Server timeout in milliseconds (default: 30000) */
  serverTimeout?: number;
  /** Enable/disable detailed logging (default: false in production) */
  enableLogging?: boolean;
  /** Custom headers to include in connection request */
  additionalHeaders?: Record<string, string>;
}

/**
 * Return type for useSignalRConnection hook
 */
export interface SignalRConnectionReturn {
  /** The SignalR HubConnection instance (null if not connected) */
  connection: signalR.HubConnection | null;
  /** Whether the connection is currently established */
  isConnected: boolean;
  /** Whether the connection is currently attempting to reconnect */
  isReconnecting: boolean;
  /** Any error that occurred during connection */
  error: string | null;
  /** Manually start the connection */
  start: () => Promise<void>;
  /** Manually stop the connection */
  stop: () => Promise<void>;
}

/**
 * Custom hook to manage a SignalR connection with automatic reconnection
 * and JWT token authentication.
 *
 * @param hubUrl - The URL of the SignalR hub (e.g., "/callHub")
 * @param options - Optional configuration for the connection
 * @returns SignalR connection state and control methods
 *
 * @example
 * ```tsx
 * const { connection, isConnected } = useSignalRConnection("/callHub");
 *
 * useEffect(() => {
 *   if (isConnected && connection) {
 *     connection.on("ReceiveMessage", (message) => {
 *       console.log("Received:", message);
 *     });
 *   }
 *
 *   return () => {
 *     connection?.off("ReceiveMessage");
 *   };
 * }, [connection, isConnected]);
 * ```
 */
export function useSignalRConnection(
  hubUrl: string,
  options: SignalRConnectionOptions = {}
): SignalRConnectionReturn {
  const {
    enabled = true,
    reconnectDelays = [0, 2000, 10000],
    serverTimeout = 30000,
    enableLogging = process.env.NODE_ENV === 'development',
    additionalHeaders = {},
  } = options;

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isMountedRef = useRef(true);

  // Get current JWT token
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...additionalHeaders,
    };
  }, [additionalHeaders]);

  // Build connection configuration
  const buildConnection = useCallback(() => {
    // For SignalR, we need to use the base URL without /api since hubs are mapped at root level
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Remove /api suffix if present (SignalR hubs are at /callHub, not /api/callHub)
    const baseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');

    const fullUrl = baseUrl.endsWith('/')
      ? baseUrl + hubUrl.slice(1)
      : baseUrl + hubUrl;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(fullUrl, {
        accessTokenFactory: () => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          return token || '';
        },
        skipNegotiation: false,
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const index = retryContext.previousRetryCount;
          return index < reconnectDelays.length ? reconnectDelays[index] : reconnectDelays[reconnectDelays.length - 1];
        },
      })
      .configureLogging(signalR.LogLevel[enableLogging ? 'Information' : 'None'])
      .build();

    return conn;
  }, [hubUrl, reconnectDelays, enableLogging]);

  // Start connection
  const start = useCallback(async () => {
    if (!connectionRef.current || connectionRef.current.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      setError(null);
      await connectionRef.current.start();
      if (isMountedRef.current) {
        setIsConnected(true);
        setIsReconnecting(false);
        if (enableLogging) {
          console.log(`[SignalR] Connected to ${hubUrl}`);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMessage);
        setIsConnected(false);
        console.error(`[SignalR] Failed to connect to ${hubUrl}:`, err);
      }
    }
  }, [hubUrl, enableLogging]);

  // Stop connection
  const stop = useCallback(async () => {
    if (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await connectionRef.current.stop();
        if (isMountedRef.current) {
          setIsConnected(false);
          setIsReconnecting(false);
          if (enableLogging) {
            console.log(`[SignalR] Disconnected from ${hubUrl}`);
          }
        }
      } catch (err) {
        console.error(`[SignalR] Error stopping connection to ${hubUrl}:`, err);
      }
    }
  }, [hubUrl, enableLogging]);

  // Initialize connection on mount
  useEffect(() => {
    // Don't connect if not enabled
    if (!enabled) {
      if (enableLogging) {
        console.log(`[SignalR] Connection disabled for ${hubUrl}, not connecting`);
      }
      return;
    }

    isMountedRef.current = true;
    const conn = buildConnection();
    connectionRef.current = conn;
    setConnection(conn);

    // Set up event handlers
    conn.onreconnecting((error) => {
      if (isMountedRef.current) {
        setIsReconnecting(true);
        if (enableLogging) {
          console.log(`[SignalR] Reconnecting to ${hubUrl}...`);
        }
      }
    });

    conn.onreconnected((connectionId) => {
      if (isMountedRef.current) {
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        if (enableLogging) {
          console.log(`[SignalR] Reconnected to ${hubUrl} (connectionId: ${connectionId})`);
        }
      }
    });

    conn.onclose((error) => {
      if (isMountedRef.current) {
        setIsConnected(false);
        setIsReconnecting(false);
        if (error && enableLogging) {
          console.error(`[SignalR] Connection closed unexpectedly:`, error);
        }
      }
    });

    // Start the connection
    start();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stop();
      connectionRef.current = null;
    };
  }, [enabled]); // Re-run when enabled changes

  return {
    connection,
    isConnected,
    isReconnecting,
    error,
    start,
    stop,
  };
}
