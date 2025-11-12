"use client";

import { notFound } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ScrollPanel } from "primereact/scrollpanel";
import { Dialog } from "primereact/dialog";
import ReportDialog from "@/components/ReportDialog";
import EditPostDialog from "@/components/EditPostDialog";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Dock from "@/components/Dock";
import { Separator } from "@/components/Seperator";
import { Badge } from "primereact/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown-menu";
import { MessageCircle, Share2, Lock, Users, Globe, Edit, Trash2, MoreHorizontal, ZoomIn, ZoomOut, Smile } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { mockPost } from "@/lib/mockTest/mockPost";
import { mockCollection } from "@/lib/mockTest/mockCollection";
import { Link, useRouter } from "@/i18n/routing";
import ProfileHoverCard from "@/components/ProfileHoverCard";

type PostPageProps = { params: { id: string } };
type PrivacyType = "public" | "friends" | "private";
type ReactionType = "Like" | "Love" | "Haha" | "Wow" | "Sad" | "Angry";
type CommentItem = { id: string; username: string; text: string; time: string; imageUrl?: string; replies?: CommentItem[] };

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
  const { requireAuth } = useAuth();

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
  const [lightboxLarge, setLightboxLarge] = useState(false);
  const [shareCount, setShareCount] = useState<number>(0);
  // comment reactions (per comment)
  const [commentReactions, setCommentReactions] = useState<Record<string, { counts: Record<ReactionType, number>; user?: ReactionType }>>({});
  const [commentPickerFor, setCommentPickerFor] = useState<string | null>(null);
  const [newCommentImage, setNewCommentImage] = useState<string | null>(null);
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const lastCommentRef = useRef<HTMLDivElement>(null);

  function chooseReaction(type: ReactionType) {
    if (!requireAuth()) return;
    setReactionCounts((prev) => {
      const next = { ...prev } as Record<ReactionType, number>;
      if (userReaction === type) {
        next[type] = Math.max(0, (next[type] || 0) - 1);
        return next;
      }
      if (userReaction) next[userReaction] = Math.max(0, (next[userReaction] || 0) - 1);
      next[type] = (next[type] || 0) + 1;
      return next;
    });
    setUserReaction((prev) => (prev === type ? null : type));
    setPickerOpen(false);
  }
  function chooseCommentReaction(id: string, type: ReactionType) {
    if (!requireAuth()) return;
    setCommentReactions(prev => {
      const entry = prev[id] ?? { counts: { Like:0, Love:0, Haha:0, Wow:0, Sad:0, Angry:0 } as Record<ReactionType, number>, user: undefined as ReactionType | undefined };
      const next = { ...entry, counts: { ...entry.counts } } as { counts: Record<ReactionType, number>; user?: ReactionType };
      if (entry.user === type) {
        next.counts[type] = Math.max(0, (next.counts[type]||0) - 1);
        next.user = undefined;
      } else {
        if (entry.user) next.counts[entry.user] = Math.max(0, (next.counts[entry.user]||0) - 1);
        next.counts[type] = (next.counts[type]||0) + 1;
        next.user = type;
      }
      return { ...prev, [id]: next };
    });
    setCommentPickerFor(null);
  }

  function handleAddComment() {
    if (!requireAuth()) return;
    const txt = newComment.trim();
    if (!txt) return;
    const updated: CommentItem[] = [
      ...comments,
      { id: `c-${Date.now()}`, username: "current_user", text: txt, time: "just now", imageUrl: newCommentImage ?? undefined, replies: [] },
    ];
    setComments(updated);
    setNewComment("");
    setNewCommentImage(null);
    setTimeout(() => {
      lastCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // recursive thread (cap depth at 3)
  const sp = useSearchParams();
  const highlightId = sp.get('comment');
  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`comment-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId]);

  // track expanded replies per comment id
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function renderThread(list: CommentItem[], depth = 1) {
    return list.map((c, idx) => (
      <div key={c.id} id={`comment-${c.id}`} ref={depth === 1 && idx === list.length - 1 ? lastCommentRef : undefined} className="mb-3" style={highlightId===c.id?{ backgroundColor:'rgba(255,223,99,0.15)', borderRadius:8 }:undefined}>
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
            {c.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="attachment" className="mt-2 max-h-60 rounded-lg object-contain" />
            )}
            <div className="mt-1 flex items-center gap-2">
              <Button className="p-button-text p-button-sm" onClick={() => setReplyToId(c.id)}>Reply</Button>
              <Button className="p-button-text p-button-sm" onClick={() => { setReportTarget({ type: "comment" }); setShowReport(true); }}>
                <i className="pi pi-flag" />
              </Button>
              {/* comment reaction */}
              <div className="relative inline-flex items-center gap-2" onMouseEnter={() => setCommentPickerFor(c.id)} onMouseLeave={() => setCommentPickerFor(null)}>
                <Button className="p-button-text p-button-sm" aria-label="React" onClick={() => { const cur = commentReactions[c.id]?.user as ReactionType | undefined; if (cur) { chooseCommentReaction(c.id, cur); } else { setCommentPickerFor(c.id); } }}>
                  {commentReactions[c.id]?.user ? (
                    <span className="text-base">{EMOJI[commentReactions[c.id]!.user!]}</span>
                  ) : (
                    <Smile className="h-3.5 w-3.5" />
                  )}
                </Button>
                {commentPickerFor === c.id && (
                  <div className="absolute z-10 mt-8 bg-black/70 text-white rounded-full px-2 py-1 flex items-center gap-2">
                    {["Like","Love","Haha","Wow","Sad","Angry"].map(r => (
                      <button key={r} className="text-xl hover:scale-110 transition" onClick={() => chooseCommentReaction(c.id, r as ReactionType)}>{EMOJI[r as ReactionType]}</button>
                    ))}
                  </div>
                )}
                <span className="text-xs opacity-70">
                  {Object.values(commentReactions[c.id]?.counts ?? {}).reduce((a,b)=>a+b,0) || 0}
                </span>
              </div>
            </div>
            {replyToId === c.id && (
              <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ overflow: 'visible' }}>
                <InputText value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1" placeholder="Write a reply" />
                <label className="p-2 rounded-lg cursor-pointer text-xs" title="Attach image" style={{ border: '1px solid var(--border)' }}>
                  <i className="pi pi-image" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; setReplyImage(URL.createObjectURL(f)); }} />
                </label>
                {replyImage && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={replyImage} alt="preview" className="h-16 max-w-[120px] rounded-lg object-cover" />
                    <Button className="p-button-text p-button-sm" label="Remove" onClick={() => setReplyImage(null)} />
                  </div>
                )}
                <Button className="p-button-sm" label="Reply" onClick={() => { if (!requireAuth()) return;
                  const t = replyText.trim(); if (!t) return;
                  const next = structuredClone(comments) as CommentItem[];
                  // Attach to root-level thread (only one child layer)
                  function containsId(arr: CommentItem[]|undefined, id: string): boolean {
                    if (!arr) return false; for (const x of arr){ if (x.id===id) return true; if (containsId(x.replies, id)) return true; } return false;
                  }
                  for (const root of next) {
                    if (root.id === c.id || containsId(root.replies, c.id)) {
                      root.replies = root.replies ?? [];
                      root.replies.push({ id: `r-${Date.now()}`, username: 'current_user', text: t, time: 'just now', imageUrl: replyImage ?? undefined, replies: [] });
                      break;
                    }
                  }
                  setComments(next); setReplyToId(null); setReplyText("");
                  setReplyImage(null);
                }} />
                <Button className="p-button-text p-button-sm" label="Cancel" onClick={() => { setReplyToId(null); setReplyText(""); setReplyImage(null); }} />
              </div>
            )}
          </div>
        </div>
        {c.replies && c.replies.length > 0 && (
          <div className="ml-8 mt-2 border-l pl-3">
            {(() => {
              // Flatten any nested to one level
              const gather = (arr: CommentItem[]|undefined, out: CommentItem[] = []) => { (arr??[]).forEach(x=>{ out.push({ ...x, replies: [] }); gather(x.replies, out); }); return out; };
              const flat = gather(c.replies);
              const open = !!expanded[c.id];
              const slice = open ? flat : flat.slice(0,2);
              return <>
                {slice.map((r) => (
                  <div key={r.id} className="mb-2">
                    <div className="flex items-start">
                      <Avatar className="h-8 w-8 mr-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.pravatar.cc/150?u=${r.username}`} alt={r.username} className="rounded-full" />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm">{r.username}</div>
                          <div className="text-gray-400 text-xs">{r.time}</div>
                        </div>
                        <p className="text-sm break-words">{r.text}</p>
                        {r.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.imageUrl} alt="attachment" className="mt-1 max-h-52 rounded-lg object-contain" />
                        )}
                        <div className="mt-1 inline-flex items-center gap-2">
                          <Button className="p-button-text p-button-sm" onClick={() => setReplyToId(r.id)}>Reply</Button>
                          <div className="relative inline-flex items-center gap-1" onMouseEnter={() => setCommentPickerFor(r.id)} onMouseLeave={() => setCommentPickerFor(null)}>
                            <Button className="p-button-text p-button-sm" aria-label="React" onClick={() => { const cur = commentReactions[r.id]?.user as ReactionType | undefined; if (cur) { chooseCommentReaction(r.id, cur); } else { setCommentPickerFor(prev => prev===r.id?null:r.id); } }}>
                              {renderCommentReactionIcon(commentReactions[r.id]?.user as ReactionType | undefined)}
                            </Button>
                            {commentPickerFor === r.id && (
                              <div className="absolute z-10 mt-8 bg-black/70 text-white rounded-full px-2 py-1 flex items-center gap-2">
                                {["Like","Love","Haha","Wow","Sad","Angry"].map(x => (
                                  <button key={x} className="text-xl hover:scale-110 transition" onClick={() => chooseCommentReaction(r.id, x as ReactionType)}>{EMOJI[x as ReactionType]}</button>
                                ))}
                              </div>
                            )}
                            <span className="text-xs opacity-70">{Object.values(commentReactions[r.id]?.counts ?? {}).reduce((a,b)=>a+b,0) || 0}</span>
                          </div>
                        </div>
                        {replyToId === r.id && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ overflow: 'visible' }}>
                            <InputText value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1" placeholder="Write a reply" />
                            <label className="p-2 rounded-lg cursor-pointer text-xs" title="Attach image" style={{ border: '1px solid var(--border)' }}>
                              <i className="pi pi-image" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; setReplyImage(URL.createObjectURL(f)); }} />
                            </label>
                            {replyImage && (
                              <div className="flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={replyImage} alt="preview" className="h-16 max-w-[120px] rounded-lg object-cover" />
                                <Button className="p-button-text p-button-sm" label="Remove" onClick={() => setReplyImage(null)} />
                              </div>
                            )}
                            <Button className="p-button-sm" label="Reply" onClick={() => { if (!requireAuth()) return;
                              const t = replyText.trim(); if (!t) return;
                              const next = structuredClone(comments) as CommentItem[];
                              function attachToRoot(arr: CommentItem[], rootId: string, child: CommentItem){ for (const root of arr){ if (root.id===rootId || (root.replies ?? []).some(x=>x.id===rootId) || (root.replies ?? []).some(x=> (x.replies??[]).some(y=>y.id===rootId))){ root.replies = root.replies ?? []; root.replies.push(child); return true;} } return false; }
                              attachToRoot(next, r.id, { id: `r-${Date.now()}`, username: 'current_user', text: t, time: 'just now', imageUrl: replyImage ?? undefined, replies: [] });
                              setComments(next); setReplyToId(null); setReplyText(""); setReplyImage(null);
                            }} />
                            <Button className="p-button-text p-button-sm" label="Cancel" onClick={() => { setReplyToId(null); setReplyText(""); setReplyImage(null); }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {flat.length > 2 && (
                  <button className="text-xs opacity-70 hover:opacity-100" onClick={() => setExpanded(m => ({ ...m, [c.id]: !open }))}>{open ? 'Show less' : `View more replies (${flat.length - 2})`}</button>
                )}
              </>;
            })()}
          </div>
        )}
      </div>
    ));
  }

  function totalComments(list: CommentItem[]): number {
    let n = 0;
    const walk = (arr: CommentItem[] | undefined) => {
      (arr ?? []).forEach((c) => {
        n += 1;
        if (c.replies && c.replies.length) walk(c.replies);
      });
    };
    walk(list);
    return n;
  }

  const EMOJI: Record<ReactionType, string> = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😡",
  };

  function renderCommentReactionIcon(rt?: ReactionType | null) {
    return rt ? (
      <span className="text-base">{EMOJI[rt]}</span>
    ) : (
      <Smile className="h-3.5 w-3.5 opacity-60" />
    );
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
                    <ProfileHoverCard
                      user={{ id: post.username, username: post.username, name: post.username, avatarUrl: post.avatar }}
                    >
                      <Link href={`/profile/${post.username}`} className="block">
                        <Avatar className="h-12 w-12 cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.avatar} alt={post.username} className="rounded-full" />
                        </Avatar>
                      </Link>
                    </ProfileHoverCard>
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
                      <Button className="p-button-rounded p-button-text" aria-label="React" onClick={() => chooseReaction('Like')}>
                        {userReaction ? (
                          <span className="text-xl">{({ Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😡" } as any)[userReaction]}</span>
                        ) : (
                          <Smile className="h-4 w-4" />
                        )}
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
                      <span className="inline-flex items-center gap-1"><MessageCircle /> {totalComments(comments)}</span>
                    </Button>
                    <Button className="p-button-rounded p-button-text" aria-label="Share" onClick={() => setShareOpen(true)}>
                      <span className="inline-flex items-center gap-1"><Share2 /> {shareCount}</span>
                    </Button>
                  </div>
                  {/* Download moved into dropdown menu */}
                </div>
                <div className="flex items-center mt-4">
                  <InputText value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" />
                  <label className="ml-2 p-2 rounded-lg cursor-pointer" title="Attach image" style={{ border: '1px solid var(--border)' }}>
                    <i className="pi pi-image" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; setNewCommentImage(URL.createObjectURL(f)); }} />
                  </label>
                  <Button type="button" severity="info" onClick={handleAddComment} className="ml-2 p-button-sm">Post</Button>
                </div>
                {newCommentImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newCommentImage} alt="attachment" className="mt-2 max-h-60 rounded-lg object-contain" />
                )}
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
        <Dialog header="Share post" visible={shareOpen} onHide={() => setShareOpen(false)} style={{ width: 520 }} footer={<div className="flex justify-between w-full">
          <div />
          <div className="flex gap-2">
            <Button label="Close" className="p-button-text" onClick={() => setShareOpen(false)} />
          </div>
        </div>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button label="Share to chat" icon="pi pi-send" onClick={() => { setShareRecipient("elenavoyage"); setShareCount(c=>c+1); alert("Shared to chat with @elenavoyage (mock)"); setShareOpen(false); }} />
              <Button label="Share to profile" icon="pi pi-user" onClick={() => { setShareCount(c=>c+1); alert("Shared to your profile (mock)"); setShareOpen(false); }} />
            </div>
            {/* Save to collection (mock) */}
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="text-sm font-medium mb-2">Save to one of your collections</div>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto">
                {mockCollection.map(c => (
                  <button key={c.id} onClick={() => { alert(`Saved to collection "${c.title}" (mock)`); setShareOpen(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:opacity-100" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.coverUrl} alt={c.title} className="w-10 h-10 object-cover rounded" />
                    <div className="text-left">
                      <div className="text-sm">{c.title}</div>
                      <div className="text-xs opacity-70">{c.count} photos</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs opacity-70">Mock actions only</div>
          </div>
        </Dialog>
        <Dialog visible={lightbox} onHide={() => { setLightbox(false); setLightboxLarge(false); }}
          style={{ width: '80vw', maxWidth: 1100 }}
          header={null} closable modal>
          <div className="relative overflow-auto" style={{ maxHeight: '85vh' }}>
            <button
              className="absolute top-2 right-2 p-2 rounded-full"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              onClick={() => setLightboxLarge(v => !v)}
              title={lightboxLarge ? 'Zoom out' : 'Zoom in'}
            >
              {lightboxLarge ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.caption}
              className={`mx-auto object-contain transition-transform ${lightboxLarge ? 'scale-110' : 'scale-100'}`}
              style={{ maxHeight: lightboxLarge ? '85vh' : '70vh', maxWidth: lightboxLarge ? '95vw' : '80vw' }}
            />
          </div>
        </Dialog>
      </main>
    </div>
  );
}



