"use client";

import { useCall } from './CallProvider';
import { useEffect, useState } from 'react';

export default function CallHubDebugIndicator() {
  const { isCallHubConnected } = useCall();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get user ID from localStorage or auth
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      try {
        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload['sub'] || payload['nameid'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        setCurrentUserId(userId);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-[50] px-3 py-2 rounded-lg text-xs font-mono"
      style={{
        backgroundColor: isCallHubConnected ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
        color: 'white',
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: isCallHubConnected ? '#ffffff' : '#ff0000' }}
          />
          <span className="font-bold">
            CallHub: {isCallHubConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        {currentUserId && (
          <div className="opacity-75" style={{ fontSize: '9px' }}>
            User: {currentUserId.slice(0, 8)}...
          </div>
        )}
      </div>
    </div>
  );
}
