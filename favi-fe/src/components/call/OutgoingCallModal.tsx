"use client";

import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, X } from 'lucide-react';

interface OutgoingCallModalProps {
  calleeName: string;
  calleeAvatar?: string;
  callType: 'audio' | 'video';
  onCancel: () => void;
}

export default function OutgoingCallModal({
  calleeName,
  calleeAvatar,
  callType,
  onCancel,
}: OutgoingCallModalProps) {
  const [elapsed, setElapsed] = useState(0);

  // Track elapsed time for timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Auto-cancel after 30 seconds
    const timeout = setTimeout(() => {
      onCancel();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onCancel]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideo = callType === 'video';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Animated gradient background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/10 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Cancel call"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Callee Avatar */}
          <div className="relative mb-6">
            <div
              className="rounded-full overflow-hidden shadow-xl"
              style={{
                width: '120px',
                height: '120px',
                border: '4px solid var(--accent)',
              }}
            >
              <img
                src={calleeAvatar || '/default-avatar.png'}
                alt={calleeName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Ringing animation */}
            <>
              <div
                className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_infinite]"
                style={{
                  border: '3px solid var(--accent)',
                  opacity: '0.5',
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_1s_infinite]"
                style={{
                  border: '3px solid var(--accent)',
                  opacity: '0.3',
                }}
              />
            </>
          </div>

          {/* Callee Info */}
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text)' }}
          >
            {calleeName}
          </h2>

          {/* Call Type Indicator */}
          <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
            {isVideo ? (
              <>
                <Video className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Video Call
                </span>
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Voice Call
                </span>
              </>
            )}
          </div>

          {/* Calling Status */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              Calling...
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {formatTime(elapsed)}
            </p>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="flex items-center gap-2 mt-8 px-8 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
            }}
          >
            <PhoneOff className="w-5 h-5" strokeWidth={2.5} />
            <span className="font-medium">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
