"use client";

import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from './CallProvider';

export default function GlobalIncomingCallDialog() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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

        {/* Content */}
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Caller Avatar */}
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
                src={incomingCall.callerAvatarUrl || '/default-avatar.png'}
                alt={incomingCall.callerUsername}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Ringing animation ring */}
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
          </div>

          {/* Caller Info */}
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text)' }}
          >
            {incomingCall.callerDisplayName || incomingCall.callerUsername}
          </h2>

          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {incomingCall.callerDisplayName !== incomingCall.callerUsername &&
              `@${incomingCall.callerUsername}`}
          </p>

          {/* Call Type Indicator */}
          <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
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

          {/* Ringing Status */}
          <p className="mt-4 text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Incoming call...
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-6 mt-8">
            {/* Reject Button */}
            <button
              onClick={rejectCall}
              className="flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              }}
              aria-label="Reject call"
            >
              <PhoneOff className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptCall}
              className="flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
              aria-label="Accept call"
            >
              {isVideo ? (
                <Video className="w-7 h-7 text-white" strokeWidth={2.5} />
              ) : (
                <Phone className="w-7 h-7 text-white" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
