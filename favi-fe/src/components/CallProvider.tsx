"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSignalRConnection } from '@/lib/hooks/useSignalRConnection';
import { webrtcManager } from '@/lib/webrtc/webrtcService';
import type { IncomingCallRequestDto, CallType, MediaStream } from '@/types/call';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useAuth } from './AuthProvider';

type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';

interface ActiveCallInfo {
  remoteUserName: string;
  callType: CallType;
  conversationId: string;
}

interface OutgoingCallInfo {
  targetUserName: string;
  callType: CallType;
  conversationId: string;
  status: CallStatus;
  errorMessage?: string;
}

interface CallContextType {
  isIncomingCall: boolean;
  incomingCall: IncomingCallRequestDto | null;
  isOutgoingCall: boolean;
  outgoingCall: OutgoingCallInfo | null;
  isActiveCall: boolean;
  activeCallInfo: ActiveCallInfo | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  cancelCall: () => Promise<void>;
  startCall: (conversationId: string, targetUserId: string, callType: CallType, targetUserName?: string) => Promise<void>;
  isCallHubConnected: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
}

interface CallProviderProps {
  children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toast = useRef<Toast>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallRequestDto | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCallInfo | null>(null);
  const [isActiveCall, setIsActiveCall] = useState(false);
  const [activeCallInfo, setActiveCallInfo] = useState<ActiveCallInfo | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  // Show toast notification
  const showToast = useCallback((severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 5000 });
  }, []);

  // SignalR connection for calls - ONLY connect if authenticated
  const callHub = useSignalRConnection('/callHub', {
    enableLogging: true,
    enabled: isAuthenticated // Only connect when user is authenticated
  });

  // Initialize WebRTC when SignalR connects
  useEffect(() => {
    console.log('[CallProvider] State check:', {
      isAuthenticated,
      isConnected: callHub.isConnected,
      hasConnection: !!callHub.connection,
      error: callHub.error
    });

    if (!callHub.isConnected || !callHub.connection) return;

    console.log('[CallProvider] CallHub connected, initializing WebRTC');

    // Initialize WebRTC manager
    webrtcManager.initialize(callHub.connection);
    webrtcManager.onRemoteStream((stream) => {
      setRemoteStream(stream);
      setIsActiveCall(true);
    });

    webrtcManager.onCallEnded((reason) => {
      handleCallEnded();
    });

    webrtcManager.onError((error) => {
      console.error('[Call] Error:', error);
      alert(`Call error: ${error}`);
      handleCallEnded();
    });

    // Setup SignalR event listeners for incoming calls
    callHub.connection.on('IncomingCall', (callRequest: IncomingCallRequestDto) => {
      console.log('[Call] Incoming call received:', callRequest);

      // Play ringtone sound (optional)
      playRingtone();

      setIncomingCall(callRequest);
    });

    // Handle call accepted notification (for caller)
    callHub.connection.on('CallAccepted', (data: any) => {
      console.log('[Call] Call accepted, joining call room');
      const conversationId = data.conversationId || pendingConversationId;
      if (conversationId) {
        // Update outgoing call status
        if (outgoingCall) {
          setOutgoingCall(prev => prev ? { ...prev, status: 'connected' } : null);
        }

        // Navigate to chat page with the conversation
        router.push(`/chat?conversationId=${conversationId}`);

        // Clear outgoing call after a short delay
        setTimeout(() => {
          setOutgoingCall(null);
        }, 2000);
      }
    });

    // Handle call rejected notification
    callHub.connection.on('CallRejected', (data: any) => {
      console.log('[Call] Call rejected:', data.reason);
      const reason = data.reason || 'Declined';

      // Show toast notification
      showToast('warn', 'Call Rejected', reason);

      // Update outgoing call status
      if (outgoingCall) {
        setOutgoingCall(prev => prev ? { ...prev, status: 'failed', errorMessage: reason } : null);
      }

      // Clear after showing the status
      setTimeout(() => {
        setOutgoingCall(null);
      }, 2000);

      setIncomingCall(null);
    });

    // Handle join call room command
    callHub.connection.on('JoinCallRoom', (conversationId: string) => {
      console.log('[Call] Joining call room:', conversationId);
      webrtcManager.joinCallRoom(conversationId);
    });

    return () => {
      // Cleanup
      webrtcManager.destroy();
      callHub.connection?.off('IncomingCall');
      callHub.connection?.off('CallAccepted');
      callHub.connection?.off('CallRejected');
      callHub.connection?.off('JoinCallRoom');
    };
  }, [callHub.isConnected, callHub.connection, pendingConversationId, outgoingCall, showToast, router]);

  // Play ringtone sound
  const playRingtone = () => {
    // You can add an actual audio file here
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.play().catch(() => {
      console.log('Could not play ringtone');
    });
  };

  // Start a call (for caller)
  const startCall = useCallback(async (conversationId: string, targetUserId: string, callType: CallType, targetUserName?: string) => {
    if (!callHub.connection) {
      showToast('error', 'Call Failed', 'No connection to call server');
      return;
    }

    try {
      // Store pending conversation for later redirect
      setPendingConversationId(conversationId);

      // Store active call info for UI
      if (targetUserName) {
        setActiveCallInfo({
          remoteUserName: targetUserName,
          callType,
          conversationId,
        });

        // Set outgoing call state IMMEDIATELY so UI shows right away
        setOutgoingCall({
          targetUserName,
          callType,
          conversationId,
          status: 'calling',
        });
      }

      await webrtcManager.startCall(conversationId, targetUserId, callType);
      setLocalStream(webrtcManager.getLocalStream());

      // Update status to ringing after signaling is sent
      setOutgoingCall(prev => prev ? { ...prev, status: 'ringing' } : null);

      showToast('info', 'Calling...', `Calling ${targetUserName}`);
    } catch (error) {
      console.error('[Call] Failed to start call:', error);
      showToast('error', 'Call Failed', 'Failed to start call. Please check camera/microphone permissions.');
      setPendingConversationId(null);
      setActiveCallInfo(null);
      setOutgoingCall(null);
    }
  }, [callHub.connection, showToast]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !callHub.connection) return;

    try {
      const conversationId = incomingCall.conversationId;
      const callerId = incomingCall.callerId;
      const callType = incomingCall.callType;

      console.log('[Call] Accepting call:', { conversationId, callerId, callType });

      // Store conversation for redirect
      setPendingConversationId(conversationId);

      // Store active call info for UI
      setActiveCallInfo({
        remoteUserName: incomingCall.callerDisplayName || incomingCall.callerUsername,
        callType: incomingCall.callType,
        conversationId,
      });

      // Accept the call via WebRTC manager
      await webrtcManager.acceptCall(conversationId, callerId, callType);

      // Get local stream
      setLocalStream(webrtcManager.getLocalStream());

      // Navigate to chat page with the conversation
      router.push(`/chat?conversationId=${conversationId}`);

      // Clear incoming call UI
      setIncomingCall(null);

      console.log('[Call] Call accepted successfully');
    } catch (error) {
      console.error('[Call] Failed to accept call:', error);
      showToast('error', 'Call Failed', 'Failed to accept call. Please check camera/microphone permissions.');
      setIncomingCall(null);
      setPendingConversationId(null);
      setActiveCallInfo(null);
    }
  }, [incomingCall, callHub.connection, router, showToast]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall || !callHub.connection) return;

    try {
      await webrtcManager.rejectCall(
        incomingCall.conversationId,
        incomingCall.callerId,
        'Declined by user'
      );
    } catch (error) {
      console.error('[Call] Failed to reject call:', error);
    } finally {
      setIncomingCall(null);
    }
  }, [incomingCall, callHub.connection]);

  // End active call
  const endCall = useCallback(async () => {
    await webrtcManager.endCall();
    handleCallEnded();
  }, []);

  // Cancel outgoing call (before it's accepted)
  const cancelCall = useCallback(async () => {
    if (outgoingCall) {
      try {
        await webrtcManager.endCall('cancelled');
        showToast('info', 'Call Cancelled', 'You cancelled the call');
      } catch (error) {
        console.error('[Call] Failed to cancel call:', error);
      } finally {
        setOutgoingCall(null);
        setActiveCallInfo(null);
        setPendingConversationId(null);
      }
    }
  }, [outgoingCall, showToast]);

  // Handle call ended cleanup
  const handleCallEnded = useCallback(() => {
    setIsActiveCall(false);
    setActiveCallInfo(null);
    setRemoteStream(null);
    setLocalStream(null);
    setIncomingCall(null);
    setOutgoingCall(null);
    setPendingConversationId(null);
  }, []);

  const value: CallContextType = {
    isIncomingCall: !!incomingCall,
    incomingCall,
    isOutgoingCall: !!outgoingCall,
    outgoingCall,
    isActiveCall,
    activeCallInfo,
    remoteStream,
    localStream,
    acceptCall,
    rejectCall,
    endCall,
    cancelCall,
    startCall,
    isCallHubConnected: callHub.isConnected,
  };

  // Debug log for connection state
  useEffect(() => {
    console.log('[CallProvider] Context value updated:', {
      isAuthenticated,
      isConnected: callHub.isConnected,
      hasIncomingCall: !!incomingCall,
      hasActiveCall: isActiveCall,
      error: callHub.error
    });
  }, [isAuthenticated, callHub.isConnected, incomingCall, isActiveCall, callHub.error]);

  return (
    <CallContext.Provider value={value}>
      <Toast ref={toast} />
      {children}
    </CallContext.Provider>
  );
}
