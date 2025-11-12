import type { PhotoPost } from "@/types";

// deterministic palette for dominant colors
const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#111827", "#f5f5f5"];

export const mockPost: PhotoPost[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `p_${i + 1}`,
  imageUrl: `https://picsum.photos/seed/${i + 10}/600/800`,
  alt: `Mock photo ${i + 1}`,
  // extra fields to help Search and detail pages
  // @ts-ignore
  caption: `Sample caption for photo ${i + 1} with ${i % 2 ? "warm" : "cool"} vibes`,
  // @ts-ignore
  dominantColor: COLORS[i % COLORS.length],
  width: 600,
  height: 800,
  createdAtISO: "2025-09-01",
  likeCount: Math.floor(50 + Math.random() * 500),
  commentCount: Math.floor(1 + Math.random() * 40),
  tags: i % 3 === 0 ? ["street", "city"] : i % 3 === 1 ? ["portrait", "people"] : ["travel", "landscape"],
}));
