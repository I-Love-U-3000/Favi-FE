"use client";

type Group = { id: string; name: string };
type Friend = { id: string; name: string; avatar: string; activeAgo: string; online?: boolean };

export default function LeftColumn({ groups, friends }: { groups: Group[]; friends: Friend[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-6">
        <section>
          <h4 className="text-xs uppercase tracking-wide text-gray-400">Your group</h4>
          <ul className="mt-3 space-y-2">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
              >
                <span className="font-medium">{g.name}</span>
                <i className="pi pi-angle-right text-gray-400" />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-xs uppercase tracking-wide text-gray-400">Friends</h4>
          <ul className="mt-3 space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.avatar} alt={f.name} className="h-8 w-8 rounded-full object-cover" />
                    <span
                      className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        f.online ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <span className="text-sm">{f.name}</span>
                </div>
                <span className="text-xs text-gray-400">{f.activeAgo}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
