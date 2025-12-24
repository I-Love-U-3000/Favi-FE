"use client";

import Image from "next/image";
import { Image as PrimeImage } from "primereact/image";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import { useOverlay } from "@/components/RootProvider";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import postAPI from "@/lib/api/postAPI";

type PostProps = {
  username: string;
  avatar: string;
  image: string;
  caption: string;
  id: string;
  authorId?: string; // Post author ID for ownership check
};

export default function Post({ username, avatar, image, caption, id, authorId }: PostProps) {
  const router = useRouter();
  const { openAddToCollectionDialog } = useOverlay();
  const { user, isAdmin } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Check if current user can delete (is owner or admin)
  const canDelete = isAdmin || (authorId && user?.id === authorId);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      setDeleting(true);
      await postAPI.delete(id);
      // Reload the page or navigate away to refresh
      router.refresh();
    } catch (error: any) {
      alert(error?.error || error?.message || "Failed to delete post");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md mb-6 max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <Image
            src={avatar}
            alt={`${username} avatar`}
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="ml-3 font-semibold">{username}</span>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
            title={deleting ? "Deleting..." : "Delete post"}
          >
            <i className={`pi ${deleting ? 'pi-spin pi-spinner' : 'pi-trash'}`}></i>
          </button>
        )}
      </div>

      {/* Image Preview with PrimeReact Image */}
      <div className="relative w-full h-80 overflow-hidden">
        <PrimeImage
          src={image}
          alt="Post image"
          preview
          className="w-full h-full object-cover rounded-b-lg"
          imageClassName="w-full h-full object-cover rounded-b-lg"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 p-3 text-2xl">
        <i className="pi pi-heart cursor-pointer hover:text-red-500" />
        <i className="pi pi-comment cursor-pointer hover:text-blue-500" />
        <i className="pi pi-send cursor-pointer hover:text-green-500" />
        <i
          className="pi pi-bookmark cursor-pointer hover:text-yellow-500"
          aria-label="Add to collection"
          onClick={() => openAddToCollectionDialog(id)}
          title="Add to collection"
        />
        <i className="pi pi-external-link hover:text-blue-500" aria-label="View post" onClick={() => router.push(`/posts/${id}`)}/>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        <span className="font-semibold mr-2">{username}</span>
        <span>{caption}</span>
      </div>
    </div>
  );
}