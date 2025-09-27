"use client";
import { notFound } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ScrollPanel } from "primereact/scrollpanel";
import { useRef, useState } from "react";
import Dock from "@/components/Dock";
import { Separator } from "@/components/ui/Seperator";
import { Badge } from "primereact/badge";
import { cn } from "@/components/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-menu";
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  Lock,
  Users,
  Globe,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

type PostPageProps = {
  params: { id: string };
};

type PrivacyType = "public" | "friends" | "private";

const posts = [
  {
    username: "markpawson",
    avatar: "https://i.pravatar.cc/150?img=1",
    image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6",
    caption: "A cute puppy playing in a field of flowers.",
    id: "1",
    tags: ["animal", "dog", "puppy", "cute", "nature"],
    likes: 123,
    comments: [
      { username: "elenavoyage", text: "So adorable! 😍", time: "5 hours ago" },
    ],
    privacy: "public" as PrivacyType,
  },
];

const PrivacyIcon = ({ privacy }: { privacy: PrivacyType }) => {
  const props = { className: "h-4 w-4 mr-2" };
  switch (privacy) {
    case "private":
      return <Lock {...props} />;
    case "friends":
      return <Users {...props} />;
    default:
      return <Globe {...props} />;
  }
};

export default function PostPage({ params }: PostPageProps) {
  const { id } = params;
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyType>(post.privacy);
  const isAuthor = post.username === "markpawson";


  const handleLike = () => {
    setLikes(isLiked ? likes - 1 : likes + 1);
    setIsLiked(!isLiked);
  };

  const lastCommentRef = useRef<HTMLDivElement>(null);

  const handleAddComment = (e?: React.MouseEvent | React.KeyboardEvent) => {
  if (newComment.trim()) {
    const updatedComments = [
      ...comments,
      { username: "current_user", text: newComment, time: "just now" },
    ];
    setComments(updatedComments);
    setNewComment("");

    setTimeout(() => {
      lastCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
};

  return (
    <div className="flex bg-amber-50 min-h-screen ">
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <Dock />
      </div>
      <main className="flex-1 flex justify-center p-6 ml-24">
        <div className="w-full max-w-6xl mx-auto  rounded-xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-[1fr_420px]">
            {/* Image Section */}
            <div className="bg-muted/30 flex items-center justify-center p-4 sm:p-8 relative min-h-[400px]">
              <img
                src={post.image}
                alt={post.caption}
                className="rounded-lg object-contain w-full h-full max-h-[80vh] shadow-lg"
              />
            </div>

            {/* Details Section */}
            <div className="flex flex-col bg-background">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <img
                        src={post.avatar}
                        alt={post.username}
                        className="rounded-full"
                      />
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-lg">{post.username}</h2>
                      <p className="text-sm text-gray-400">@{post.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isAuthor && (
                      <Button
                        label="Follow"
                        size="small"
                        severity="secondary"
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="p-button-rounded p-button-text">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-gray-700 text-white"
                      >
                        {isAuthor && (
                          <DropdownMenuItem
                            onClick={() => {}}
                            className="hover:bg-gray-600 transition-colors"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setPrivacy("public")}
                          className="hover:bg-gray-600 transition-colors"
                        >
                          <Globe className="mr-2 h-4 w-4" /> Set to Public
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPrivacy("friends")}
                          className="hover:bg-gray-600 transition-colors"
                        >
                          <Users className="mr-2 h-4 w-4" /> Set to Friends
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPrivacy("private")}
                          className="hover:bg-gray-600 transition-colors"
                        >
                          <Lock className="mr-2 h-4 w-4" /> Set to Private
                        </DropdownMenuItem>
                        {isAuthor && (
                          <DropdownMenuItem className="text-red-500 hover:bg-gray-600 transition-colors">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4 flex-grow flex flex-col min-h-0">
                <p>{post.caption}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      value={tag}
                      severity="info"
                      className="bg-blue-600 text-white p-1"
                    />
                  ))}
                </div>
                <Separator className="bg-gray-700" />
                <ScrollPanel style={{ height: "400px" }}>
  {comments.map((comment, idx) => (
    <div
      key={idx}
      ref={idx === comments.length - 1 ? lastCommentRef : null}
      className="flex items-start mb-2"
    >
      <Avatar className="h-10 w-10 mr-2">
        <img
          src={`https://i.pravatar.cc/150?img=${idx + 4}`}
          alt={comment.username}
          className="rounded-full"
        />
      </Avatar>
      <div className="max-w-[calc(100%-3rem)]">
        <div className="font-semibold">{comment.username}</div>
        <div className="text-gray-400 text-sm">{comment.time}</div>
        <p className="break-words">{comment.text}</p>
      </div>
    </div>
  ))}
</ScrollPanel>
                <Separator className="bg-gray-700" />
              </div>

              <div className="p-4 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      className="p-button-rounded p-button-text"
                      onClick={handleLike}
                      aria-label="Like"
                    >
                      <Heart
                        className={cn(
                          "transition-colors",
                          isLiked ? "fill-red-500 text-red-500" : ""
                        )}
                      />
                    </Button>
                    <Button
                      className="p-button-rounded p-button-text"
                      aria-label="Comment"
                    >
                      <MessageCircle />
                    </Button>
                    <Button
                      className="p-button-rounded p-button-text"
                      aria-label="Share"
                    >
                      <Share2 />
                    </Button>
                  </div>
                  <Button
                  icon="pi pi-download"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = post.image;
                      link.download = post.caption || "image.jpg";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      backgroundColor: "#3B82F6", // màu xanh hiện đại
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px", // bo góc nhẹ
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      transition:
                        "background-color 0.3s ease, transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563EB"; // hover xanh đậm hơn
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B82F6";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Get image
                  </Button>
                </div>
                <div className="flex items-center mt-4">
                  <InputText
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-inputtext-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    style={{
                      borderRadius: "0",
                      borderTopLeftRadius: "0.375rem",
                      borderBottomLeftRadius: "0.375rem",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // ngăn form submit mặc định nếu có
                        handleAddComment(e as any); // cast sang any vì handleAddComment đang nhận MouseEvent
                      }
                    }}
                  />
                  <Button
                    type="button"
                    severity="info"
                    onClick={handleAddComment}
                    
                    className="p-button-sm flex items-center justify-center hover:bg-blue-600 transition-colors"
                    style={{
                      borderRadius: "0",
                      borderTopRightRadius: "0.375rem",
                      borderBottomRightRadius: "0.375rem",
                    }}
                    
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
