"use client";
import { notFound } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import Dock from "@/components/Dock";

type PostPageProps = {
  params: { id: string };
};

// Mock post data (in a real app, this would come from an API or database)
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
  },
  {
    username: "bob",
    avatar: "https://i.pravatar.cc/150?img=2",
    image: "https://images.unsplash.com/photo-1516321310762-479437144403",
    caption: "City vibes 🏙️",
    id: "2",
    tags: ["city", "urban", "night"],
    likes: 89,
    comments: [
      { username: "alice", text: "Such a cool shot!", time: "2 hours ago" },
    ],
  },
  {
    username: "charlie",
    avatar: "https://i.pravatar.cc/150?img=3",
    image: "https://images.unsplash.com/photo-1473496169904-658ba7b873b7",
    caption: "Beach day 🏖️",
    id: "3",
    tags: ["beach", "summer", "relax"],
    likes: 156,
    comments: [
      { username: "alice", text: "Wish I was there!", time: "1 hour ago" },
    ],
  },
];

export default function PostPage({ params }: PostPageProps) {
  const { id } = params;
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    setLikes(likes + 1);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([
        ...comments,
        { username: "current_user", text: newComment, time: "just now" },
      ]);
      setNewComment("");
    }
  };

  return (
    <div className="flex bg-gray-900 min-h-screen text-white">
      {/* Fixed Dock on the left */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <Dock />
      </div>

      {/* Main content */}
      <main className="flex-1 flex justify-center p-6 ml-24">
        <div className="w-full max-w-3xl bg-gray-800 rounded-lg shadow-lg p-4">
          {/* User Info and Image */}
          <div className="flex items-start mb-4">
            <img
              src={post.image}
              alt={post.caption}
              className="w-1/2 h-auto object-cover rounded-lg mr-4"
            />
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Avatar
                    image={post.avatar}
                    shape="circle"
                    size="large"
                    className="mr-2"
                  />
                  <div>
                    <div className="font-bold">{post.username}</div>
                    <div className="text-gray-400">@{post.username}</div>
                  </div>
                </div>
                <Button
                  label="Follow"
                  className="p-button-outlined p-button-sm"
                />
              </div>
              <p className="mb-2">{post.caption}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
            <hr className="mx-10"/>
          {/* Comments Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Comments ({comments.length})</h3>
            {comments.map((comment, idx) => (
              <div key={idx} className="flex items-start mb-2">
                <Avatar
                  image={`https://i.pravatar.cc/150?img=${idx + 4}`}
                  shape="circle"
                  size="large"
                  className="mr-2"
                />
                <div>
                  <div className="font-semibold">{comment.username}</div>
                  <div className="text-gray-400 text-sm">{comment.time}</div>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center mb-4">
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
  />
  <Button
    type="submit"
    className="p-button-sm bg-blue-800 text-white border border-blue-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
    icon="pi pi-send"
    style={{
      borderRadius: "0",
      borderTopRightRadius: "0.375rem",
      borderBottomRightRadius: "0.375rem",
    }}
  />
  <style jsx>{`
    .p-inputtext {
      border-radius: 0 !important;
    }
    .p-button {
      border-radius: 0 !important;
    }
  `}</style>
</form>
<hr className="mx-5 my-5"/>
          {/* Action Buttons */}
          <div className="mx-5 flex justify-between items-center ">
            <div className="flex space-x-4">
              <Button
                icon="pi pi-heart"
                className="p-button-text p-button-rounded"
                onClick={handleLike}
              />
              <Button
                icon="pi pi-comment"
                className="p-button-text p-button-rounded"
              />
              <Button
                icon="pi pi-share-alt"
                className="p-button-text p-button-rounded"
              />
            </div>
            <Button
              label="Download"
              className="p-button-outlined p-button-sm"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
