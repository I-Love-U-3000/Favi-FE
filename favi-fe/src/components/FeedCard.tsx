"use client";

import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";

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
  // Mock: derive a dominant reaction emoji from like count for display
  const pickEmoji = () => {
    const n = f.stats?.likes ?? 0;
    const pool = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    return pool[n % pool.length];
  };
  return (
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
                  <Avatar className="h-8 w-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.host.avatar} alt={f.host.name} className="rounded-full" />
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{f.host.name}</div>
                    <div className="text-xs text-gray-500">{f.host.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <i className="pi pi-comments" /> {f.stats.comments}
                  </span>
                  <span className="inline-flex items-center gap-1" title="top reaction">
                    <span>{pickEmoji()}</span> {f.stats.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="pi pi-bookmark" /> {f.stats.saves}
                  </span>
                  <Button label="Participants" className="!py-2 !px-3 p-button-outlined" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </article>
  );
}
