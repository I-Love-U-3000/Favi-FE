"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";

import { isValidUsername, normalizeUsername } from "@/lib/validator/username";
import { updateMyProfile } from "@/lib/service/profile";
import { uploadToImgbb } from "@/lib/service/image";

export default function OnboardingPage() {
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);

  // form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // avatar/cover files & preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // ui state
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  // redirect guard + skip if already has username
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profile")
        .select("username, display_name, bio, avatar_url, cover_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.username) {
        // Prefill for editing feel (optional)
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setCoverUrl(data.cover_url ?? null);
      }
    })();
  }, [router]);

  const show = (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) =>
    toastRef.current?.show({ severity, summary, detail, life: 3000 });

  const checkAvailability = async (raw: string) => {
    const u = normalizeUsername(raw);
    if (!isValidUsername(u)) return false;
    setChecking(true);
    const { data, error } = await supabase
      .from("profile")
      .select("id")
      .eq("username", u)
      .maybeSingle();
    setChecking(false);
    return !error && !data; // true nếu chưa tồn tại
  };

  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || undefined),
    [avatarFile, avatarUrl]
  );
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : coverUrl || undefined),
    [coverFile, coverUrl]
  );

  const onUploadIfNeeded = async () => {
    const res: { avatar?: string | null; cover?: string | null } = {};
    if (avatarFile) res.avatar = await uploadToImgbb(avatarFile);
    if (coverFile) res.cover = await uploadToImgbb(coverFile);
    return res;
  };

  const onSubmit = async () => {
    // Username bắt buộc
    const u = normalizeUsername(username);
    if (!isValidUsername(u)) {
      show(
        "warn",
        "Username không hợp lệ",
        "Chỉ [a-z0-9._-], 2–20 ký tự, không bắt đầu/kết thúc bằng dấu, không lặp '..', '__', '--'."
      );
      return;
    }
    // check trùng
    const ok = await checkAvailability(u);
    if (!ok) {
      show("error", "Username đã được dùng");
      return;
    }

    setSaving(true);
    try {
      // upload ảnh nếu có
      const uploaded = await onUploadIfNeeded();

      await updateMyProfile({
        username: u,
        display_name: displayName?.trim() || null,
        bio: bio?.trim() || null,
        avatar_url: uploaded.avatar ?? avatarUrl ?? null,
        cover_url: uploaded.cover ?? coverUrl ?? null,
      });

      show("success", "Đã hoàn tất hồ sơ");
      router.replace("/home");
    } catch (e: any) {
      show("error", "Lưu thất bại", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toast ref={toastRef} />
      <div className="w-full max-w-xl bg-white/80 dark:bg-neutral-900/70 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Hoàn tất tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">Chọn username (bắt buộc) và điền thông tin hồ sơ</p>

        {/* Cover preview */}
        <div className="mt-4">
          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400 text-sm">Cover preview</div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            <InputText
              value={coverUrl ?? ""}
              onChange={(e) => setCoverUrl(e.target.value || null)}
              placeholder="Hoặc dán URL cover"
              className="flex-1"
            />
          </div>
        </div>

        {/* Avatar + fields */}
        <div className="mt-4 grid grid-cols-[72px_1fr] gap-4 items-start">
          <div className="w-18 h-18 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400 text-xs">Avatar</div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <InputText
                value={avatarUrl ?? ""}
                onChange={(e) => setAvatarUrl(e.target.value || null)}
                placeholder="Hoặc dán URL avatar"
                className="flex-1"
              />
            </div>

            <label className="block text-sm">Username *</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">@</span>
              <InputText
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                autoFocus
              />
              <Button
                type="button"
                label={checking ? "Checking..." : "Check"}
                onClick={() =>
                  checkAvailability(username).then((ok) =>
                    show(ok ? "success" : "error", ok ? "Có thể dùng" : "Đã tồn tại")
                  )
                }
                disabled={checking}
                className="p-button-outlined"
              />
            </div>

            <label className="block text-sm">Display name</label>
            <InputText
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên hiển thị"
            />

            <label className="block text-sm">Bio</label>
            <InputTextarea
              value={bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
              rows={3}
              placeholder="Giới thiệu ngắn..."
              autoResize
              className="w-full"
            />
          </div>
        </div>

        <Button
          label={saving ? "Saving..." : "Hoàn tất"}
          className="w-full mt-6"
          onClick={onSubmit}
          disabled={saving}
        />
      </div>
    </div>
  );
}