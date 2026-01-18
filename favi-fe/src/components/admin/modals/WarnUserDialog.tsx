"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";

interface WarnUserDialogProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  userName: string;
  onWarn: (userId: string, reason?: string) => void;
  loading?: boolean;
}

export default function WarnUserDialog({
  visible,
  onHide,
  userId,
  userName,
  onWarn,
  loading = false,
}: WarnUserDialogProps) {
  const [reason, setReason] = useState("");

  const handleWarn = () => {
    onWarn(userId, reason);
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
        label="Send Warning"
        icon="pi pi-exclamation-triangle"
        severity="warning"
        onClick={handleWarn}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={`Warn User: @${userName}`}
      visible={visible}
      onHide={handleHide}
      style={{ width: "450px" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <i className="pi pi-info-circle mr-2" />
            A warning will be sent to the user. This is a gentle reminder
            about platform rules and guidelines.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reason" className="font-medium text-gray-700 dark:text-gray-300">
            Warning message (optional)
          </label>
          <InputTextarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a custom warning message..."
            rows={4}
            className="w-full"
          />
        </div>

        {loading && (
          <ProgressBar
            mode="indeterminate"
            className="h-2 mt-2"
            color="#f59e0b"
          />
        )}
      </div>
    </Dialog>
  );
}
