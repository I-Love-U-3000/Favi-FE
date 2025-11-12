import type { Collection } from "@/types";
import { mockPost } from "./mockPost";

// Extend mock collections with owner + createdAt + postIds for detail page
export type MockCollection = Collection & {
  owner: { id: string; username: string; displayName: string; avatarUrl?: string };
  createdAtISO: string;
  postIds: string[];
};

function pickIds(offset: number, n: number) {
  return Array.from({ length: n }).map((_, i) => mockPost[(offset + i) % mockPost.length].id);
}

export const mockCollection: MockCollection[] = [
  {
    id: "c1",
    title: "Urban Nights",
    coverUrl: "https://picsum.photos/id/1011/800/600",
    count: 18,
    owner: { id: "u_001", username: "azazel", displayName: "Azazel", avatarUrl: "https://i.pravatar.cc/150?img=15" },
    createdAtISO: "2025-01-12",
    postIds: pickIds(2, 18),
  },
  {
    id: "c2",
    title: "Portrait Vibes",
    coverUrl: "https://picsum.photos/id/1012/800/600",
    count: 24,
    owner: { id: "u_002", username: "elenavoyage", displayName: "Elena Voyage", avatarUrl: "https://i.pravatar.cc/150?img=12" },
    createdAtISO: "2025-02-03",
    postIds: pickIds(8, 24),
  },
  {
    id: "c3",
    title: "Coastal Trips",
    coverUrl: "https://picsum.photos/id/1013/800/600",
    count: 12,
    owner: { id: "u_003", username: "traveler", displayName: "Traveler", avatarUrl: "https://i.pravatar.cc/150?img=7" },
    createdAtISO: "2024-12-18",
    postIds: pickIds(15, 12),
  },
];
