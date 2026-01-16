import * as signalR from '@microsoft/signalr';
import type {
  CallType,
  CallSignalDto,
  IceCandidateDto,
  IncomingCallRequestDto,
  CallEndedDto,
  LocalCallState,
  PeerConnectionState,
} from '@/types/call';

/**
 * WebRTC Manager - Handles peer-to-peer voice/video calls
 * Manages peer connections, media streams, and signaling via SignalR
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalRConnection: signalR.HubConnection | null = null;

  // State
  private currentConversationId: string | null = null;
  private currentCallType: CallType | null = null;
  private isCallInitiator = false;
  private localCallState: LocalCallState = {
    isAudioMuted: false,
    isVideoEnabled: true,
    isSpeakerEnabled: true,
  };

  // ICE configuration
  private readonly iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.l.google.com:5349' },
    { urls: 'stun:stun1.l.google.com:5349' },
  ];

  // Event callbacks
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndedCallback?: (reason: string) => void;
  private onPeerConnectionStateChangeCallback?: (state: PeerConnectionState) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {}

  /**
   * Join a call room (SignalR group)
   */
  public async joinCallRoom(conversationId: string): Promise<void> {
    if (this.signalRConnection) {
      await this.signalRConnection.invoke('JoinCallRoom', conversationId);
      this.currentConversationId = conversationId;
      console.log('[WebRTC] Joined call room:', conversationId);
    }
  }

  /**
   * Initialize the WebRTC manager with a SignalR connection
   */
  public initialize(signalRConnection: signalR.HubConnection): void {
    this.signalRConnection = signalRConnection;
    this.setupSignalRListeners();
  }

  /**
   * Setup SignalR event listeners for WebRTC signaling
   */
  private setupSignalRListeners(): void {
    if (!this.signalRConnection) return;

    // Receive offer
    this.signalRConnection.on('ReceiveOffer', async (signal: CallSignalDto) => {
      try {
        await this.handleOffer(signal);
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
        this.onErrorCallback?.('Failed to handle incoming offer');
      }
    });

    // Receive answer
    this.signalRConnection.on('ReceiveAnswer', async (signal: CallSignalDto) => {
      try {
        await this.handleAnswer(signal);
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
        this.onErrorCallback?.('Failed to handle answer');
      }
    });

    // Receive ICE candidate
    this.signalRConnection.on('ReceiveIceCandidate', async (data: any) => {
      try {
        await this.handleIceCandidate(data);
      } catch (error) {
        console.error('[WebRTC] Error handling ICE candidate:', error);
      }
    });

    // Call ended
    this.signalRConnection.on('CallEnded', (data: CallEndedDto) => {
      this.onCallEndedCallback?.(data.reason);
      this.cleanup();
    });

    // Call accepted
    this.signalRConnection.on('CallAccepted', () => {
      // Move to call room
    });

    // Call rejected
    this.signalRConnection.on('CallRejected', (data: any) => {
      this.onCallEndedCallback?.(data.reason || 'rejected');
      this.cleanup();
    });

    // Join call room
    this.signalRConnection.on('JoinCallRoom', async (conversationId: string) => {
      await this.signalRConnection?.invoke('JoinCallRoom', conversationId);
    });
  }

  /**
   * Start a new call (outgoing)
   */
  public async startCall(
    conversationId: string,
    targetUserId: string,
    callType: CallType
  ): Promise<void> {
    if (!this.signalRConnection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      this.currentConversationId = conversationId;
      this.currentCallType = callType;
      this.isCallInitiator = true;

      // Get user media
      await this.getUserMedia(callType);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream!.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Create and set local description (offer)
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (this.peerConnection!.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (this.peerConnection!.iceGatheringState === 'complete') {
              this.peerConnection!.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          this.peerConnection!.addEventListener('icegatheringstatechange', checkState);
        }
      });

      console.log('[WebRTC] Calling StartCall via SignalR:', { conversationId, targetUserId, callType });

      // Send offer via SignalR
      try {
        await this.signalRConnection.invoke(
          'StartCall',
          conversationId,
          targetUserId,
          callType
        );
        console.log('[WebRTC] StartCall SignalR invoke successful');
      } catch (error) {
        console.error('[WebRTC] StartCall SignalR invoke failed:', error);
        throw error;
      }

      // Also send the offer separately if needed
      try {
        await this.signalRConnection.invoke(
          'SendOffer',
          conversationId,
          targetUserId,
          JSON.stringify(this.peerConnection!.localDescription)
        );
        console.log('[WebRTC] SendOffer SignalR invoke successful');
      } catch (error) {
        console.error('[WebRTC] SendOffer SignalR invoke failed:', error);
        // Don't throw here - the call might still work
      }

      console.log('[WebRTC] Call started');
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error);
      this.onErrorCallback?.('Failed to start call');
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  public async answerCall(
    conversationId: string,
    callerId: string,
    callType: CallType,
    offerSignal: CallSignalDto
  ): Promise<void> {
    if (!this.signalRConnection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      this.currentConversationId = conversationId;
      this.currentCallType = callType;
      this.isCallInitiator = false;

      // Get user media
      await this.getUserMedia(callType);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream!.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Accept the call via SignalR
      await this.signalRConnection.invoke('AcceptCall', conversationId, callerId);

      console.log('[WebRTC] Call answered');
    } catch (error) {
      console.error('[WebRTC] Error answering call:', error);
      this.onErrorCallback?.('Failed to answer call');
      throw error;
    }
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(signal: CallSignalDto): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] Received offer but no peer connection exists');
      return;
    }

    try {
      const offer = JSON.parse(signal.data) as RTCSessionDescriptionInit;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (this.peerConnection!.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (this.peerConnection!.iceGatheringState === 'complete') {
              this.peerConnection!.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          this.peerConnection!.addEventListener('icegatheringstatechange', checkState);
        }
      });

      // Send answer
      await this.signalRConnection?.invoke(
        'SendAnswer',
        this.currentConversationId,
        signal.fromUserId,
        JSON.stringify(this.peerConnection.localDescription)
      );

      console.log('[WebRTC] Offer handled and answer sent');
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(signal: CallSignalDto): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] Received answer but no peer connection exists');
      return;
    }

    try {
      const answer = JSON.parse(signal.data) as RTCSessionDescriptionInit;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Answer handled');
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
      throw error;
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const candidate = new RTCIceCandidate({
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      });

      await this.peerConnection.addIceCandidate(candidate);
      console.debug('[WebRTC] ICE candidate added');
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  /**
   * Get user media (microphone and camera)
   */
  private async getUserMedia(callType: CallType): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: !this.localCallState.isAudioMuted,
      video: callType === 'video' ? !this.localCallState.isAudioMuted : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] User media obtained', {
        audio: !!this.localStream.getAudioTracks().length,
        video: !!this.localStream.getVideoTracks().length,
      });
    } catch (error) {
      console.error('[WebRTC] Error getting user media:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  /**
   * Create RTCPeerConnection
   */
  private createPeerConnection(): void {
    const config: RTCConfiguration = {
      iceServers: this.iceServers,
    };

    this.peerConnection = new RTCPeerConnection(config);

    // ICE candidate event
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate && this.signalRConnection && this.currentConversationId) {
        // We need to know the target user ID - this should be tracked
        // For now, we'll store it and handle it differently
        console.debug('[WebRTC] ICE candidate generated:', event.candidate);
      }
    });

    // Remote stream event
    this.peerConnection.addEventListener('track', (event) => {
      console.log('[WebRTC] Received remote track');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStreamCallback?.(this.remoteStream);
      }
    });

    // Connection state changes
    this.peerConnection.addEventListener('connectionstatechange', () => {
      const state: PeerConnectionState = {
        connectionState: this.peerConnection!.connectionState,
        iceConnectionState: this.peerConnection!.iceConnectionState,
        iceGatheringState: this.peerConnection!.iceGatheringState,
        signalingState: this.peerConnection!.signalingState,
      };
      this.onPeerConnectionStateChangeCallback?.(state);

      // Handle failed/disconnected states
      if (this.peerConnection!.connectionState === 'failed') {
        this.onErrorCallback?.('Connection failed');
      } else if (this.peerConnection!.connectionState === 'disconnected') {
        // Don't immediately end call - it might reconnect
        console.warn('[WebRTC] Peer connection disconnected');
      }
    });

    console.log('[WebRTC] Peer connection created');
  }

  /**
   * Toggle audio mute
   */
  public toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.localCallState.isAudioMuted = !audioTrack.enabled;

        // Notify remote peer
        if (this.signalRConnection && this.currentConversationId) {
          this.signalRConnection.invoke(
            'ToggleAudio',
            this.currentConversationId,
            this.localCallState.isAudioMuted
          );
        }

        console.log('[WebRTC] Audio toggled:', this.localCallState.isAudioMuted);
      }
    }
  }

  /**
   * Toggle video
   */
  public toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.localCallState.isVideoEnabled = videoTrack.enabled;

        // Notify remote peer
        if (this.signalRConnection && this.currentConversationId) {
          this.signalRConnection.invoke(
            'ToggleVideo',
            this.currentConversationId,
            this.localCallState.isVideoEnabled
          );
        }

        console.log('[WebRTC] Video toggled:', this.localCallState.isVideoEnabled);
      }
    }
  }

  /**
   * End the call
   */
  public async endCall(reason: string = 'ended'): Promise<void> {
    try {
      // Notify remote peer
      if (this.signalRConnection && this.currentConversationId) {
        await this.signalRConnection.invoke('EndCall', this.currentConversationId, reason);
      }

      this.cleanup();
      console.log('[WebRTC] Call ended');
    } catch (error) {
      console.error('[WebRTC] Error ending call:', error);
      this.cleanup();
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Leave call room
    if (this.signalRConnection && this.currentConversationId) {
      this.signalRConnection
        .invoke('LeaveCallRoom', this.currentConversationId)
        .catch((error) => console.error('[WebRTC] Error leaving call room:', error));
    }

    // Reset state
    this.currentConversationId = null;
    this.currentCallType = null;
    this.isCallInitiator = false;
    this.remoteStream = null;

    console.log('[WebRTC] Cleaned up');
  }

  /**
   * Accept an incoming call
   */
  public async acceptCall(conversationId: string, callerId: string, callType: CallType): Promise<void> {
    if (!this.signalRConnection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      this.currentConversationId = conversationId;
      this.currentCallType = callType;
      this.isCallInitiator = false;

      console.log('[WebRTC] Accepting call:', { conversationId, callerId, callType });

      // Get user media
      await this.getUserMedia(callType);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      // Accept the call via SignalR (this will notify the caller)
      await this.signalRConnection.invoke('AcceptCall', conversationId, callerId);

      // The offer will come through the ReceiveOffer event, which will be handled automatically
      console.log('[WebRTC] Call accepted, waiting for offer');
    } catch (error) {
      console.error('[WebRTC] Error accepting call:', error);
      throw error;
    }
  }

  /**
   * Reject an incoming call
   */
  public async rejectCall(conversationId: string, callerId: string, reason?: string): Promise<void> {
    if (!this.signalRConnection) {
      throw new Error('SignalR connection not initialized');
    }

    await this.signalRConnection.invoke('RejectCall', conversationId, callerId, reason);
    console.log('[WebRTC] Call rejected');
  }

  // Getters
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public getCallState(): LocalCallState {
    return { ...this.localCallState };
  }

  public isInCall(): boolean {
    return this.peerConnection !== null;
  }

  // Event setters
  public onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  public onCallEnded(callback: (reason: string) => void): void {
    this.onCallEndedCallback = callback;
  }

  public onPeerConnectionStateChange(callback: (state: PeerConnectionState) => void): void {
    this.onPeerConnectionStateChangeCallback = callback;
  }

  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Remove all event listeners
   */
  public destroy(): void {
    this.cleanup();
    if (this.signalRConnection) {
      this.signalRConnection.off('ReceiveOffer');
      this.signalRConnection.off('ReceiveAnswer');
      this.signalRConnection.off('ReceiveIceCandidate');
      this.signalRConnection.off('CallEnded');
      this.signalRConnection.off('CallAccepted');
      this.signalRConnection.off('CallRejected');
      this.signalRConnection.off('JoinCallRoom');
    }
  }
}

// Export singleton instance
export const webrtcManager = new WebRTCManager();
