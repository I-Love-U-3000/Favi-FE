"use client";

import {ChangeEvent, RefObject, useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Button} from "primereact/button";
import {TabView, TabPanel} from "primereact/tabview";
import {Tag} from "primereact/tag";
import {useTranslations} from "next-intl";
import { Dialog } from "primereact/dialog";

import {mockUserProfile} from "@/lib/mockTest/mockUserProfile";
import {mockPost} from "@/lib/mockTest/mockPost";
import {mockCollection} from "@/lib/mockTest/mockCollection";
import type {UserProfile, PhotoPost, Collection, PostResponse} from "@/types";
import profileAPI from "@/lib/api/profileAPI";
import postAPI from "@/lib/api/postAPI";
import { normalizeProfile, writeCachedProfile } from "@/lib/profileCache";
import CollectionDialog from "@/components/CollectionDialog";
import EditProfileDialog, { EditableProfile } from "@/components/EditProfileDialog";
import ReportDialog from "@/components/ReportDialog";
import { useAuth } from "@/components/AuthProvider";
import CropImage from "@/components/CropImage";

/* ========== Helpers ========== */
function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function resolveProfile(idOrUsername: string): UserProfile | null {
  const list = asArray<UserProfile>(mockUserProfile);
  const found =
    list.find(p => p.id === idOrUsername) ??
    list.find(p => p.username === idOrUsername);
  return found ?? null;
}

function resolvePosts(ownerId: string): PhotoPost[] {
  const list = asArray<PhotoPost>(mockPost);
  const hasUserId = list.length > 0 && Object.prototype.hasOwnProperty.call(list[0], "userId");
  // @ts-expect-error: userId có thể tồn tại trong mock
  return hasUserId ? list.filter(p => p.userId === ownerId) : list;
}

function resolveCollections(ownerId: string): Collection[] {
  const list = asArray<Collection>(mockCollection);
  const hasUserId = list.length > 0 && Object.prototype.hasOwnProperty.call(list[0], "userId");
  // @ts-expect-error: userId có thể tồn tại trong mock
  return hasUserId ? list.filter(c => c.userId === ownerId) : list;
}

