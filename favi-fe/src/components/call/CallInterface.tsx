"use client";

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';

interface CallInterfaceProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callType: 'audio' | 'video';
  remoteUserName: string;
  onEndCall: () => void;
}

export default function CallInterface({
  remoteStream,
  localStream,
  callType,
  remoteUserName,
  onEndCall,
}: CallInterfaceProps) {
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
      className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300"
      style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)' }}
    >
      {/* Main Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">{remoteUserName}</h1>
            <p className="text-white/70 text-sm mt-1">{formatTime(elapsed)}</p>
          </div>

          {/* Connection Quality Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Connected</span>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          {isVideoCall ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl">
                <img
                  src="/default-avatar.png"
                  alt={remoteUserName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* No Remote Video Placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone className="w-12 h-12 text-white/50" />
                </div>
                <p className="text-white/50 text-lg">Waiting for {remoteUserName} to join...</p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) - Only for video calls */}
          {isVideoCall && localStream && (
            <div className="absolute bottom-32 right-6 w-40 h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Audio Call Avatar - Only for audio calls */}
          {!isVideoCall && remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div
                    className="w-48 h-48 rounded-full overflow-hidden shadow-2xl animate-pulse"
                    style={{ border: '4px solid var(--accent)' }}
                  >
                    <img
                      src="/default-avatar.png"
                      alt={remoteUserName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Audio wave animation */}
                  <div className="absolute -inset-4 rounded-full border-2 border-white/20 animate-[ping_2s_ease-in-out_infinite]" />
                  <div className="absolute -inset-4 rounded-full border-2 border-white/10 animate-[ping_2s_ease-in-out_1.5s_infinite]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-1 h-8">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white/60 rounded-full animate-[bounce_1s_ease-in-out_infinite]"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Toggle Audio */}
            <button
              onClick={toggleAudio}
              className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                isAudioMuted ? 'bg-red-500' : 'bg-white/20'
              }`}
              aria-label={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? (
                <MicOff className="w-7 h-7 text-white" strokeWidth={2.5} />
              ) : (
                <Mic className="w-7 h-7 text-white" strokeWidth={2.5} />
              )}
            </button>

            {/* Toggle Video - Only for video calls */}
            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                  isVideoOff ? 'bg-red-500' : 'bg-white/20'
                }`}
                aria-label={isVideoOff ? 'Enable video' : 'Disable video'}
              >
                {isVideoOff ? (
                  <VideoOff className="w-7 h-7 text-white" strokeWidth={2.5} />
                ) : (
                  <Video className="w-7 h-7 text-white" strokeWidth={2.5} />
                )}
              </button>
            )}

            {/* Toggle Speaker */}
            <button
              onClick={toggleSpeaker}
              className={`flex items-center justify-center w-16 h-16 rounded-full bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95`}
              aria-label={isSpeakerOff ? 'Enable speaker' : 'Disable speaker'}
            >
              {isSpeakerOff ? (
                <VolumeX className="w-7 h-7 text-white" strokeWidth={2.5} />
              ) : (
                <Volume2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={onEndCall}
              className="flex items-center justify-center w-20 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="End call"
            >
              <PhoneOff className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
