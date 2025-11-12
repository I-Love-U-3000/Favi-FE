"use client";

import { notFound } from "next/navigation";
import { mockCollection } from "@/lib/mockTest/mockCollection";
import { mockPost } from "@/lib/mockTest/mockPost";
import { Badge } from "primereact/badge";

type Props = { params: { id: string } };

export default function CollectionDetail({ params }: Props) {
  const { id } = params;
  const coll = mockCollection.find((c) => c.id === id);
  if (!coll) notFound();

  const posts = coll.postIds
    .map((pid) => mockPost.find((p) => p.id === pid))
    .filter(Boolean) as typeof mockPost;

  return (
    <div className="min-h-screen" style={{ color: 'var(--text)' }}>
      {/* Cover + header */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coll.coverUrl} alt={coll.title} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-2xl font-semibold">{coll.title}</h1>
          <div className="text-xs opacity-90 mt-1">{coll.count} photos • Created {coll.createdAtISO}</div>
        </div>
      </div>

      {/* Owner */}
      <div className="mx-auto max-w-6xl px-6 mt-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coll.owner.avatarUrl} alt={coll.owner.username} className="w-10 h-10 rounded-full" />
        <div>
          <div className="text-sm">by {coll.owner.displayName}</div>
          <div className="text-xs opacity-70">@{coll.owner.username}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((p) => (
          <a key={p.id} href={`/posts/${p.id}`} className="group block rounded-xl overflow-hidden ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.alt ?? ''} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
            <div className="px-3 py-2 text-xs flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <i className="pi pi-heart" /> {p.likeCount}
                <i className="pi pi-comments" /> {p.commentCount}
              </div>
              <div className="flex gap-1">
                {(p.tags ?? []).slice(0,2).map((t) => (
                  <Badge key={t} value={t} className="!text-[10px]" />
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

