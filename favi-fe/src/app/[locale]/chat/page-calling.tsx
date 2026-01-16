"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import ImageViewer from "@/components/ImageViewer";
import MediaGallery from "@/components/MediaGallery";
// Call-related imports
import IncomingCallModal from "@/components/call/IncomingCallModal";
import OutgoingCallModal from "@/components/call/OutgoingCallModal";
import CallInterface from "@/components/call/CallInterface";
import { useSignalRConnection } from "@/lib/hooks/useSignalRConnection";
import { webrtcManager } from "@/lib/webrtc/webrtcService";
import type { IncomingCallRequestDto, CallType } from "@/types/call";
import { useTranslations } from "next-intl";
import { supabase } from "@/app/supabase-client";
import chatAPI from "@/lib/api/chatAPI";
import type {
  ConversationSummaryResponse,
  MessageResponse,
  MessagePageResponse,
} from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";

// --------- INTERNAL CHAT TYPES (làm việc với backend) ---------
interface ChatMessage {
  backendId: string; // id từ backend (Guid)
  senderId: string;
  senderUsername: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  readBy?: string[]; // Array of profile IDs who have read this message
}

interface ChatRecipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string;
  profileId?: string; // Profile ID of the recipient (for read receipts)
}

interface ChatConversation {
  id: string; // conversationId từ backend
  key: string; // key cho UI (ở đây = id luôn)
  recipient: ChatRecipient;
  messages: ChatMessage[];
  unreadCount?: number; // Unread message count
  lastMessagePreview?: string | null; // Last message preview from backend
  lastMessageAt?: string | null; // Last message timestamp from backend
}

// --------- UI TYPES cho ChatList / MessageList ---------
interface UiMessage {
  id: number; // UI-only id (number)
  senderId: string;
  sender: string; // username
  text: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  isOwn: boolean;
  readBy?: string[]; // Array of profile IDs who have read this message
}

interface UiConversation {
  key: string;
  recipient: ChatRecipient;
  messages: UiMessage[];
  unreadCount?: number; // Unread message count
  lastMessagePreview?: string | null; // Last message preview from backend
  lastMessageAt?: string | null; // Last message timestamp from backend
}

