import type { PhotoPost } from "@/types";

export const mockPost: PhotoPost[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p_${i + 1}`,
  imageUrl: `https://picsum.photos/seed/${i}/600/800`,
  alt: `Mock photo ${i + 1}`,
  width: 600,
  height: 800,
  createdAtISO: "2025-09-01",
  likeCount: Math.floor(50 + Math.random() * 500),
  commentCount: Math.floor(1 + Math.random() * 40),
  tags: i % 3 === 0 ? ["street"] : i % 3 === 1 ? ["portrait"] : ["travel"],
}));
