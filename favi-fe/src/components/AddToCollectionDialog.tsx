"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { Badge } from "primereact/badge";

import collectionAPI from "@/lib/api/collectionAPI";
import { useAuth } from "@/components/AuthProvider";
import { CollectionResponse } from "@/types";

interface AddToCollectionDialogProps {
  visible: boolean;
  onHide: () => void;
  postId: string;
}

export default function AddToCollectionDialog({
  visible,
  onHide,
  postId,
}: AddToCollectionDialogProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToCollectionId, setAddingToCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible && user?.id) {
      fetchCollections();
    }
  }, [visible, user?.id]);

  const fetchCollections = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await collectionAPI.getByOwner(user.id);
      setCollections(response.items || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      setAddingToCollectionId(collectionId);
      await collectionAPI.addPost(collectionId, postId);
      alert("Post added to collection successfully!");
      onHide();
    } catch (error: any) {
      console.error("Error adding post to collection:", error);
      alert(error?.error || error?.message || "Failed to add post to collection");
    } finally {
      setAddingToCollectionId(null);
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog
      header="Add to Collection"
      visible={visible}
      onHide={onHide}
      style={{ width: "90vw", maxWidth: "500px" }}
      className="rounded-xl"
    >
      <div className="p-2 space-y-4">
        {/* Search input */}
        <div>
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full"
          />
        </div>

        {/* Loading state */}
        {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}

        {/* Collections list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredCollections.length === 0 && !loading && (
            <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
              <p>No collections found.</p>
              <p className="text-sm mt-2">Create a collection from the navbar to get started.</p>
            </div>
          )}

          {filteredCollections.map((collection) => {
            // Check if post is already in this collection
            const isPostInCollection = collection.postIds?.includes(postId);

            return (
              <div
                key={collection.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Collection cover */}
                <div
                  className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{
                    backgroundImage: `url(${collection.coverImageUrl || "https://via.placeholder.com/64x64/6366f1/ffffff?text=C"})`,
                  }}
                />

                {/* Collection info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{collection.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {collection.postCount} {collection.postCount === 1 ? "post" : "posts"}
                  </div>
                  {collection.description && (
                    <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      {collection.description}
                    </div>
                  )}
                </div>

                {/* Add button or "Added" indicator */}
                {isPostInCollection ? (
                  <div className="flex items-center gap-2" style={{ color: "var(--primary)" }}>
                    <i className="pi pi-check text-sm" />
                    <span className="text-xs font-medium">Added</span>
                  </div>
                ) : (
                  <Button
                    label={addingToCollectionId === collection.id ? "Adding..." : "Add"}
                    size="small"
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={addingToCollectionId !== null}
                    className="flex-shrink-0"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Create new collection button */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <Button
            label="Create New Collection"
            icon="pi pi-plus"
            outlined
            className="w-full"
            onClick={() => {
              // This would require passing openCollectionComposer from the context
              // For now, just close the dialog
              onHide();
              // You can call openCollectionComposer() from the parent component
              alert("Please create a collection from the navbar first, then add the post.");
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}
