"use client";

import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Chips } from "primereact/chips";
import { Dropdown } from "primereact/dropdown";

type PrivacyType = "public" | "friends" | "private";

export default function EditPostDialog({
  visible,
  onHide,
  initialCaption,
  initialTags,
  initialPrivacy,
}: {
  visible: boolean;
  onHide: () => void;
  initialCaption?: string;
  initialTags?: string[];
  initialPrivacy?: PrivacyType;
}) {
  const [caption, setCaption] = useState<string>(initialCaption || "");
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [privacy, setPrivacy] = useState<PrivacyType>(initialPrivacy || "public");

  useEffect(() => {
    setCaption(initialCaption || "");
    setTags(initialTags || []);
    setPrivacy(initialPrivacy || "public");
  }, [initialCaption, initialTags, initialPrivacy, visible]);

  const save = () => {
    console.log("Edit post saved", { caption, tags, privacy });
    onHide();
    alert("Post changes saved (mock)");
  };

  return (
    <Dialog
      header="Edit Post"
      visible={visible}
      onHide={onHide}
      style={{ width: 600, maxWidth: "95vw" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" className="p-button-text" onClick={onHide} />
          <Button label="Save" onClick={save} />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm mb-2">Caption</div>
          <InputTextarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="w-full"
            placeholder="Update your caption…"
          />
        </div>
        <div>
          <div className="text-sm mb-2">Tags</div>
          <Chips value={tags} onChange={(e) => setTags(e.value || [])} separator="," />
        </div>
        <div>
          <div className="text-sm mb-2">Privacy</div>
          <Dropdown
            value={privacy}
            onChange={(e) => setPrivacy(e.value as PrivacyType)}
            options={[
              { label: "Public", value: "public" },
              { label: "Friends", value: "friends" },
              { label: "Private", value: "private" },
            ]}
            className="w-48"
          />
        </div>
      </div>
    </Dialog>
  );
}

