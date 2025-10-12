"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";

import CropImage from "@/components/CropImage";
import { isValidUsername, normalizeUsername } from "@/lib/validator/username";
import { updateMyProfile } from "@/lib/service/profile";
import { uploadToCloudinary } from "@/lib/service/image";
import { BackgroundBubbles } from "@/components/LoginRegisterBackground";

type NameStatus = "idle" | "invalid" | "checking" | "available" | "taken";

export default function OnboardingPage() {
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);

  // form
  const [username, setUsername] = useState("");
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // URLs hiện có từ server (prefill)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // blob + preview tạm sau crop
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // dialog crop
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [rawAvatarUrl, setRawAvatarUrl] = useState<string | null>(null);
  const [rawCoverUrl, setRawCoverUrl] = useState<string | null>(null);

  // aspect (có thể khoá hoặc cho chọn ngay trong CropImage)
  const [avatarAspect, setAvatarAspect] = useState(1);
  const [coverAspect, setCoverAspect] = useState(16 / 9);

  const [saving, setSaving] = useState(false);

  const safeRevoke = (u?: string | null) => {
    try {
      if (u) URL.revokeObjectURL(u);
    } catch {}
  };

  const onAvatarRecrop = () => {
    if (avatarPreviewUrl) {
      setRawAvatarUrl(avatarPreviewUrl);
      setAvatarDialogOpen(true);
    } else if (rawAvatarUrl) {
      setAvatarDialogOpen(true);
    } else {
      (document.getElementById("avatar-file") as HTMLInputElement | null)?.click();
    }
  };

  const onAvatarRemove = () => {
    safeRevoke(rawAvatarUrl);
    safeRevoke(avatarPreviewUrl);
    setRawAvatarUrl(null);
    setAvatarBlob(null);
    setAvatarPreviewUrl(null);
    setAvatarUrl(null);
  };

  const onCoverRecrop = () => {
    if (coverPreviewUrl) {
      setRawCoverUrl(coverPreviewUrl);
      setCoverDialogOpen(true);
    } else if (rawCoverUrl) {
      setCoverDialogOpen(true);
    } else {
      (document.getElementById("cover-file") as HTMLInputElement | null)?.click();
    }
  };

  const onCoverRemove = () => {
    safeRevoke(rawCoverUrl);
    safeRevoke(coverPreviewUrl);
    setRawCoverUrl(null);
    setCoverBlob(null);
    setCoverPreviewUrl(null);
    setCoverUrl(null);
  };

  // guard + prefill
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profile")
        .select("username, display_name, bio, avatar_url, cover_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        if (data.username) setUsername(data.username);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setCoverUrl(data.cover_url ?? null);
      }
    })();
  }, [router]);

  const show = (
    severity: "success" | "info" | "warn" | "error",
    summary: string,
    detail?: string
  ) => toastRef.current?.show({ severity, summary, detail, life: 3000 });

  // auto-check username (debounce 400ms)
  useEffect(() => {
    const u = normalizeUsername(username);
    if (!u) {
      setNameStatus("idle");
      return;
    }
    if (!isValidUsername(u)) {
      setNameStatus("invalid");
      return;
    }

    setNameStatus("checking");
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profile")
        .select("id")
        .eq("username", u)
        .maybeSingle();

      if (!error && !data) setNameStatus("available");
      else if (!error && data) setNameStatus("taken");
      else setNameStatus("idle");
    }, 400);

    return () => clearTimeout(t);
  }, [username]);

  // preview ưu tiên ảnh tạm sau crop
  const avatarPreview = useMemo(
    () => avatarPreviewUrl || avatarUrl || undefined,
    [avatarPreviewUrl, avatarUrl]
  );
  const coverPreview = useMemo(
    () => coverPreviewUrl || coverUrl || undefined,
    [coverPreviewUrl, coverUrl]
  );

  // chọn file → mở dialog crop
  const onPickAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setRawAvatarUrl(url);
    setAvatarDialogOpen(true);
    e.currentTarget.value = "";
  };
  const onPickCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setRawCoverUrl(url);
    setCoverDialogOpen(true);
    e.currentTarget.value = "";
  };

  // nhận blob sau crop (avatar)
  const onAvatarCropped = (blob: Blob | null) => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarBlob(blob);
    setAvatarPreviewUrl(blob ? URL.createObjectURL(blob) : null);
    setAvatarDialogOpen(false);
    if (rawAvatarUrl) {
      URL.revokeObjectURL(rawAvatarUrl);
      setRawAvatarUrl(null);
    }
  };
  // nhận blob sau crop (cover)
  const onCoverCropped = (blob: Blob | null) => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverBlob(blob);
    setCoverPreviewUrl(blob ? URL.createObjectURL(blob) : null);
    setCoverDialogOpen(false);
    if (rawCoverUrl) {
      URL.revokeObjectURL(rawCoverUrl);
      setRawCoverUrl(null);
    }
  };

  // submit
  const canSubmit =
    !saving &&
    !!normalizeUsername(username) &&
    nameStatus === "available" &&
    isValidUsername(normalizeUsername(username));

  const onSubmit = async () => {
    const u = normalizeUsername(username);
    if (!isValidUsername(u)) {
      show("warn", "Username không hợp lệ", "Chỉ [a-z0-9._-], 2–20 ký tự.");
      return;
    }
    if (nameStatus !== "available") {
      show("error", "Username chưa sẵn sàng", "Vui lòng chọn username khác.");
      return;
    }

    setSaving(true);
    try {
      // upload ảnh nếu có blob; nếu không dùng URL cũ
      let finalAvatar = avatarUrl ?? null;
      let finalCover = coverUrl ?? null;

      if (avatarBlob) {
        const file = new File([avatarBlob], `avatar_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        finalAvatar = await uploadToCloudinary(file);
      }
      if (coverBlob) {
        const file = new File([coverBlob], `cover_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        finalCover = await uploadToCloudinary(file);
      }

      await updateMyProfile({
        username: u,
        display_name: displayName?.trim() || null,
        bio: bio?.trim() || null,
        avatar_url: finalAvatar,
        cover_url: finalCover,
      });

      show("success", "Đã hoàn tất hồ sơ");
      router.replace("/home");
    } catch (e: any) {
      show("error", "Lưu thất bại", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  // nhãn hint cạnh ô username
  const nameHint =
    nameStatus === "invalid"
      ? "Không hợp lệ"
      : nameStatus === "checking"
      ? "Đang kiểm tra..."
      : nameStatus === "available"
      ? "Có thể dùng"
      : nameStatus === "taken"
      ? "Đã tồn tại"
      : "";

  const statusTone =
    nameStatus === "available"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : nameStatus === "invalid" || nameStatus === "taken"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
      : nameStatus === "checking"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <div className="relative min-h-screen">
      <BackgroundBubbles fast />

      <Toast ref={toastRef} />

      <header className="top-0 z-10 backdrop-blur-md/50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">Hoàn tất tài khoản</div>
          <div className="text-sm opacity-70">Bước cuối để vào Favi ✨</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Card */}
          <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/60 shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            <div className="relative">
              <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-sky-200/40 to-purple-200/40 dark:from-sky-900/20 dark:to-purple-900/20">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">
                    Ảnh cover (16:9)
                  </div>
                )}

                {/* Cover actions (top-right) */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <label className="p-button p-component cursor-pointer !p-2 !text-xs">
                    <span className="p-button-label">Tải cover</span>
                    <input id="cover-file" type="file" accept="image/*" className="hidden" onChange={onPickCoverFile} />
                  </label>
                  <Button type="button" label="Crop lại" className="p-button-outlined !p-2 !text-xs" onClick={onCoverRecrop} />
                  {(coverPreviewUrl || rawCoverUrl || coverUrl) && (
                    <Button type="button" label="Bỏ ảnh" className="p-button-text p-button-danger !p-2 !text-xs" onClick={onCoverRemove} />
                  )}
                </div>
              </div>

              {/* Avatar overlap */}
              <div className="absolute -bottom-10 left-6 w-24 h-24 rounded-full ring-4 ring-white dark:ring-neutral-900 overflow-hidden bg-gray-100 dark:bg-neutral-800">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400 text-xs">Avatar</div>
                )}
              </div>
            </div>

            {/* Avatar actions */}
            <div className="pt-14 px-6 pb-6">
              <div className="flex items-center gap-2">
                <label className="p-button p-component cursor-pointer">
                  <span className="p-button-label">Tải avatar</span>
                  <input id="avatar-file" type="file" accept="image/*" className="hidden" onChange={onPickAvatarFile} />
                </label>
                <Button type="button" label="Crop lại" className="p-button-outlined" onClick={onAvatarRecrop} />
                {(avatarPreviewUrl || rawAvatarUrl || avatarUrl) && (
                  <Button type="button" label="Bỏ ảnh" className="p-button-text p-button-danger" onClick={onAvatarRemove} />
                )}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/60 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-6">
            <p className="text-sm text-gray-600 dark:text-neutral-300 mb-4">
              Chọn <span className="font-medium">username</span> (bắt buộc) và điền thông tin hồ sơ.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">@</span>
                  <InputText
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    autoFocus
                    className={
                      nameStatus === "invalid" || nameStatus === "taken" ? "p-invalid" : ""
                    }
                  />
                  <span className={`p-inputgroup-addon !text-xs min-w-[120px] ${statusTone}`}>{nameHint}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ chữ thường, số và . _ - (2–20 ký tự).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display name</label>
                <InputText
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên hiển thị"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <InputTextarea
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Giới thiệu ngắn..."
                  autoResize
                  className="w-full"
                />
              </div>

              <Button
                label={saving ? "Saving..." : "Hoàn tất"}
                className="w-full !h-12 !text-base"
                onClick={onSubmit}
                disabled={!canSubmit}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Hidden inputs for direct click triggers */}
      <input id="avatar-file" type="file" accept="image/*" className="hidden" onChange={onPickAvatarFile} />
      <input id="cover-file" type="file" accept="image/*" className="hidden" onChange={onPickCoverFile} />

      {/* Crop dialogs */}
      <Dialog
        visible={avatarDialogOpen}
        header="Crop avatar (1:1)"
        modal
        onHide={() => {
          setAvatarDialogOpen(false);
          if (rawAvatarUrl) {
            URL.revokeObjectURL(rawAvatarUrl);
            setRawAvatarUrl(null);
          }
        }}
        className="w-full max-w-2xl"
        contentClassName="!p-0"
      >
        {rawAvatarUrl && (
          <div className="p-4">
            <CropImage
              imageSrc={rawAvatarUrl}
              onCropComplete={(blob) => onAvatarCropped(blob)}
              aspect={avatarAspect}
              setAspect={setAvatarAspect}
            />
          </div>
        )}
      </Dialog>

      <Dialog
        visible={coverDialogOpen}
        header="Crop cover (16:9)"
        modal
        onHide={() => setCoverDialogOpen(false)}
        className="w-full max-w-3xl"
        contentClassName="!p-0"
      >
        {rawCoverUrl && (
          <div className="p-4">
            <CropImage
              imageSrc={rawCoverUrl}
              onCropComplete={(blob) => onCoverCropped(blob)}
              aspect={coverAspect}
              setAspect={setCoverAspect}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
