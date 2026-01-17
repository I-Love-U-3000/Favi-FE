import { notFound } from "next/navigation";
import postAPI from "@/lib/api/postAPI";
import type { Metadata } from "next";
import SharedPostCard from "@/components/SharedPostCard";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/routing";

interface SharedPostPageProps {
  params: { locale: string; repostId: string };
}

export async function generateMetadata({ params }: SharedPostPageProps): Promise<Metadata> {
  const { locale, repostId } = params;
  try {
    const repost = await postAPI.getRepost(repostId);
    return {
      title: `${repost.username}'s shared post`,
      description: repost.caption || repost.originalCaption || "Shared post",
    };
  } catch {
    return {
      title: "Shared Post",
    };
  }
}

export default async function SharedPostPage({ params }: SharedPostPageProps) {
  const { repostId } = params;
  const router = useRouter();

  let repost;
  try {
    repost = await postAPI.getRepost(repostId);
  } catch (e: any) {
    console.error("Error fetching repost:", e);
    return notFound();
  }

  if (!repost) {
    return notFound();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <SharedPostCard
          repost={repost}
          onNavigateToOriginal={() => router.push(`/posts/${repost.originalPostId}`)}
          onProfileClick={() => router.push(`/u/${repost.username}`)}
        />
      </div>
    </div>
  );
}
