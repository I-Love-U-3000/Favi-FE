"use client";

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { useCall } from './CallProvider';

export default function GlobalActiveCallInterface() {
  const { isActiveCall, activeCallInfo, remoteStream, localStream, endCall, connectionStatus } = useCall();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

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

  // Reset timer when a new call starts (when conversationId changes)
  useEffect(() => {
    if (isActiveCall && activeCallInfo) {
      setElapsed(0);
    }
  }, [activeCallInfo?.conversationId]);

  // Don't render if there's no active call - MUST be after ALL hooks
  if (!isActiveCall || !activeCallInfo) {
    return null;
  }

  const { remoteUserName, callType, remoteUserAvatar, remoteUserDisplayName } = activeCallInfo;

  // Determine display name (use displayName if available, otherwise fall back to username)
  const displayName = remoteUserDisplayName || remoteUserName;

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

  const isVideoCall = callType === 'video';

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black animate-in fade-in duration-300 flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)' }}
    >
      {/* Header - Fixed height at top */}
      <div className="flex-shrink-0 p-4 sm:p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-white/70 text-sm mt-1">
            {connectionStatus === 'connecting' ? 'Connecting...' : formatTime(elapsed)}
          </p>
        </div>

        {/* Connection Quality Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          connectionStatus === 'connected'
            ? 'bg-green-500/20 border-green-500/30'
            : 'bg-yellow-500/20 border-yellow-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-ping'
          }`} />
          <span className={`text-xs font-medium ${
            connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Video Area - Takes remaining space */}
      <div className="flex-1 relative min-h-0">
        {/* Remote Video (OTHER PERSON'S CAMERA - BIG SCREEN) */}
        {isVideoCall ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Label to identify this as the other person's camera */}
            {remoteStream && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <p className="text-sm text-white/90">{displayName}</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl">
              <img
                src={remoteUserAvatar || '/default-avatar.png'}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* No Remote Video Placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {remoteUserAvatar ? (
                  <img
                    src={remoteUserAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PhoneOff className="w-12 h-12 text-white/50" />
                )}
              </div>
              <p className="text-white/50 text-lg">
                {connectionStatus === 'connecting'
                  ? `Connecting to ${displayName}...`
                  : `Waiting for ${displayName} to join...`}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (YOUR CAMERA - Picture-in-Picture) */}
        {/* Always show during video calls, regardless of remote stream */}
        {isVideoCall && (
          <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} /* Mirror effect for your camera */
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="flex flex-col items-center gap-2">
                  <VideoOff className="w-8 h-8 text-white/50" />
                  <p className="text-xs text-white/50">Your camera</p>
                </div>
              </div>
            )}
            {/* Label to identify this as your camera */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
              <p className="text-xs text-white/80">You</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Fixed height at bottom */}
      <div className="flex-shrink-0 p-4 pb-6 sm:p-6 sm:pb-8">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Toggle Audio */}
          <button
            onClick={toggleAudio}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
              isAudioMuted ? 'bg-red-500' : 'bg-white/20'
            }`}
            aria-label={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? (
              <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
            ) : (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
            )}
          </button>

          {/* Toggle Video - Only for video calls */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                isVideoOff ? 'bg-red-500' : 'bg-white/20'
              }`}
              aria-label={isVideoOff ? 'Enable video' : 'Disable video'}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              ) : (
                <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              )}
            </button>
          )}

          {/* Toggle Speaker */}
          <button
            onClick={toggleSpeaker}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95`}
            aria-label={isSpeakerOff ? 'Enable speaker' : 'Disable speaker'}
          >
            {isSpeakerOff ? (
              <VolumeX className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
            ) : (
              <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="flex items-center justify-center w-16 h-14 sm:w-20 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="End call"
          >
            <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
