"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";

interface DeleteContentDialogProps {
  visible: boolean;
  onHide: () => void;
  contentId: string;
  contentType: "post" | "comment";
  title?: string;
  onDelete: (id: string, reason?: string) => void;
  loading?: boolean;
}

export default function DeleteContentDialog({
  visible,
  onHide,
  contentId,
  contentType = "post",
  title,
  onDelete,
  loading = false,
}: DeleteContentDialogProps) {
  const [reason, setReason] = useState("");

  const handleDelete = () => {
    onDelete(contentId, reason);
    setReason("");
  };

  const handleHide = () => {
    setReason("");
    onHide();
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        className="p-button-text"
        onClick={handleHide}
        disabled={loading}
      />
      <Button
        label="Delete"
        icon="pi pi-trash"
        severity="danger"
        onClick={handleDelete}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={title || `Delete ${contentType === "post" ? "Post" : "Comment"}`}
      visible={visible}
      onHide={handleHide}
      style={{ width: "450px" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            <i className="pi pi-exclamation-triangle mr-2" />
            Are you sure you want to delete this {contentType}? This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reason" className="font-medium text-gray-700 dark:text-gray-300">
            Reason for deletion (optional)
          </label>
          <InputTextarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for deleting this content..."
            rows={4}
            className="w-full"
          />
        </div>

        {loading && (
          <ProgressBar
            mode="indeterminate"
            className="h-2 mt-2"
            color="#ef4444"
          />
        )}
      </div>
    </Dialog>
  );
}
