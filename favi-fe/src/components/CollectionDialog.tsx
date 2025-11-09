"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";

export default function CollectionDialog({
  visible,
  onHide,
}: {
  visible: boolean;
  onHide: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setDesc("");
    setIsPublic(true);
    setCoverUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = () => {
    console.log("Create collection", { title, desc, isPublic, coverUrl });
    reset();
    onHide();
    alert("Collection created (mock)");
  };

  const pickFile = () => fileRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCoverUrl(url);
  };

  return (
    <Dialog
      header="Create Collection"
      visible={visible}
      onHide={() => { reset(); onHide(); }}
      style={{ width: 640, maxWidth: "95vw" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" className="p-button-text" onClick={() => { reset(); onHide(); }} />
          <Button label="Create" onClick={save} disabled={!title.trim()} />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm mb-2">Title</div>
          <InputText value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" placeholder="e.g. Minimalist Interiors" />
        </div>
        <div>
          <div className="text-sm mb-2">Description</div>
          <InputTextarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className="w-full" placeholder="Optional description" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox inputId="pub" checked={isPublic} onChange={(e) => setIsPublic(!!e.checked)} />
          <label htmlFor="pub" className="text-sm">Public</label>
        </div>
        <div>
          <div className="text-sm mb-2">Cover</div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-20 rounded-lg overflow-hidden bg-black/5 dark:bg-white/10 grid place-items-center">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs opacity-60">No cover</span>
              )}
            </div>
            <Button label="Choose" icon="pi pi-image" onClick={pickFile} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

