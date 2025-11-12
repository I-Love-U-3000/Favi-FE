"use client";

import Dock from "@/components/Dock";
import StoriesStrip from "@/components/StoriesStrip";
import FeedCard, {Feed} from "@/components/FeedCard";


import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { mockPost } from "@/lib/mockTest/mockPost";
import { mockCollection } from "@/lib/mockTest/mockCollection";
import { useRouter, Link } from "@/i18n/routing";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [view, setView] = useState<"list" | "grid">("list");
  const router = useRouter();
  const [quickQ, setQuickQ] = useState("");
  // ===== Mock data (bạn có thể thay bằng dữ liệu thật sau) =====
  const stories = [
    { id: "s1", name: "Quinn",    avatar: "https://i.pravatar.cc/80?img=11", isOnline: true },
    { id: "s2", name: "Alex",     avatar: "https://i.pravatar.cc/80?img=12", isOnline: true },
    { id: "s3", name: "Sarah",    avatar: "https://i.pravatar.cc/80?img=13" },
    { id: "s4", name: "Sebastian",avatar: "https://i.pravatar.cc/80?img=14", isOnline: true },
    { id: "s5", name: "Stevy",    avatar: "https://i.pravatar.cc/80?img=15" },
    { id: "s6", name: "Jose",     avatar: "https://i.pravatar.cc/80?img=16", isOnline: true },
    { id: "s7", name: "Alina",    avatar: "https://i.pravatar.cc/80?img=17" },
    { id: "s8", name: "Andrew",   avatar: "https://i.pravatar.cc/80?img=18" },
  ];

  const feeds: Feed[] = [
    {
      id: "f1",
      date: { mon: "MAY", day: "08" },
      cover:
        "https://images.unsplash.com/photo-1579353977828-2a4eab540b9a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FtcGxlfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000",
      title: "How To Manage Your Time & Get More Done",
      desc:
        "It may not be possible to squeeze more time in the day without sacrificing sleep. So, how do you achieve more?",
      host: {
        name: "Valentino Del More",
        role: "Product Manager • PayPal",
        avatar: "https://i.pravatar.cc/80?img=21",
      },
      stats: { comments: 12, likes: 30, saves: 20 },
    },
    {
      id: "f2",
      date: { mon: "MAY", day: "09" },
      cover:
        "https://images.all-free-download.com/images/graphiclarge/iphone_6_sample_photo_566464.jpg",
      title: "How to Learn Anything! For Creatives & Self Learners",
      desc:
        "What are the 3 essential skills that are critical in the 21st century? School cancelled or home school?",
      host: {
        name: "Angelina Joly",
        role: "Creative Director • Google",
        avatar: "https://i.pravatar.cc/80?img=22",
      },
      stats: { comments: 32, likes: 120, saves: 30 },
    },
  ];

        // ====== UI ======
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Dock cố định giữa bên trái */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
        <Dock />
      </div>

      {/* Nội dung */}
      <main className="flex-1 p-6 ">
        <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* Cột trái */}
          {/* Left column removed to free space for feed */}
          <aside className="hidden lg:block" style={{ display: 'none' }}>
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <h4 className="text-sm font-semibold">Trending keywords</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {(() => {
                  const freq = new Map<string, number>();
                  mockPost.forEach(p => (p.tags ?? []).forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)));
                  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([t]) => (
                    <button key={t} onClick={() => router.push(`/search?mode=tag&tag=${encodeURIComponent(t)}`)} className="px-3 py-1.5 text-xs rounded-full hover:opacity-100" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>#{t}</button>
                  ));
                })()}
              </div>
            </div>
          </aside>

          {/* Cột giữa (Stories + Feed) */}
          <section>
                {isAuthenticated && (
                  <div className="shrink-0" title={user?.email || (user?.id ?? '')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.pravatar.cc/40?u=${encodeURIComponent((user?.id || user?.email || 'me') as string)}`}
                      alt="me"
                      className="w-9 h-9 rounded-full border"
                    />
                  </div>
                )}
            {/* Top search bar (sticky) */}
            <div className="sticky top-0 z-30 -mt-6 pt-6 pb-3" style={{ background: "linear-gradient(var(--bg),var(--bg))", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <div className="shrink-0" title={user?.email || (user?.id ?? '')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.pravatar.cc/40?u=${encodeURIComponent((user?.id || user?.email || 'me') as string)}`}
                      alt="me"
                      className="w-9 h-9 rounded-full border"
                    />
                  </div>
                )}
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-search" />
                  <input
                    value={quickQ}
                    onChange={(e) => setQuickQ(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e as any).key === "Enter") {
                        router.push(`/search?mode=keyword&q=${encodeURIComponent(quickQ)}`);
                      }
                    }}
                    placeholder="Search photos, captions, tags…"
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--input-border)" }}
                  />
                </span>
                <button
                  onClick={() => router.push(`/search?mode=keyword&q=${encodeURIComponent(quickQ)}`)}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "var(--primary)", color: "white" }}
                >
                  Search
                </button>
              </div>
            </div>
            {/* Stories */}
            <div className="rounded-2xl shadow-sm px-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <StoriesStrip stories={stories} />
            </div>

            {/* Feed controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm opacity-70">Your feed</div>
              <div className="inline-flex rounded-full p-1 bg-black/5">
                <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs rounded-full ${view==="list"?"bg-white shadow ring-1 ring-black/10":"opacity-70 hover:opacity-100"}`}>List</button>
                <button onClick={() => setView("grid")} className={`px-3 py-1.5 text-xs rounded-full ${view==="grid"?"bg-white shadow ring-1 ring-black/10":"opacity-70 hover:opacity-100"}`}>Grid</button>
              </div>
            </div>

            {view === "list" ? (
              <div className="mt-4 space-y-6">
                {feeds.map((f, idx) => (
                  <div key={f.id} className="cursor-pointer" onClick={()=>router.push(`/posts/${f.id}`)}>
                    <FeedCard f={f} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {mockPost.map((p) => (
                  <Link key={p.id} href={`/posts/${p.id}`} className="group relative overflow-hidden rounded-xl ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.alt ?? ""} className="h-44 w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Cột phải (Live) */}
          <aside className="hidden xl:block">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h4 className="text-sm font-semibold">Trending collections</h4>
              </div>
              <div className="p-4 space-y-3">
                {mockCollection.map(c => (
                  <a key={c.id} href={`/collections/${c.id}`} className="rounded-xl overflow-hidden ring-1 ring-black/5 block hover:shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.coverUrl} alt={c.title} className="w-full h-28 object-cover" />
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs opacity-70">{c.count} photos</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4 mt-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <h4 className="text-sm font-semibold">Trending keywords</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {(() => {
                  const freq = new Map<string, number>();
                  mockPost.forEach(p => (p.tags ?? []).forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)));
                  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([t]) => (
                    <button key={t} onClick={() => router.push(`/search?mode=tag&tag=${encodeURIComponent(t)}`)} className="px-3 py-1.5 text-xs rounded-full hover:opacity-100" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>#{t}</button>
                  ));
                })()}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}



