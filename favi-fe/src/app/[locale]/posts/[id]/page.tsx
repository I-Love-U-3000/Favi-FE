"use client";

import { notFound } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ScrollPanel } from "primereact/scrollpanel";
import { Dialog } from "primereact/dialog";
import ReportDialog from "@/components/ReportDialog";
import EditPostDialog from "@/components/EditPostDialog";
import { useRef, useState } from "react";
import Dock from "@/components/Dock";
import { Separator } from "@/components/Seperator";
import { Badge } from "primereact/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown-menu";
import { MessageCircle, Share2, Lock, Users, Globe, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { mockPost } from "@/lib/mockTest/mockPost";
import { useRouter } from "@/i18n/routing";

type PostPageProps = { params: { id: string } };
type PrivacyType = "public" | "friends" | "private";
type ReactionType = "Like" | "Love" | "Haha" | "Wow" | "Sad" | "Angry";
type CommentItem = { id: string; username: string; text: string; time: string; replies?: CommentItem[] };

const seedPosts = [
  {
    username: "markpawson",
    avatar: "https://i.pravatar.cc/150?img=1",
    image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6",
    caption: "A cute puppy playing in a field of flowers.",
    id: "1",
    tags: ["animal", "dog", "puppy", "cute", "nature"],
    likes: 123,
    comments: [{ id: "c1", username: "elenavoyage", text: "So adorable!", time: "5 hours ago" }],
    privacy: "public" as PrivacyType,
  },
];

const PrivacyIcon = ({ privacy }: { privacy: PrivacyType }) => {
  const props = { className: "h-4 w-4 mr-2" } as const;
  switch (privacy) {
    case "private":
      return <Lock {...props} />;
    case "friends":
      return <Users {...props} />;
    default:
      return <Globe {...props} />;
  }
};

export default function PostPage({ params }: PostPageProps) {
  const { id } = params;
  const router = useRouter();

  let post = seedPosts.find((p) => p.id === id) as any;
  if (!post) {
    const fromMock =
      mockPost.find((mp) => mp.id === id) ?? (() => {
        const m = id.match(/(\d+)/);
        const n = m ? Math.max(1, parseInt(m[1], 10)) : 1;
        return mockPost[(n - 1) % mockPost.length];
      })();
    if (fromMock) {
      post = {
        username: "mockuser",
        avatar: "https://i.pravatar.cc/150?img=1",
        image: fromMock.imageUrl,
        caption: fromMock.alt ?? "",
        id,
        tags: fromMock.tags ?? [],
        likes: fromMock.likeCount ?? 0,
        comments: [],
        privacy: "public" as PrivacyType,
      };
    } else {
      notFound();
    }
  }

  const [comments, setComments] = useState<CommentItem[]>(
    Array.isArray(post.comments)
      ? (post.comments as any[]).map((c, i) => ({
          id: c.id ?? `c${i + 1}`,
          username: c.username,
          text: c.text,
          time: c.time,
          replies: (c.replies as CommentItem[] | undefined) ?? [],
        }))
      : []
  );
  const [newComment, setNewComment] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [privacy, setPrivacy] = useState<PrivacyType>(post.privacy);
  const isAuthor = post.username === "markpawson";
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment" | "user"; name?: string } | null>(null);
  const [showEditPost, setShowEditPost] = useState(false);
  const [relatedCount, setRelatedCount] = useState(24);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  // Reactions (mock)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    Like: Math.max(0, Number(post.likes) || 0),
    Love: 0,
    Haha: 0,
    Wow: 0,
    Sad: 0,
    Angry: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareRecipient, setShareRecipient] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const lastCommentRef = useRef<HTMLDivElement>(null);

  function chooseReaction(type: ReactionType) {
    setReactionCounts((prev) => {
      const next = { ...prev } as Record<ReactionType, number>;
      if (userReaction) next[userReaction] = Math.max(0, (next[userReaction] || 0) - 1);
      next[type] = (next[type] || 0) + 1;
      return next;
    });
    setUserReaction(type);
    setPickerOpen(false);
  }

  function handleAddComment() {
    const txt = newComment.trim();
    if (!txt) return;
    const updated: CommentItem[] = [
      ...comments,
      { id: `c-${Date.now()}`, username: "current_user", text: txt, time: "just now", replies: [] },
    ];
    setComments(updated);
    setNewComment("");
    setTimeout(() => {
      lastCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // recursive thread (cap depth at 3)
  // track expanded replies per comment id
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function renderThread(list: CommentItem[], depth = 1) {
    return list.map((c, idx) => (
      <div key={c.id} ref={depth === 1 && idx === list.length - 1 ? lastCommentRef : undefined} className="mb-3">
        <div className="flex items-start">
          <Avatar className="h-10 w-10 mr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.pravatar.cc/150?u=${c.username}`} alt={c.username} className="rounded-full" />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{c.username}</div>
              <div className="text-[12px] opacity-70">{c.time}</div>
            </div>
            <p className="mt-1 break-words">{c.text}</p>
            <div className="mt-1 flex items-center gap-2">
              <Button className="p-button-text p-button-sm" onClick={() => setReplyToId(c.id)}>Reply</Button>
              <Button className="p-button-text p-button-sm" onClick={() => { setReportTarget({ type: "comment" }); setShowReport(true); }}>
                <i className="pi pi-flag" />
              </Button>
            </div>
            {replyToId === c.id && (
              <div className="mt-2 flex items-center gap-2">
                <InputText value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1" placeholder="Write a reply" />
                <Button className="p-button-sm" label="Reply" onClick={() => {
                  const t = replyText.trim(); if (!t) return;
                  const next = structuredClone(comments) as CommentItem[];
                  function attach(arr: CommentItem[], id: string, d = 1): boolean {
                    for (const it of arr) {
                      if (it.id === id) {
                        it.replies = it.replies ?? [];
                        it.replies.push({ id: `r-${Date.now()}`, username: 'current_user', text: t, time: 'just now', replies: [] });
                        return true;
                      }
                      if (d < 3 && it.replies && attach(it.replies, id, d + 1)) return true;
                    }
                    return false;
                  }
                  attach(next, c.id);
                  setComments(next); setReplyToId(null); setReplyText("");
                }} />
                <Button className="p-button-text p-button-sm" label="Cancel" onClick={() => { setReplyToId(null); setReplyText(""); }} />
              </div>
            )}
          </div>
        </div>
        {c.replies && c.replies.length > 0 && (
          <div className="ml-8 mt-2 border-l pl-3">
            {(() => {
              const reps = c.replies ?? [];
              const open = !!expanded[c.id];
              const slice = open ? reps : reps.slice(0, 2);
              return (
                <>
                  {renderThread(slice, Math.min(3, depth + 1))}
                  {reps.length > 2 && (
                    <button className="text-xs opacity-70 hover:opacity-100" onClick={() => setExpanded((m) => ({ ...m, [c.id]: !open }))}>
                      {open ? 'Show less' : `View more replies (${reps.length - 2})`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    ));
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <Dock />
      </div>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          {/* Top block: image + details */}
          <div className="grid md:grid-cols-[1fr_420px] gap-4">
            <div className="bg-black/5 rounded-xl p-4 grid place-items-center min-h-[400px]" style={{ overflow: 'visible' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image} alt={post.caption} className="rounded-lg object-contain w-full h-full max-h-[80vh] shadow-lg cursor-zoom-in" onClick={() => setLightbox(true)} />
            </div>
            <div className="rounded-xl" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.avatar} alt={post.username} className="rounded-full" />
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-lg">{post.username}</h2>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>@{post.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isAuthor && <Button label="Follow" size="small" severity="secondary" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="p-button-rounded p-button-text">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-700 text-white">
                        {isAuthor && (
                          <DropdownMenuItem onClick={() => setShowEditPost(true)} className="hover:bg-gray-600 transition-colors">
                            <Edit className="mr-2 h-4 w-4" /> Edit post
                          </DropdownMenuItem>
                        )}
                        {!isAuthor && (
                          <DropdownMenuItem onClick={() => { setReportTarget({ type: "post" }); setShowReport(true); }} className="hover:bg-gray-600 transition-colors">
                            <i className="pi pi-flag mr-2" /> Report post
                          </DropdownMenuItem>
                        )}
                        {!isAuthor && (
                          <DropdownMenuItem onClick={() => { setReportTarget({ type: "user", name: post.username }); setShowReport(true); }} className="hover:bg-gray-600 transition-colors">
                            <i className="pi pi-user-minus mr-2" /> Report user
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setPrivacy("public")} className="hover:bg-gray-600 transition-colors">
                          <Globe className="mr-2 h-4 w-4" /> Set to Public
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPrivacy("friends")} className="hover:bg-gray-600 transition-colors">
                          <Users className="mr-2 h-4 w-4" /> Set to Friends
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPrivacy("private")} className="hover:bg-gray-600 transition-colors">
                          <Lock className="mr-2 h-4 w-4" /> Set to Private
                        </DropdownMenuItem>
                        {isAuthor && (
                          <DropdownMenuItem className="text-red-500 hover:bg-gray-600 transition-colors">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          const url = typeof window !== 'undefined' ? window.location.origin + `/posts/${post.id}` : `/posts/${post.id}`;
                          navigator.clipboard?.writeText?.(url);
                          alert('Link copied to clipboard');
                        }} className="hover:bg-gray-600 transition-colors">
                          <i className="pi pi-link mr-2" /> Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const link = document.createElement('a');
                          link.href = post.image;
                          link.download = post.caption || 'image.jpg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }} className="hover:bg-gray-600 transition-colors">
                          <i className="pi pi-download mr-2" /> Download image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <p>{post.caption}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} value={tag} severity="info" className="bg-blue-600 text-white p-1 cursor-pointer" onClick={() => router.push(`/search?mode=tag&tag=${encodeURIComponent(tag)}`)} />
                  ))}
                </div>
                <Separator />
                <ScrollPanel style={{ height: "400px" }}>{renderThread(comments)}</ScrollPanel>
                <Separator />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between" style={{ overflow: 'visible' }}>
                  <div className="flex items-center gap-2">
                    <div className="relative" onMouseEnter={() => setPickerOpen(true)} onMouseLeave={() => setPickerOpen(false)}>
                      <Button className="p-button-rounded p-button-text" aria-label="React">
                        <span className="text-xl">{userReaction ? ({ Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😡" } as any)[userReaction] : "👍"}</span>
                      </Button>
                      {pickerOpen && (
                        <div className="absolute z-10 bg-black/70 text-white rounded-full px-2 py-1 flex items-center gap-2">
                          {(["Like", "Love", "Haha", "Wow", "Sad", "Angry"] as ReactionType[]).map((r) => (
                            <button key={r} className="text-xl hover:scale-110 transition" onClick={() => chooseReaction(r)} title={r}>
                              {({ Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😡" } as any)[r]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm opacity-70">{Object.values(reactionCounts).reduce((a, b) => a + b, 0)} reactions</div>
                    <Button className="p-button-rounded p-button-text" aria-label="Comment">
                      <MessageCircle />
                    </Button>
                    <Button className="p-button-rounded p-button-text" aria-label="Share" onClick={() => setShareOpen(true)}>
                      <Share2 />
                    </Button>
                  </div>
                  {/* Download moved into dropdown menu */}
                </div>
                <div className="flex items-center mt-4">
                  <InputText value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" />
                  <Button type="button" severity="info" onClick={handleAddComment} className="ml-2 p-button-sm">Post</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Related grid BELOW */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Related photos</h3>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-3 [column-fill:_balance]">
              {Array.from({ length: relatedCount }).map((_, i) => {
                const p = mockPost[i % mockPost.length];
                return (
                  <a key={`rel-${i}`} href={`/posts/${p.id}`} className="mb-3 block break-inside-avoid rounded-xl overflow-hidden ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.alt ?? ""} className="w-full h-auto block" />
                  </a>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center">
              <Button label="Load more" onClick={() => setRelatedCount((n) => n + mockPost.length)} />
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <ReportDialog visible={showReport} onHide={() => setShowReport(false)} targetType={(reportTarget?.type ?? "post") as any} targetName={reportTarget?.name} />
        <EditPostDialog visible={showEditPost} onHide={() => setShowEditPost(false)} initialCaption={post.caption} initialTags={post.tags} initialPrivacy={privacy} />
        <Dialog header="Share post" visible={shareOpen} onHide={() => setShareOpen(false)} style={{ width: 480 }} footer={<div className="flex justify-end gap-2"><Button label="Close" className="p-button-text" onClick={() => setShareOpen(false)} /></div>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button label="Share to chat" icon="pi pi-send" onClick={() => { setShareRecipient("elenavoyage"); alert("Shared to chat with @elenavoyage (mock)"); setShareOpen(false); }} />
              <Button label="Share to profile" icon="pi pi-user" onClick={() => { alert("Shared to your profile (mock)"); setShareOpen(false); }} />
            </div>
            <div className="text-xs opacity-70">Mock action only</div>
          </div>
        </Dialog>
        <Dialog visible={lightbox} onHide={() => setLightbox(false)} style={{ width: '90vw', maxWidth: 1200 }} header={null} closable modal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt={post.caption} className="w-full h-full object-contain" />
        </Dialog>
      </main>
    </div>
  );
}
