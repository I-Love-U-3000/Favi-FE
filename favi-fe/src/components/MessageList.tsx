"use client";

import { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";

interface Message {
  id: number;
  senderId: string;       // <-- thêm
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  readBy?: string[]; // Array of profile IDs who have read this message
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  recipientId?: string; // Recipient's profile ID (for DM read receipts)
}

// Threshold in pixels to consider "at the bottom"
const BOTTOM_THRESHOLD = 50;

export default function MessageList({ messages, currentUser, recipientId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = (smooth = false) => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  // Check if user is at the bottom
  const checkIfAtBottom = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    setIsAtBottom(distanceFromBottom <= BOTTOM_THRESHOLD);
  };

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkIfAtBottom);
    return () => container.removeEventListener('scroll', checkIfAtBottom);
  }, []);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!initialScrollDone && messages.length > 0) {
      // Use setTimeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        scrollToBottom();
        setInitialScrollDone(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, initialScrollDone]);

  // Auto-scroll when new messages arrive AND user is at the bottom
  useEffect(() => {
    if (!initialScrollDone || messages.length === 0) return;

    // Check if user is at bottom directly (don't rely on cached state)
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const currentlyAtBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      if (currentlyAtBottom) {
        const timeoutId = setTimeout(() => scrollToBottom(true), 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages.length, initialScrollDone]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 220px)",
        overflowY: "auto",
        overflowX: "hidden"
      }}
      className="flex-grow"
    >
      <div className="p-4 flex flex-col gap-3">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isSent={message.senderId === currentUser} // so sánh ID, không so sánh username
            recipientId={recipientId}
            currentUserId={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
