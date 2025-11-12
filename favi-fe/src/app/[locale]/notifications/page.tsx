"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "primereact/button";

type NType = "reply" | "friend_request" | "accepted" | "rejected" | "mention" | "post";
type Noti = {
  id: string;
  type: NType;
  text: string;
  from: string; // username
  at: string;
  read?: boolean;
  postId?: string;
  commentId?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const initial = useMemo<Noti[]>(
    () => [
      { id: "n1", type: "reply", text: "replied to your comment", from: "elenavoyage", at: "2m", read: false, postId: "p_1", commentId: "c1" },
      { id: "n2", type: "friend_request", text: "sent you a follow request", from: "john_doe", at: "10m" },
      { id: "n3", type: "accepted", text: "accepted your request", from: "sarah_smith", at: "1h" },
      { id: "n4", type: "rejected", text: "rejected your request", from: "keanu", at: "3h" },
      { id: "n5", type: "mention", text: "mentioned you in a tag", from: "alex", at: "yesterday", postId: "p_2", commentId: "c2" },
      { id: "n6", type: "post", text: "featured your post", from: "system", at: "2d", postId: "p_3" },
    ],
    []
  );
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<NType | "all">("all");

  const filtered = items.filter((n) => (filter === "all" ? true : n.type === filter));

  function markAllRead() {
    setItems((ls) => ls.map((n) => ({ ...n, read: true })));
  }

  function open(n: Noti) {
    setItems((ls) => ls.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    // Navigate by type
    if ((n.type === "reply" || n.type === "mention") && n.postId && n.commentId) {
      router.push(`/posts/${n.postId}?comment=${encodeURIComponent(n.commentId)}`);
      return;
    }
    if (n.type === "friend_request" || n.type === "accepted" || n.type === "rejected") {
      router.push(`/profile/${encodeURIComponent(n.from)}`);
      return;
    }
    if (n.type === "post" && n.postId) {
      router.push(`/posts/${n.postId}`);
      return;
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button label="Mark all read" className="p-button-text" onClick={markAllRead} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "reply", "friend_request", "accepted", "rejected", "mention"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`px-3 py-1.5 text-xs rounded-full ${filter === t ? "bg-black/10" : "bg-black/5"}`}
            style={{ border: "1px solid var(--border)" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((n) => (
          <button key={n.id} onClick={() => open(n)} className="flex items-center justify-between rounded-xl p-3 w-full text-left hover:opacity-100" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)", opacity: n.read ? 0.7 : 1 }}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.pravatar.cc/80?u=${n.from}`} alt={n.from} className="w-10 h-10 rounded-full" />
              <div>
                <div className="text-sm"><b>@{n.from}</b> {n.text}</div>
                <div className="text-xs opacity-70">{n.at}</div>
              </div>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
          </button>
        ))}
      </div>
    </div>
  );
}
