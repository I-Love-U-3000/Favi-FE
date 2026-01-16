// WebRTC Call Types

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'failed';

export type CallInfo = {
  conversationId: string;
  callerId: string;
  calleeId: string;
  callType: CallType;
  status: CallStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // seconds
};

// Signal types matching backend DTOs
export type CallSignalDto = {
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  callType: CallType;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  data: string;
};

export type IceCandidateDto = {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
};

export type IncomingCallRequestDto = {
  conversationId: string;
  callerId: string;
  callerUsername: string;
  callerDisplayName?: string;
  callerAvatarUrl?: string;
  callType: CallType;
};

export type CallResponseDto = {
  conversationId: string;
  response: 'accept' | 'reject';
  reason?: string;
};

export type CallEndedDto = {
  conversationId: string;
  endedByUserId: string;
  reason: 'ended' | 'rejected' | 'timeout' | 'error';
  durationSeconds?: number;
};

export type CallUserJoinedDto = {
  conversationId: string;
  userId: string;
  username: string;
  displayName?: string;
};

export type CallUserLeftDto = {
  conversationId: string;
  userId: string;
  reason: string;
};

// WebRTC Configuration
export type WebRTCConfig = {
  iceServers: RTCIceServer[];
};

export type MediaConstraints = {
  audio: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
};

// Local user state in a call
export type LocalCallState = {
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerEnabled: boolean;
};

// Remote user state
export type RemoteCallState = {
  userId: string;
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
};

// Call UI state
export type CallUiState = {
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isActiveCall: boolean;
  currentCall: CallInfo | null;
  incomingCallInfo: IncomingCallRequestDto | null;
};

// WebRTC peer connection state
export type PeerConnectionState = {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
};

// Call statistics
export type CallStats = {
  duration: number;
  bytesSent: number;
  bytesReceived: number;
  packetsLost: number;
  bitrate: number;
};
