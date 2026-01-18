"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";

interface ResolveReportDialogProps {
  visible: boolean;
  onHide: () => void;
  reportId: string;
  action: "delete" | "resolve";
  onConfirm: (notes: string) => void;
  loading?: boolean;
}

export default function ResolveReportDialog({
  visible,
  onHide,
  reportId,
  action,
  onConfirm,
  loading = false,
}: ResolveReportDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const handleHide = () => {
    setNotes("");
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
        label={action === "delete" ? "Resolve & Delete" : "Resolve Only"}
        icon={action === "delete" ? "pi pi-trash" : "pi pi-check"}
        severity={action === "delete" ? "danger" : "success"}
        onClick={handleConfirm}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={action === "delete" ? "Resolve with Delete" : "Resolve Report"}
      visible={visible}
      onHide={handleHide}
      style={{ width: "450px" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="flex flex-col gap-4">
        {action === "delete" ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              <i className="pi pi-exclamation-triangle mr-2" />
              This will resolve the report and delete the associated content.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <i className="pi pi-info-circle mr-2" />
              This will resolve the report without deleting the content.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="notes"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Notes (optional)
          </label>
          <InputTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this resolution..."
            rows={4}
            className="w-full"
          />
        </div>

        {loading && (
          <ProgressBar
            mode="indeterminate"
            className="h-2 mt-2"
            color={action === "delete" ? "#ef4444" : "#22c55e"}
          />
        )}
      </div>
    </Dialog>
  );
}
