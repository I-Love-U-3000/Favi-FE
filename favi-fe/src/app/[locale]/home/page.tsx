"use client";

import Dock from "@/components/Dock";
import StoriesStrip from "@/components/StoriesStrip";
import FeedCard, {Feed} from "@/components/FeedCard";
import LeftColumn from "@/components/LeftColumn";
import RightLivePanel from "@/components/RightLivePanel";

export default function HomePage() {
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
        "https://images.unsplash.com/photo-1520975922284-9bcd70a4b1a9?q=80&w=1200&auto=format&fit=crop",
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
        "https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1200&auto=format&fit=crop",
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

  const groups = [
    { id: "g1", name: "Figma Community" },
    { id: "g2", name: "Sketch Community" },
  ];

  const friends = [
    { id: "u1", name: "Eleanor Pena",  avatar: "https://i.pravatar.cc/80?img=31", activeAgo: "11 min", online: true },
    { id: "u2", name: "Leslie Alexander", avatar: "https://i.pravatar.cc/80?img=32", activeAgo: "11 min" },
    { id: "u3", name: "Brooklyn Simmons", avatar: "https://i.pravatar.cc/80?img=33", activeAgo: "11 min", online: true },
    { id: "u4", name: "Arlene McCoy", avatar: "https://i.pravatar.cc/80?img=34", activeAgo: "11 min" },
    { id: "u5", name: "Jerome Bell", avatar: "https://i.pravatar.cc/80?img=35", activeAgo: "9 min" },
    { id: "u6", name: "Darlene Robertson", avatar: "https://i.pravatar.cc/80?img=36", activeAgo: "9 min", online: true },
  ];

  const liveChats = [
    { id: "c1", name: "Suny Suka", text: "Wow! Keep it up dude 🔥", time: "09:00" },
    { id: "c2", name: "Arman Albreg", text: "Awesome 👍", time: "09:02" },
    { id: "c3", name: "John Doe", text: "Can you link my comment here? 😅", time: "09:04" },
    { id: "c4", name: "Stevany Pearl", text: "Great work team, thanks guys.", time: "09:07" },
    { id: "c5", name: "Sarah Houldston", text: "🔥🔥 Such a great information guys.", time: "09:12" },
  ];

  // ====== UI ======
  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Dock cố định giữa bên trái */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
        <Dock />
      </div>

      {/* Nội dung */}
      <main className="flex-1 p-6 ml-24">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px] gap-6">
          {/* Cột trái */}
          <LeftColumn groups={groups} friends={friends} />

          {/* Cột giữa (Stories + Feed) */}
          <section>
            {/* Stories */}
            <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-4">
              <StoriesStrip stories={stories} />
            </div>

            {/* Feed */}
            <div className="mt-6 space-y-6">
              {feeds.map((f) => (
                <FeedCard key={f.id} f={f} />
              ))}
            </div>
          </section>

          {/* Cột phải (Live) */}
          <RightLivePanel chats={liveChats} />
        </div>
      </main>
    </div>
  );
}
