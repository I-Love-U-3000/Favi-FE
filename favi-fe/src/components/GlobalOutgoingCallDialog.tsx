"use client";

import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { useCall } from './CallProvider';

export default function GlobalOutgoingCallDialog() {
  const { outgoingCall, cancelCall } = useCall();

  if (!outgoingCall) return null;

  const { targetUserName, callType, status, errorMessage } = outgoingCall;
  const isVideo = callType === 'video';

  // Status text and animation
  const getStatusConfig = () => {
    switch (status) {
      case 'calling':
        return {
          text: 'Starting call...',
          animate: true,
          bgColor: 'bg-blue-500',
        };
      case 'ringing':
        return {
          text: 'Ringing...',
          animate: true,
          bgColor: 'bg-green-500',
        };
      case 'connected':
        return {
          text: 'Connected!',
          animate: false,
          bgColor: 'bg-green-500',
        };
      case 'failed':
        return {
          text: errorMessage || 'Call failed',
          animate: false,
          bgColor: 'bg-red-500',
        };
      default:
        return {
          text: 'Calling...',
          animate: true,
          bgColor: 'bg-blue-500',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Close button */}
        <button
          onClick={cancelCall}
          className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated gradient background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className={`absolute inset-0 ${statusConfig.animate ? 'animate-pulse' : ''} bg-gradient-to-br from-blue-500/20 to-purple-500/20`} />
        </div>

        {/* Content */}
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Call Type Icon */}
          <div className="relative mb-6">
            <div
              className="rounded-full flex items-center justify-center shadow-xl"
              style={{
                width: '120px',
                height: '120px',
                background: status === 'failed' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                           status === 'connected' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                           'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: '4px solid var(--accent)',
              }}
            >
              {isVideo ? (
                <Video className="w-12 h-12 text-white" strokeWidth={2.5} />
              ) : (
                <Phone className="w-12 h-12 text-white" strokeWidth={2.5} />
              )}
            </div>

            {/* Ringing animation */}
            {statusConfig.animate && (
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
            )}
          </div>

          {/* Target User Name */}
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text)' }}
          >
            {targetUserName}
          </h2>

          {/* Call Type */}
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
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

          {/* Status */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`w-2 h-2 rounded-full ${statusConfig.animate ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: status === 'failed' ? '#ef4444' : status === 'connected' ? '#10b981' : 'var(--accent)' }}
            />
            <p
              className={`text-sm ${statusConfig.animate ? 'animate-pulse' : ''}`}
              style={{ color: status === 'failed' ? '#ef4444' : 'var(--text-secondary)' }}
            >
              {statusConfig.text}
            </p>
          </div>

          {/* Cancel Button */}
          {status !== 'failed' && status !== 'connected' && (
            <button
              onClick={cancelCall}
              className="flex items-center gap-2 px-6 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontWeight: '600',
              }}
              aria-label="Cancel call"
            >
              <PhoneOff className="w-5 h-5" strokeWidth={2.5} />
              <span>Cancel</span>
            </button>
          )}

          {/* Auto-close message for failed/connected */}
          {(status === 'failed' || status === 'connected') && (
            <p className="text-xs mt-4 opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Closing automatically...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
