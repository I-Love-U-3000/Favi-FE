import type { UserProfile } from "@/types";

export const mockUserProfile: UserProfile = {
  id: "u_001",
  username: "azazel",
  displayName: "Azazel",
  bio: "Xây Favi — mạng xã hội chia sẻ ảnh.",
  avatarUrl:
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop",
  coverUrl:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  website: "https://favi.example",
  location: "Ho Chi Minh City, VN",
  stats: { posts: 12, followers: 1890, following: 321, likes: 5420 },
  isMe: true,
  joinedAtISO: "2024-11-02",
  interests: ["Photography", "Next.js", "Supabase", "AI/ML", "Design System"],
};
