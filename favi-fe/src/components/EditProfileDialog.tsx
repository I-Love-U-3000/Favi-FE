"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Chips } from "primereact/chips";
import { Button } from "primereact/button";
import AvatarCircle from "./AvatarCircle";

export type EditableProfile = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  interests?: string[];
};

export default function EditProfileDialog({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: EditableProfile;
  onSave: (p: EditableProfile) => void;
}) {
  const [draft, setDraft] = useState<EditableProfile>(profile);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(profile), [profile, open]);

  return (
    <Dialog
      header="Edit profile"
      visible={open}
      onHide={onClose}
      style={{ width: 720, maxWidth: '95vw' }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" className="p-button-text" onClick={onClose} />
          <Button label="Save" onClick={() => onSave(draft)} />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cover */}
        <div>
          <div className="text-sm mb-2">Cover image</div>
          <div className="relative h-40 w-full rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {draft.coverUrl && <img src={draft.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />}
          </div>
          <div className="mt-2 flex gap-2">
            <Button label="Change cover" icon="pi pi-image" onClick={() => coverInput.current?.click()} className="p-button-text" />
            <Button label="Remove" className="p-button-text p-button-danger" onClick={() => setDraft({ ...draft, coverUrl: null })} />
            <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const url = URL.createObjectURL(f);
              setDraft({ ...draft, coverUrl: url });
            }} />
          </div>
        </div>

        {/* Avatar + basics */}
        <div className="flex items-start gap-4">
          <div>
            <AvatarCircle src={draft.avatarUrl ?? undefined} size={72} />
            <div className="mt-2 flex gap-2">
              <Button label="Change" icon="pi pi-user" className="p-button-text" onClick={() => avatarInput.current?.click()} />
              <Button label="Remove" className="p-button-text p-button-danger" onClick={() => setDraft({ ...draft, avatarUrl: null })} />
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const url = URL.createObjectURL(f);
                setDraft({ ...draft, avatarUrl: url });
              }} />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Display name</div>
              <InputText value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} className="w-full" />
            </div>
            <div>
              <div className="text-sm mb-1">Username</div>
              <InputText value={draft.username} disabled className="w-full opacity-70" />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm mb-1">Bio</div>
              <InputTextarea rows={3} value={draft.bio ?? ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="w-full" />
            </div>
            <div>
              <div className="text-sm mb-1">Website</div>
              <InputText value={draft.website ?? ''} onChange={(e) => setDraft({ ...draft, website: e.target.value })} className="w-full" />
            </div>
            <div>
              <div className="text-sm mb-1">Location</div>
              <InputText value={draft.location ?? ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="w-full" />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm mb-1">Interests</div>
              <Chips value={draft.interests ?? []} onChange={(e) => setDraft({ ...draft, interests: e.value ?? [] })} separator="," className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