export default function ChatPage() {
  const t = useTranslations("ChatPage");
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");

  // ---- EXISTING CHAT STATE ----
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>("");
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);

  // Track which conversations have been loaded (to preserve their unreadCount)
  const loadedConversationsRef = useRef<Set<string>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ---- CALL STATE ----
  const [incomingCall, setIncomingCall] = useState<IncomingCallRequestDto | null>(null);
  const [outgoingCallType, setOutgoingCallType] = useState<CallType | null>(null);
  const [isActiveCall, setIsActiveCall] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // SignalR connection for calls
  const callHub = useSignalRConnection("/callHub", { enableLogging: true });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter((conv) =>
      conv.recipient.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // Initialize WebRTC manager when SignalR connects
  useEffect(() => {
    if (callHub.isConnected && callHub.connection) {
      webrtcManager.initialize(callHub.connection);

      // Setup WebRTC event handlers
      webrtcManager.onRemoteStream((stream) => {
        setRemoteStream(stream);
        setIsActiveCall(true);
        setOutgoingCallType(null);
      });

      webrtcManager.onCallEnded((reason) => {
        handleCallEnded();
      });

      webrtcManager.onError((error) => {
        console.error("[Call] Error:", error);
        alert(`Call error: ${error}`);
        handleCallEnded();
      });

      // Setup SignalR event listeners for incoming calls
      callHub.connection.on("IncomingCall", (callRequest: IncomingCallRequestDto) => {
        console.log("[Call] Incoming call received:", callRequest);
        setIncomingCall(callRequest);
      });

      return () => {
        // Cleanup
        webrtcManager.destroy();
        callHub.connection?.off("IncomingCall");
      };
    }
  }, [callHub.isConnected, callHub.connection]);

  // ---- CALL HANDLERS ----

  // Start a call (voice or video)
  const handleStartCall = useCallback(async (callType: CallType) => {
    if (!selectedConversation || !callHub.connection) {
      alert("Cannot start call: No connection or conversation selected");
      return;
    }

    const recipientId = selectedConversation.recipient.profileId;
    if (!recipientId) {
      alert("Cannot start call: Recipient ID not found");
      return;
    }

    try {
      setOutgoingCallType(callType);
      setLocalStream(webrtcManager.getLocalStream());

      await webrtcManager.startCall(
        selectedConversation.id,
        recipientId,
        callType
      );
    } catch (error) {
      console.error("[Call] Failed to start call:", error);
      setOutgoingCallType(null);
      alert("Failed to start call. Please check camera/microphone permissions.");
    }
  }, [selectedConversation, callHub.connection]);

  // Accept incoming call
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall || !callHub.connection) return;

    try {
      await webrtcManager.answerCall(
        incomingCall.conversationId,
        incomingCall.callerId,
        incomingCall.callType,
        {
          fromUserId: incomingCall.callerId,
          toUserId: currentUserId,
          conversationId: incomingCall.conversationId,
          callType: incomingCall.callType,
          signalType: "offer",
          data: "",
        }
      );

      setLocalStream(webrtcManager.getLocalStream());
      setIncomingCall(null);
    } catch (error) {
      console.error("[Call] Failed to accept call:", error);
      alert("Failed to accept call. Please check camera/microphone permissions.");
      setIncomingCall(null);
    }
  }, [incomingCall, callHub.connection, currentUserId]);

  // Reject incoming call
  const handleRejectCall = useCallback(async () => {
    if (!incomingCall || !callHub.connection) return;

    try {
      await webrtcManager.rejectCall(
        incomingCall.conversationId,
        incomingCall.callerId,
        "Declined by user"
      );
    } catch (error) {
      console.error("[Call] Failed to reject call:", error);
    } finally {
      setIncomingCall(null);
    }
  }, [incomingCall, callHub.connection]);

  // Cancel outgoing call
  const handleCancelCall = useCallback(() => {
    setOutgoingCallType(null);
    webrtcManager.endCall("cancelled");
  }, []);

  // End active call
  const handleEndCall = useCallback(async () => {
    await webrtcManager.endCall();
    handleCallEnded();
  }, []);

  // Handle call ended cleanup
  const handleCallEnded = useCallback(() => {
    setIsActiveCall(false);
    setRemoteStream(null);
    setLocalStream(null);
    setOutgoingCallType(null);
    setIncomingCall(null);
  }, []);

  // ---- EXISTING CHAT FUNCTIONALITY ----
  // (Include all existing functions from the original chat page)
  // ... fetchConversations, loadMessages, handleSendMessage, etc.

  // UI Conversions
  const uiConversations: UiConversation[] = useMemo(() => {
    return filteredConversations.map((conv) => ({
      key: conv.key,
      recipient: conv.recipient,
      messages: conv.messages.map((msg, idx) => ({
        id: idx,
        senderId: msg.senderId,
        sender: msg.senderUsername,
        text: msg.text ?? "",
        timestamp: msg.timestamp,
        imageUrl: msg.imageUrl,
        stickerUrl: msg.stickerUrl,
        isOwn: msg.senderId === currentUserId,
        readBy: msg.readBy,
      })),
      unreadCount: conv.unreadCount,
      lastMessagePreview: conv.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt,
    }));
  }, [filteredConversations, currentUserId]);

  const uiMessages: UiMessage[] = useMemo(() => {
    return messages.map((msg, idx) => ({
      id: idx,
      senderId: msg.senderId,
      sender: msg.senderUsername,
      text: msg.text ?? "",
      timestamp: msg.timestamp,
      imageUrl: msg.imageUrl,
      stickerUrl: msg.stickerUrl,
      isOwn: msg.senderId === currentUserId,
      readBy: msg.readBy,
    }));
  }, [messages, currentUserId]);

  const conversationImages = useMemo(() => {
    return messages
      .filter((m) => m.imageUrl)
      .map((m) => m.imageUrl!)
      .reverse();
  }, [messages]);

  // Placeholder handlers (replace with actual implementations from original)
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    console.log("Send message:", text);
    // Implement actual send logic
  }, []);

  const handleSendSticker = useCallback(async (stickerUrl: string) => {
    console.log("Send sticker:", stickerUrl);
    // Implement actual sticker send logic
  }, []);

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text)",
      }}
    >
      {/* Call Modals - Rendered on top of everything */}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {outgoingCallType && selectedConversation && (
        <OutgoingCallModal
          calleeName={selectedConversation.recipient.username}
          calleeAvatar={selectedConversation.recipient.avatar}
          callType={outgoingCallType}
          onCancel={handleCancelCall}
        />
      )}

      {isActiveCall && selectedConversation && remoteStream && (
        <CallInterface
          remoteStream={remoteStream}
          localStream={localStream}
          callType={outgoingCallType || "video"}
          remoteUserName={selectedConversation.recipient.username}
          onEndCall={handleEndCall}
        />
      )}

      {/* Main Chat Interface */}
      <div className="flex gap-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-full md:w-1/3 lg:w-1/4 flex flex-col"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          <div className="p-4 pb-2">
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <span style={{ fontSize: "1.1rem" }}>🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(34, 211, 238, 0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(34, 211, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ fontSize: "0.9rem" }}>✕</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ChatList
              userId={currentUserId}
              onClose={() => {}}
              onSelect={(conversationKey: string) => {
                const conv = conversations.find((c) => c.key === conversationKey);
                if (conv) {
                  handleConversationSelect(conv.id);
                }
              }}
              conversations={uiConversations}
            />
          </div>
        </aside>

        {/* Chat Area */}
        <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          {selectedConversation ? (
            <>
              <ChatHeader
                recipient={selectedConversation.recipient}
                onBack={() => {}}
                onInfoClick={() => setMediaGalleryOpen(true)}
                onVoiceCall={() => handleStartCall("audio")}
                onVideoCall={() => handleStartCall("video")}
              />
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
                <MessageList
                  messages={uiMessages}
                  currentUser={currentUserId}
                  recipientId={selectedConversation.recipient?.profileId}
                  onImageClick={(imageUrl) => {
                    setViewingImageUrl(imageUrl);
                    setImageViewerOpen(true);
                  }}
                />
              </div>
              <MessageInput
                onSend={handleSendMessage}
                onSendImage={() => {}}
                onSendSticker={handleSendSticker}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p style={{ color: "var(--text-secondary)" }}>
                {t?.("PickAChat") ??
                  "Select a conversation to start messaging."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Image Viewer */}
      {imageViewerOpen && (
        <ImageViewer
          imageUrl={viewingImageUrl}
          onClose={() => setImageViewerOpen(false)}
        />
      )}

      {/* Media Gallery */}
      <MediaGallery
        isOpen={mediaGalleryOpen}
        onClose={() => setMediaGalleryOpen(false)}
        images={conversationImages}
      />
    </div>
  );
}
