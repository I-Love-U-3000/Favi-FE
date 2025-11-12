"use client";

import { useMemo, useState } from "react";
import { Button } from "primereact/button";

type Friend = {
  id: string;
  name: string;
  avatar: string;
  status: "none" | "requested" | "incoming" | "following";
};

export default function FriendsPage() {
  const initial = useMemo<Friend[]>(
    () => [
      { id: "u1", name: "Eleanor Pena", avatar: "https://i.pravatar.cc/80?img=31", status: "incoming" },
      { id: "u2", name: "Leslie Alexander", avatar: "https://i.pravatar.cc/80?img=32", status: "none" },
      { id: "u3", name: "Brooklyn Simmons", avatar: "https://i.pravatar.cc/80?img=33", status: "following" },
      { id: "u4", name: "Arlene McCoy", avatar: "https://i.pravatar.cc/80?img=34", status: "requested" },
    ],
    []
  );
  const [list, setList] = useState(initial);
  const suggestions = useMemo<Friend[]>(
    () => [
      { id: "s1", name: "Keanu Reeves", avatar: "https://i.pravatar.cc/80?img=52", status: "none" },
      { id: "s2", name: "Ada Lovelace", avatar: "https://i.pravatar.cc/80?img=53", status: "none" },
      { id: "s3", name: "Grace Hopper", avatar: "https://i.pravatar.cc/80?img=54", status: "none" },
    ],
    []
  );

  const accept = (id: string) => setList(ls => ls.map(u => u.id === id ? { ...u, status: "following" } : u));
  const reject = (id: string) => setList(ls => ls.map(u => u.id === id ? { ...u, status: "none" } : u));
  const request = (id: string) => setList(ls => ls.map(u => u.id === id ? { ...u, status: "requested" } : u));
  const cancel = (id: string) => setList(ls => ls.map(u => u.id === id ? { ...u, status: "none" } : u));
  const unfollow = (id: string) => setList(ls => ls.map(u => u.id === id ? { ...u, status: "none" } : u));

  return (
    <div className="max-w-5xl mx-auto p-6" style={{ color: 'var(--text)' }}>
      <h1 className="text-2xl font-semibold mb-6">Friends</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your network */}
        <section>
          <h2 className="text-lg font-medium mb-3">Your network</h2>
          <div className="space-y-3">
            {list.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs opacity-70">{u.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.status === "incoming" && (
                    <>
                      <Button label="Accept" onClick={() => accept(u.id)} />
                      <Button label="Reject" className="p-button-text" onClick={() => reject(u.id)} />
                    </>
                  )}
                  {u.status === "none" && (
                    <Button label="Request follow" onClick={() => request(u.id)} />
                  )}
                  {u.status === "requested" && (
                    <Button label="Cancel" className="p-button-text" onClick={() => cancel(u.id)} />
                  )}
                  {u.status === "following" && (
                    <Button label="Unfollow" className="p-button-text" onClick={() => unfollow(u.id)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Suggestions */}
        <section>
          <h2 className="text-lg font-medium mb-3">Who you may know</h2>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs opacity-70">Related by mutual tags</div>
                  </div>
                </div>
                <Button label="Request" onClick={() => request(s.id)} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
