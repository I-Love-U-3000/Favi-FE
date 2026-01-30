"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import Avatar from "primeicons/react/primeicons";

interface AvatarOrStoryDialogProps {
  visible: boolean;
  onHide: () => void;
  onAvatarClick: () => void;
  onStoriesClick: () => void;
  profileName: string;
  hasStories: boolean;
}

export default function AvatarOrStoryDialog({
  visible,
  onHide,
  onAvatarClick,
  onStoriesClick,
  profileName,
  hasStories,
}: AvatarOrStoryDialogProps) {
  return (
    <Dialog
      header={`What would you like to see?`}
      visible={visible}
      onHide={onHide}
      style={{ width: "90vw", maxWidth: "400px" }}
      modal
      footer={
        <div className="flex gap-2 justify-end">
          <Button label="Cancel" icon="pi pi-times" onClick={onHide} />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Choose what you want to view</div>
          <div className="text-sm opacity-70">for {profileName}</div>
        </div>

        <div className="space-y-2">
          <Button
            label="View Avatar"
            icon="pi pi-user"
            onClick={onAvatarClick}
            className="w-full p-button-outlined"
            iconPos="left"
          />

          {hasStories && (
            <Button
              label="View Stories"
              icon="pi pi-camera"
              onClick={onStoriesClick}
              className="w-full p-button-primary"
              iconPos="left"
            />
          )}
        </div>

        <div className="text-center text-xs opacity-50 mt-4">
          {hasStories
            ? "Stories are available for 24 hours after posting"
            : "No active stories to view at the moment"}
        </div>
      </div>
    </Dialog>
  );
}