"use client";

import { Badge } from "primereact/badge";

type Story = { id: string; name: string; avatar: string; isOnline?: boolean };

export default function StoriesStrip({ stories }: { stories: Story[] }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-4 py-3 min-w-max">
        {stories.map((s) => (
          <button
            key={s.id}
            className="relative grid place-items-center rounded-full p-[2px] bg-gradient-to-tr from-sky-400 via-violet-400 to-amber-400 hover:opacity-90"
            title={s.name}
          >
            <div className="bg-white rounded-full p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.avatar}
                alt={s.name}
                className="h-14 w-14 object-cover rounded-full"
              />
            </div>
            {s.isOnline && (
              <span className="absolute bottom-0 right-0">
                <Badge className="!h-3 !w-3 !p-0 !rounded-full" severity="success" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
