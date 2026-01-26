"use client";

import { useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";

interface BanUserDialogProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  userName: string;
  onBan: (reason?: string) => void;
  loading?: boolean;
}

export default function BanUserDialog({
  visible,
  onHide,
  userId,
  userName,
  onBan,
  loading = false,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");

  const handleBan = () => {
    onBan(reason);
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
        label="Ban User"
        icon="pi pi-ban"
        severity="danger"
        onClick={handleBan}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={`Ban User: @${userName}`}
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
            Banning a user will prevent them from accessing the platform.
            They will not be able to login, view posts, or interact with content.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reason" className="font-medium text-gray-700 dark:text-gray-300">
            Reason for ban (optional)
          </label>
          <InputTextarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for banning this user..."
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
