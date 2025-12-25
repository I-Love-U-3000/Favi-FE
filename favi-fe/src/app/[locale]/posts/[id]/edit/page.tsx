"use client";

import { useParams, useRouter } from "next/navigation";
import EditPostDialog from "@/components/EditPostDialog";
import { useState } from "react";

export default function EditPostPage() {
  const params = useParams() as any;
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : String(params?.id || "");
  const [dialogVisible, setDialogVisible] = useState(true);

  const handleHide = () => {
    setDialogVisible(false);
    router.back();
  };

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Invalid post ID</div>
      </div>
    );
  }

  return <EditPostDialog visible={dialogVisible} onHide={handleHide} postId={id} />;
}