/* ========== UI bits ========== */
function Stat({label, value}: {label: string; value: number | string}) {
  return (
    <div className="text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

function ActionButtons({profile, onEdit, isOwner}:{profile: UserProfile; onEdit:()=>void; isOwner: boolean}) {
  const [following, setFollowing] = useState(!!profile.isFollowing);
  const [reportOpen, setReportOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);

  if (isOwner) {
    return (
      <div className="flex gap-2 items-center">
        <Button label="Edit profile" className="p-button-outlined" onClick={onEdit} />
        <Button label="New collection" icon="pi pi-images" onClick={() => setNewCollectionOpen(true)} />
        <Button icon="pi pi-share-alt" className="p-button-text" />
        <Button icon="pi pi-ellipsis-h" className="p-button-text" />
        <CollectionDialog visible={newCollectionOpen} onHide={() => setNewCollectionOpen(false)} />
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-center">
      <Button
        label={following ? "Following" : "Follow"}
        className={following ? "" : "p-button-rounded"}
        onClick={async () => {
          try {
            if (following) {
              await profileAPI.unfollow(profile.id);
            } else {
              await profileAPI.follow(profile.id);
            }
            setFollowing(v => !v);
          } catch (e:any) {
            alert(e?.error || e?.message || 'Action failed');
          }
        }}
      />
      <Button icon="pi pi-envelope" className="p-button-outlined" />
      <Button icon="pi pi-flag" className="p-button-text" onClick={() => setReportOpen(true)} />
      <Button icon="pi pi-ellipsis-h" className="p-button-text" />
      <ReportDialog visible={reportOpen} onHide={() => setReportOpen(false)} targetType="user" targetName={profile.username} />
    </div>
  );
}

import { Link } from "@/i18n/routing";

function PhotoGrid({items}: {items: PhotoPost[]}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map(p => (
        <Link key={p.id} href={`/posts/${p.id}`} className="group relative overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.alt ?? ""}
            className="h-44 w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 text-xs
                          bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <span className="pi pi-heart" /> {p.likeCount}
              <span className="pi pi-comments" /> {p.commentCount}
            </div>
            <div className="flex gap-1">
              {p.tags?.slice(0, 2).map(t => (
                <Tag key={t} value={t} rounded className="!text-[10px]" />
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CollectionsGrid({items}: {items: Collection[]}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(c => (
        <div key={c.id} className="rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.coverUrl} alt={c.title} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <div className="font-medium">{c.title}</div>
              <div className="text-xs opacity-80">{c.count} photos</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== PAGE (CLIENT) ========== */
export default function ProfilePage() {
  const t = useTranslations("Profile"); // thay cho getTranslations(server)
  const router = useRouter();
  const { user } = useAuth();

  const params = useParams(); // { id?: string | string[] }
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id as string | undefined;

  // Nếu không có id → chuyển 404 client-side hoặc render fallback
  if (!id) {
    // router.replace("/404"); return null;
    return <div className="p-6 text-sm opacity-70">Missing profile id.</div>;
  }

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PhotoPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [posterDialogOpen, setPosterDialogOpen] = useState(false);
  const [rawAvatarUrl, setRawAvatarUrl] = useState<string | null>(null);
  const [rawPosterUrl, setRawPosterUrl] = useState<string | null>(null);
  const [avatarAspect, setAvatarAspect] = useState(1);
  const [posterAspect, setPosterAspect] = useState(16 / 9);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const p = await profileAPI.getById(id);
        const norm = normalizeProfile(p);
        if (!cancelled && norm) setProfile(norm);
        const res = await postAPI.getByProfile(id, 1, 24);
        const mapped: PhotoPost[] = (res.items || []).map((x: PostResponse) => ({
          id: x.id,
          imageUrl: x.medias?.[0]?.thumbnailUrl || x.medias?.[0]?.url || "",
          alt: x.caption ?? "",
          width: x.medias?.[0]?.width || 0,
          height: x.medias?.[0]?.height || 0,
          createdAtISO: x.createdAt,
          likeCount: x.reactions?.total ?? 0,
          commentCount: 0,
          tags: (x.tags || []).map(t => t.name),
        }));
        if (!cancelled) setPosts(mapped);
        // Collections to be loaded later when endpoint available
        if (!cancelled) setCollections([]);
      } catch (e: any) {
        if (!cancelled) setError(e?.error || e?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [editOpen, setEditOpen] = useState(false);
  const onSaveProfile = async (p: EditableProfile, files: { avatar?: File | null; cover?: File | null } = {}) => {
    if (!profile || savingProfile) return;
    setSavingProfile(true);
    try {
      let avatarUrl: string | null | undefined = p.avatarUrl === null ? null : profile.avatarUrl ?? null;
      let coverUrl: string | null | undefined = p.coverUrl === null ? null : profile.coverUrl ?? null;

      if (files?.avatar) {
        const media = await profileAPI.uploadAvatar(files.avatar);
        avatarUrl = media?.thumbnailUrl || media?.url || avatarUrl;
      }
      if (files?.cover) {
        const media = await profileAPI.uploadPoster(files.cover);
        coverUrl = media?.thumbnailUrl || media?.url || coverUrl;
      }

      const payload: Record<string, any> = {
        display_name: p.displayName,
        bio: p.bio ?? null,
        website: p.website ?? null,
        location: p.location ?? null,
        interests: p.interests ?? [],
        avatar_url: avatarUrl ?? null,
        cover_url: coverUrl ?? null,
      };
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });

      const updated = await profileAPI.update(payload);
      const normalized = normalizeProfile(updated);
      if (normalized) {
        setProfile(normalized);
      } else {
        applyProfilePatch({
          displayName: p.displayName,
          bio: p.bio,
          website: p.website,
          location: p.location,
          interests: p.interests,
          avatarUrl: avatarUrl ?? undefined,
          coverUrl: coverUrl ?? undefined,
        });
      }
      setEditOpen(false);
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const applyProfilePatch = (patch: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try { writeCachedProfile(next.id, next); } catch {}
      return next;
    });
  };

  const resetFileInput = (ref: RefObject<HTMLInputElement | null>) => {
    if (ref.current) ref.current.value = "";
  };

  const closeAvatarDialog = () => {
    setAvatarDialogOpen(false);
    setRawAvatarUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    resetFileInput(avatarInputRef);
  };

  const closePosterDialog = () => {
    setPosterDialogOpen(false);
    setRawPosterUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    resetFileInput(posterInputRef);
  };

  const onAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setRawAvatarUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setAvatarDialogOpen(true);
    event.target.value = "";
  };

  const onPosterFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setRawPosterUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setPosterDialogOpen(true);
    event.target.value = "";
  };

  const handleAvatarCropped = async (blob: Blob | null) => {
    if (!blob) {
      closeAvatarDialog();
      return;
    }
    setAvatarUploading(true);
    try {
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
      const media = await profileAPI.uploadAvatar(file);
      const nextUrl = media?.thumbnailUrl || media?.url;
      if (nextUrl) applyProfilePatch({ avatarUrl: nextUrl });
    } catch (e: any) {
      alert(e?.message || "Upload avatar failed");
    } finally {
      setAvatarUploading(false);
      closeAvatarDialog();
    }
  };

  const handlePosterCropped = async (blob: Blob | null) => {
    if (!blob) {
      closePosterDialog();
      return;
    }
    setPosterUploading(true);
    try {
      const file = new File([blob], `poster-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
      const media = await profileAPI.uploadPoster(file);
      const nextUrl = media?.thumbnailUrl || media?.url;
      if (nextUrl) applyProfilePatch({ coverUrl: nextUrl });
    } catch (e: any) {
      alert(e?.message || "Upload cover failed");
    } finally {
      setPosterUploading(false);
      closePosterDialog();
    }
  };

  useEffect(() => {
    return () => {
      if (rawAvatarUrl) URL.revokeObjectURL(rawAvatarUrl);
    };
  }, [rawAvatarUrl]);

  useEffect(() => {
    return () => {
      if (rawPosterUrl) URL.revokeObjectURL(rawPosterUrl);
    };
  }, [rawPosterUrl]);

  if (loading) return <div className="p-6 text-sm opacity-70">Loading profile…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!profile) return <div className="p-6 text-sm opacity-70">User not found.</div>;

  const joined = profile.joinedAtISO ?? undefined;
  const isOwner = !!(profile.isMe || (user?.id && profile.id === user.id));

  return (
    <div className="min-h-screen">
      {/* COVER */}
      <div className="relative">
        <div className="relative w-full aspect-[16/6]" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), transparent)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.coverUrl && (
            <img
              src={profile.coverUrl}
              alt="Cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {posterUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-white text-sm">
              Đang tải ảnh bìa…
            </div>
          )}
          {isOwner && (
            <div className="absolute right-4 top-4 z-20 flex gap-2">
              <Button
                label={posterUploading ? "Đang tải..." : "Đổi ảnh bìa"}
                icon="pi pi-camera"
                className="p-button-sm p-button-outlined"
                onClick={() => posterInputRef.current?.click()}
                disabled={posterUploading}
              />
            </div>
          )}
        </div>

        {/* AVATAR */}
        <div className="absolute inset-x-0 -bottom-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative h-40 w-40 rounded-full overflow-hidden ring-4" style={{ borderColor: 'var(--bg)', backgroundColor: 'var(--bg-secondary)' }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-sm opacity-60">No avatar</div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/40 text-white text-xs">
                  Đang tải avatar…
                </div>
              )}
              {isOwner && (
                <Button
                  label={avatarUploading ? "Đang tải..." : "Đổi avatar"}
                  icon="pi pi-camera"
                  className="p-button-sm p-button-secondary absolute bottom-3 right-3 z-20"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER INFO */}
      <div className="mx-auto max-w-6xl px-6" style={{ color: 'var(--text)' }}>
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between pt-16">
          <div>
            <div className="text-2xl font-semibold">{profile.displayName}</div>
            <div className="text-sm opacity-70">@{profile.username}</div>

            <div className="mt-3 text-sm max-w-2xl">{profile.bio}</div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm opacity-80">
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <i className="pi pi-map-marker" /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-100"
                   href={profile.website} target="_blank" rel="noreferrer">
                  <i className="pi pi-globe" /> {t("Website")}
                </a>
              )}
              {joined && (
                <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                  <i className="pi pi-calendar" /> {t("Joined")} {joined}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Posts" value={profile.stats?.posts ?? 0} />
              <Stat label="Followers" value={profile.stats?.followers ?? 0} />
              <Stat label="Following" value={profile.stats?.following ?? 0} />
            </div>
            <ActionButtons profile={profile} onEdit={() => setEditOpen(true)} isOwner={isOwner} />
          </div>
        </div>

        {/* TABS */}
        <div className="mt-8 mb-20">
          <TabView>
            <TabPanel header="Posts">
              <PhotoGrid items={posts} />
            </TabPanel>

            <TabPanel header="Collections">
              <CollectionsGrid items={collections} />
            </TabPanel>

            <TabPanel header="About">
              <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm opacity-60 mb-1">Bio</div>
                    <p className="text-sm leading-relaxed">{profile.bio}</p>
                  </div>

                  <div>
                    <div className="text-sm opacity-60 mb-2">Interests</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests?.map(it => (
                        <Tag key={it} value={it} rounded />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={{
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            bio: profile.bio ?? undefined,
            website: profile.website ?? undefined,
            location: profile.location ?? undefined,
            avatarUrl: profile.avatarUrl,
            coverUrl: profile.coverUrl,
            interests: profile.interests ?? [],
          }}
          onSave={onSaveProfile}
          saving={savingProfile}
        />
      </div>
      {isOwner && (
        <>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarFileChange}
          />
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPosterFileChange}
          />
          <Dialog
            visible={avatarDialogOpen}
            header="Chỉnh sửa avatar"
            modal
            onHide={closeAvatarDialog}
            className="w-full max-w-2xl"
            contentClassName="!p-0"
          >
            {rawAvatarUrl && (
              <div className="p-4">
                <CropImage
                  imageSrc={rawAvatarUrl}
                  onCropComplete={handleAvatarCropped}
                  aspect={avatarAspect}
                  setAspect={setAvatarAspect}
                  lockAspect
                  outputMime="image/jpeg"
                />
              </div>
            )}
          </Dialog>
          <Dialog
            visible={posterDialogOpen}
            header="Chỉnh sửa ảnh bìa"
            modal
            onHide={closePosterDialog}
            className="w-full max-w-3xl"
            contentClassName="!p-0"
          >
            {rawPosterUrl && (
              <div className="p-4">
                <CropImage
                  imageSrc={rawPosterUrl}
                  onCropComplete={handlePosterCropped}
                  aspect={posterAspect}
                  setAspect={setPosterAspect}
                  lockAspect
                  outputMime="image/jpeg"
                />
              </div>
            )}
          </Dialog>
        </>
      )}
    </div>
  );
}
