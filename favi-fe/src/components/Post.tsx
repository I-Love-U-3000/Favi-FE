"use client";

import Image from "next/image";
import { Image as PrimeImage } from "primereact/image";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";

type PostProps = {
  username: string;
  avatar: string;
  image: string;
  caption: string;
  id: string; // Added id prop for dynamic post ID
};

export default function Post({ username, avatar, image, caption, id }: PostProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-md mb-6 max-w-md w-full">
      {/* Header */}
      <div className="flex items-center p-3">
        <Image
          src={avatar}
          alt={`${username} avatar`}
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="ml-3 font-semibold">{username}</span>
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