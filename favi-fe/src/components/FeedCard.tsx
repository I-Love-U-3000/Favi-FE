"use client";

import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Dialog } from "primereact/dialog";
import { Share2 } from "lucide-react";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { mockCollection } from "@/lib/mockTest/mockCollection";
export type Feed = {
  id: string;
  date: { day: string; mon: string }; // {day:'08', mon:'MAY'}
  cover: string;
  title: string;
  desc: string;
  host: { name: string; role: string; avatar: string };
  stats: { comments: number; likes: number; saves: number };
};

export default function FeedCard({ f }: { f: Feed }) {
  const [reactionCounts, setReactionCounts] = useState<{ Like: number; Love: number; Haha: number; Wow: number; Sad: number; Angry: number }>({
    Like: f.stats?.likes ?? 0,
    Love: 0,
    Haha: 0,
    Wow: 0,
    Sad: 0,
    Angry: 0,
  });
  const [userReaction, setUserReaction] = useState<keyof typeof reactionCounts | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCount, setShareCount] = useState<number>(typeof f.stats?.saves === 'number' ? f.stats.saves : 0);

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const chooseReaction = (type: keyof typeof reactionCounts) => {
    setReactionCounts(prev => {
      const next = { ...prev };
      if (userReaction === type) {
        next[type] = Math.max(0, (next[type] || 0) - 1);
        return next;
      }
      if (userReaction) next[userReaction] = Math.max(0, (next[userReaction] || 0) - 1);
      next[type] = (next[type] || 0) + 1;
      return next;
    });
    setUserReaction(prev => (prev === type ? null : type));
    setPickerOpen(false);
  };
  return (
    <>
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="grid sm:grid-cols-[1fr]">
        {/* Cover */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.cover} alt={f.title} className="w-full h-60 object-cover" />
        {/* Body */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center rounded-xl bg-blue-600 text-white px-3 py-2 leading-tight text-center">
              <div className="text-xs">{f.date.mon}</div>
              <div className="text-xl font-bold -mt-1">{f.date.day}</div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{f.desc}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ProfileHoverCard
                    user={{
                      id: f.host.name,
                      username: (f.host.name || "").toLowerCase().replace(/\s+/g, ""),
                      name: f.host.name,
                      avatarUrl: f.host.avatar,
                    }}
                  >
                    <Link
                      href={`/profile/${(f.host.name || "").toLowerCase().replace(/\s+/g, "")}`}
                      className="block"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Avatar className="h-8 w-8 cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.host.avatar} alt={f.host.name} className="rounded-full" />
                      </Avatar>
                    </Link>
                  </ProfileHoverCard>
                  <div>
                    <div className="text-sm font-medium">{f.host.name}</div>
                    <div className="text-xs text-gray-500">{f.host.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <i className="pi pi-comments" /> {f.stats.comments}
                  </span>
                  <div className="relative inline-flex items-center gap-2"
                       onMouseEnter={() => setPickerOpen(true)}
                       onMouseLeave={() => setPickerOpen(false)}
                       onClick={(e) => e.stopPropagation()}>
                    <Button className="p-button-rounded p-button-text" aria-label="React" onClick={(e) => { e.stopPropagation(); chooseReaction('Like'); }}>
                      <span className={`text-base ${userReaction ? '' : 'opacity-60'}`}>{userReaction ? ({ Like:'👍', Love:'❤️', Haha:'😂', Wow:'😮', Sad:'😢', Angry:'😡' } as any)[userReaction] : '👍'}</span>
                    </Button>
                    {pickerOpen && (
                      <div className="absolute z-10 bg-black/70 text-white rounded-full px-2 py-1 flex items-center gap-2" onClick={(e)=>e.stopPropagation()}>
                        {["Like","Love","Haha","Wow","Sad","Angry"].map(r => (
                          <button key={r} className="text-xl hover:scale-110 transition" onClick={() => chooseReaction(r as any)} title={r}>
                            {({ Like:'👍', Love:'❤️', Haha:'😂', Wow:'😮', Sad:'😢', Angry:'😡' } as any)[r]}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1">{totalReactions}</span>
                  </div>
                  <Button className="p-button-rounded p-button-text" aria-label="Share" onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}>
                    <span className="inline-flex items-center gap-1"><Share2 /> {shareCount}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </article>
    <Dialog header="Share post" visible={shareOpen} onHide={() => setShareOpen(false)} style={{ width: 520 }} footer={<div className="flex justify-between w-full"><div /><div className="flex gap-2"><Button label="Close" className="p-button-text" onClick={() => setShareOpen(false)} /></div></div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button label="Share to chat" icon="pi pi-send" onClick={() => { setShareCount(c => c + 1); alert("Shared to chat (mock)"); setShareOpen(false); }} />
          <Button label="Share to profile" icon="pi pi-user" onClick={() => { setShareCount(c => c + 1); alert("Shared to your profile (mock)"); setShareOpen(false); }} />
        </div>
        <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
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
    </>
  );
}
