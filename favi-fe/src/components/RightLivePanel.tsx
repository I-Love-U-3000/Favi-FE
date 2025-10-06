"use client";

import { Button } from "primereact/button";

type Chat = { id: string; name: string; text: string; time: string };

export default function RightLivePanel({ chats }: { chats: Chat[] }) {
  return (
    <aside className="hidden xl:block">
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
        {/* Live video header */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop"
            alt="live"
            className="h-56 w-full object-cover"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-rose-500 text-white text-xs px-2 py-1">LIVE</span>
            <span className="rounded-full bg-black/70 text-white text-xs px-2 py-1">
              <i className="pi pi-eye mr-1" />
              3,845
            </span>
          </div>
        </div>

        {/* Chat area */}
        <div className="p-4">
          <div className="rounded-xl bg-blue-50 p-3 text-sm">
            <p className="font-medium">Live Chat</p>
            <p className="text-gray-600">↑ Pinned: How to make your Youtube grow faster.</p>
          </div>

          <div className="mt-3 space-y-3 max-h-[260px] overflow-auto">
            {chats.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-gray-400 text-xs ml-2">{c.time}</span>
                <div>{c.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              placeholder="Add your comment"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />
            <Button label="Send" className="!py-2 !px-3" />
          </div>
        </div>
      </div>
    </aside>
  );
}
