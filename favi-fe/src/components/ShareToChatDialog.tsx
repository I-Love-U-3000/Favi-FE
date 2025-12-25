"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import chatAPI from "@/lib/api/chatAPI";
import type { ConversationSummaryResponse } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";

interface Conversation {
  id: string;
  username: string;
  avatar: string;
}

type ShareToChatDialogProps = {
  visible: boolean;
  postId: string;
  onShared: () => void;
  onClose: () => void;
};

export default function ShareToChatDialog({
  visible,
  postId,
  onShared,
  onClose,
}: ShareToChatDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sharing, setSharing] = useState<string | null>(null);
  const [sharingToProfile, setSharingToProfile] = useState(false);

  useEffect(() => {
    if (!visible || !user) {
      setConversations([]);
      return;
    }

    const loadConversations = async () => {
      setLoading(true);
      try {
        const data = await chatAPI.getConversations(1, 50);
        const mapped: Conversation[] = data
          .map((c) => {
            const other =
              c.members.find((m) => m.profileId !== user.id) ?? c.members[0];
            return {
              id: c.id,
              username: other?.username ?? "unknown",
              avatar: other?.avatarUrl ?? "/avatar-default.svg",
            };
          })
          .filter((c) => c.username !== "unknown");
        setConversations(mapped);
      } catch (e) {
        console.error("Error loading conversations", e);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [visible, user]);

  useEffect(() => {
    // Reset search when dialog opens/closes
    if (!visible) {
      setSearch("");
      setSharing(null);
      setSharingToProfile(false);
    }
  }, [visible]);

  const filteredConversations = conversations.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = async (conversationId: string) => {
    setSharing(conversationId);
    try {
      const postLink = `${window.location.origin}/posts/${postId}`;
      await chatAPI.sendMessage(conversationId, {
        content: postLink,
        postId,
      });

      onShared();
      onClose();
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to share post");
    } finally {
      setSharing(null);
    }
  };

  const handleShareToProfile = async () => {
    if (!user?.id) {
      alert("You need to login to share to profile");
      return;
    }

    setSharingToProfile(true);
    try {
      // Mock functionality - TODO: implement actual share to profile
      await new Promise(resolve => setTimeout(resolve, 500));
      alert("Post shared to your profile successfully! (Mock)");
      onShared();
      onClose();
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to share post to profile");
    } finally {
      setSharingToProfile(false);
    }
  };

  const handleCopyLink = () => {
    const postLink = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard?.writeText(postLink);
    alert("Link copied to clipboard!");
    onShared();
    onClose();
  };

  const postLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${postId}`;

  return (
    <Dialog
      header="Share Post"
      visible={visible}
      onHide={onClose}
      modal
      style={{ width: '500px', maxWidth: '95vw' }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label="Cancel"
            className="p-button-text"
            onClick={onClose}
            disabled={sharing !== null || sharingToProfile}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Share to Profile Section */}
        {user && (
          <div>
            <button
              type="button"
              onClick={handleShareToProfile}
              disabled={sharingToProfile || sharing !== null}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              <i className="pi pi-user text-2xl" style={{ color: "var(--primary)" }} />
              <div className="flex-1">
                <div className="text-sm font-semibold">Share to your profile</div>
                <div className="text-xs opacity-70">Post this on your own profile</div>
              </div>
              {sharingToProfile ? (
                <i className="pi pi-spin pi-spinner text-sm" style={{ color: "var(--primary)" }} />
              ) : (
                <i className="pi pi-chevron-right text-sm opacity-60" />
              )}
            </button>
          </div>
        )}

        {/* Copy Link Section */}
        <div>
          <div className="text-sm mb-2 font-semibold">Share via link</div>
          <div className="flex gap-2">
            <InputText
              value={postLink}
              readOnly
              className="flex-1"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <Button
              label="Copy"
              icon="pi pi-copy"
              onClick={handleCopyLink}
              disabled={sharing !== null || sharingToProfile}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: "var(--border)" }}></div>

        {/* Share to Chat Section */}
        <div>
          <div className="text-sm mb-3 font-semibold">Share to chat</div>

          {/* Search */}
          <div className="mb-3">
            <InputText
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Conversations List */}
          <div
            className="border rounded-lg overflow-auto"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-secondary)",
              maxHeight: "300px",
            }}
          >
            {loading ? (
              <div className="text-sm opacity-70 text-center py-8">
                <i className="pi pi-spin pi-spinner text-2xl mb-2" />
                <p>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-sm opacity-70 text-center py-8">
                <i className="pi pi-comments text-3xl mb-2" />
                <p>
                  {search
                    ? "No conversations found"
                    : "No conversations yet. Start a chat first!"}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
                    onClick={() => handleShare(conv.id)}
                    disabled={sharing === conv.id || sharingToProfile}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={conv.avatar}
                      alt={conv.username}
                      className="w-10 h-10 rounded-full border object-cover"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <span className="text-sm font-medium flex-1">
                      @{conv.username}
                    </span>
                    {sharing === conv.id ? (
                      <i className="pi pi-spin pi-spinner text-sm" style={{ color: "var(--primary)" }} />
                    ) : (
                      <i className="pi pi-send text-sm opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
