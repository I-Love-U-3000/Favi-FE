"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import AvatarCircle from "./AvatarCircle";

export type EditableSocialLink = {
  id?: string;
  url: string;
};

export type EditableProfile = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: EditableSocialLink[];
};

export default function EditProfileDialog({
  open,
  onClose,
  profile,
  onSave,
  saving = false,
}: {
  open: boolean;
  onClose: () => void;
  profile: EditableProfile;
  onSave: (p: EditableProfile, files: { avatar?: File | null; cover?: File | null }) => void;
  saving?: boolean;
}) {
  const [draft, setDraft] = useState<EditableProfile>(profile);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setDraft(profile);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCoverPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [profile, open]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const handleAvatarFile = (file: File | null) => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreviewUrl(url);
      setDraft(prev => ({ ...prev, avatarUrl: url }));
    } else {
      setDraft(prev => ({ ...prev, avatarUrl: null }));
    }
  };

  const handleCoverFile = (file: File | null) => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl(null);
    }
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreviewUrl(url);
      setDraft(prev => ({ ...prev, coverUrl: url }));
    } else {
      setDraft(prev => ({ ...prev, coverUrl: null }));
    }
  };

  return (
    <Dialog
      header="Edit profile"
      visible={open}
      onHide={onClose}
      style={{ width: 720, maxWidth: '95vw' }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" className="p-button-text" onClick={onClose} />
          <Button
            label={saving ? "Saving..." : "Save"}
            disabled={saving}
            onClick={() => onSave(draft, { avatar: avatarFile, cover: coverFile })}
          />
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
            <Button label="Remove" className="p-button-text p-button-danger" onClick={() => handleCoverFile(null)} />
            <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              handleCoverFile(f);
              e.target.value = "";
            }} />
          </div>
        </div>

        {/* Avatar + basics */}
        <div className="flex items-start gap-4">
          <div>
            <AvatarCircle src={draft.avatarUrl ?? undefined} size={72} />
            <div className="mt-2 flex gap-2">
              <Button label="Change" icon="pi pi-user" className="p-button-text" onClick={() => avatarInput.current?.click()} />
              <Button label="Remove" className="p-button-text p-button-danger" onClick={() => handleAvatarFile(null)} />
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                handleAvatarFile(f);
                e.target.value = "";
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
              <InputText value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="w-full" />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Social links</span>
                <Button
                  type="button"
                  icon="pi pi-plus"
                  className="p-button-text p-button-sm"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      socialLinks: [...(prev.socialLinks ?? []), { url: "" }],
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                {(draft.socialLinks ?? []).map((link, index) => (
                  <div key={link.id ?? index} className="flex gap-2 items-center">
                    <InputText
                      value={link.url}
                      onChange={(e) => {
                        const next = [...(draft.socialLinks ?? [])];
                        next[index] = { ...next[index], url: e.target.value };
                        setDraft({ ...draft, socialLinks: next });
                      }}
                      placeholder="https://example.com/you"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      className="p-button-text p-button-danger"
                      onClick={() => {
                        const next = (draft.socialLinks ?? []).filter((_, i) => i !== index);
                        setDraft({ ...draft, socialLinks: next });
                      }}
                    />
                  </div>
                ))}
                {(!draft.socialLinks || draft.socialLinks.length === 0) && (
                  <div className="text-xs opacity-70">
                    Paste links to your website or social profiles.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

