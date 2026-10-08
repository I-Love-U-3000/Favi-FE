"use client";

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Move,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCall } from './CallProvider';

export default function GlobalActiveCallInterface() {
  const { isActiveCall, activeCallInfo, remoteStream, localStream, endCall, connectionStatus } = useCall();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  // Window modes: 'floating' | 'minimized' | 'fullscreen'
  const [windowMode, setWindowMode] = useState<'floating' | 'minimized' | 'fullscreen'>('floating');

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position at bottom right
  useEffect(() => {
    if (typeof window !== 'undefined' && !position) {
      const w = 360;
      const h = 480;
      setPosition({
        x: Math.max(16, window.innerWidth - w - 24),
        y: Math.max(16, window.innerHeight - h - 24),
      });
    }
  }, [position]);

  // Handle remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset timer when a new call starts
  useEffect(() => {
    if (isActiveCall && activeCallInfo) {
      setElapsed(0);
    }
  }, [activeCallInfo?.conversationId]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (windowMode === 'fullscreen') return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;

    isDraggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || windowMode === 'fullscreen') return;

    const width = containerRef.current?.offsetWidth || 360;
    const height = containerRef.current?.offsetHeight || 480;

    const newX = Math.min(
      Math.max(8, e.clientX - dragStartOffsetRef.current.x),
      window.innerWidth - width - 8
    );
    const newY = Math.min(
      Math.max(8, e.clientY - dragStartOffsetRef.current.y),
      window.innerHeight - height - 8
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Don't render if there's no active call
  if (!isActiveCall || !activeCallInfo) {
    return null;
  }

  const { remoteUserName, callType, remoteUserAvatar, remoteUserDisplayName } = activeCallInfo;
  const displayName = remoteUserDisplayName || remoteUserName;
  const isVideoCall = callType === 'video';

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOff(remoteVideoRef.current.muted);
    }
  };

  // MINIMIZED PILL MODE
  if (windowMode === 'minimized') {
    return (
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'fixed',
          left: position?.x ?? 24,
          top: position?.y ?? 24,
          zIndex: 99999,
          touchAction: 'none',
        }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neutral-900/90 text-white backdrop-blur-md border border-white/20 shadow-2xl cursor-grab active:cursor-grabbing select-none"
      >
        <div className="relative">
          <img
            src={remoteUserAvatar || '/avatar-default.svg'}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="text-xs font-semibold truncate max-w-[120px]">{displayName}</div>
          <div className="text-[10px] text-emerald-400 font-mono">{formatTime(elapsed)}</div>
        </div>

        <button
          type="button"
          onClick={() => setWindowMode('floating')}
          className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
          title="Mở rộng"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={endCall}
          className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // FLOATING OR FULLSCREEN MODE
  const isFullscreen = windowMode === 'fullscreen';

  return (
    <div
      ref={containerRef}
      style={
        isFullscreen
          ? { position: 'fixed', inset: 0, zIndex: 99999 }
          : {
              position: 'fixed',
              left: position?.x ?? 24,
              top: position?.y ?? 24,
              width: '360px',
              height: isVideoCall ? '480px' : '360px',
              zIndex: 99999,
            }
      }
      className={`flex flex-col bg-neutral-950 text-white shadow-2xl overflow-hidden border border-white/10 transition-all ${
        isFullscreen ? 'rounded-none' : 'rounded-2xl ring-1 ring-white/10'
      }`}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 select-none ${
          isFullscreen ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isFullscreen && <Move className="w-4 h-4 opacity-50 shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate leading-tight">{displayName}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isFullscreen && (
            <button
              type="button"
              onClick={() => setWindowMode('minimized')}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setWindowMode(isFullscreen ? 'floating' : 'fullscreen')}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Media / Video Stage */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {isVideoCall ? (
          <>
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <img
                  src={remoteUserAvatar || '/avatar-default.svg'}
                  alt={displayName}
                  className="w-20 h-20 rounded-full border-2 border-white/20 object-cover shadow-lg"
                />
                <p className="text-xs text-white/60">
                  {connectionStatus === 'connecting' ? 'Đang kết nối...' : `Đang đợi ${displayName}...`}
                </p>
              </div>
            )}

            {/* Local Video PIP */}
            <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-900">
              {localStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                  <VideoOff className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">Tắt cam</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call Visual */
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="relative">
              <img
                src={remoteUserAvatar || '/avatar-default.svg'}
                alt={displayName}
                className="w-24 h-24 rounded-full border-2 border-emerald-500 object-cover shadow-2xl"
              />
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-30" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Cuộc gọi thoại đang kết nối</p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="px-4 py-3 bg-neutral-900/90 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-3">
        {/* Toggle Mic */}
        <button
          type="button"
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-transform active:scale-95 ${
            isAudioMuted ? 'bg-red-500/80 text-white hover:bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isAudioMuted ? 'Bật mic' : 'Tắt mic'}
        >
          {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Toggle Video */}
        {isVideoCall && (
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-transform active:scale-95 ${
              isVideoOff ? 'bg-red-500/80 text-white hover:bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
        )}

        {/* Toggle Speaker */}
        <button
          type="button"
          onClick={toggleSpeaker}
          className={`p-3 rounded-full transition-transform active:scale-95 ${
            isSpeakerOff ? 'bg-amber-500/80 text-white hover:bg-amber-500' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isSpeakerOff ? 'Bật loa' : 'Tắt loa'}
        >
          {isSpeakerOff ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* End Call */}
        <button
          type="button"
          onClick={endCall}
          className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/30"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="text-xs">Kết thúc</span>
        </button>
      </div>
    </div>
  );
}
