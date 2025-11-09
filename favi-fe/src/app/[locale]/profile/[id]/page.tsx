"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Button} from "primereact/button";
import {TabView, TabPanel} from "primereact/tabview";
import {Tag} from "primereact/tag";
import {useTranslations} from "next-intl";

import {mockUserProfile} from "@/lib/mockTest/mockUserProfile";
import {mockPost} from "@/lib/mockTest/mockPost";
import {mockCollection} from "@/lib/mockTest/mockCollection";
import type {UserProfile, PhotoPost, Collection} from "@/types";
import CollectionDialog from "@/components/CollectionDialog";
import EditProfileDialog, { EditableProfile } from "@/components/EditProfileDialog";
import ReportDialog from "@/components/ReportDialog";

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

function ActionButtons({profile, onEdit}:{profile: UserProfile; onEdit:()=>void}) {
  const [following, setFollowing] = useState(!!profile.isFollowing);
  const [reportOpen, setReportOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);

  if (profile.isMe) {
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
        onClick={() => setFollowing(v => !v)}
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

  const params = useParams(); // { id?: string | string[] }
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id as string | undefined;

  // Nếu không có id → chuyển 404 client-side hoặc render fallback
  if (!id) {
    // router.replace("/404"); return null;
    return <div className="p-6 text-sm opacity-70">Missing profile id.</div>;
  }

  const baseProfile = useMemo(() => resolveProfile(id), [id]);
  if (!baseProfile) {
    // router.replace("/404"); return null;
    return <div className="p-6 text-sm opacity-70">User not found.</div>;
  }

  // local editable state with localStorage overlay
  const [profile, setProfile] = useState<UserProfile>(baseProfile);
  useEffect(() => {
    try {
      const key = `profile_overrides_${baseProfile.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const ov = JSON.parse(raw);
        setProfile({ ...baseProfile, ...ov });
      } else {
        setProfile(baseProfile);
      }
    } catch { setProfile(baseProfile); }
  }, [baseProfile]);

  const posts = useMemo(() => resolvePosts(profile.id), [profile]);
  const collections = useMemo(() => resolveCollections(profile.id), [profile]);

  const [editOpen, setEditOpen] = useState(false);
  const onSaveProfile = (p: EditableProfile) => {
    setProfile((prev) => ({ ...prev, ...p } as UserProfile));
    try {
      localStorage.setItem(`profile_overrides_${profile.id}`, JSON.stringify(p));
    } catch {}
    setEditOpen(false);
  };

  const joined = profile.joinedAtISO ?? undefined;

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
        </div>

        {/* AVATAR */}
        <div className="absolute inset-x-0 -bottom-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="h-40 w-40 rounded-full overflow-hidden ring-4" style={{ borderColor: 'var(--bg)', backgroundColor: 'var(--bg-secondary)' }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-sm opacity-60">No avatar</div>
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
              <Stat label="Posts" value={profile.stats.posts} />
              <Stat label="Followers" value={profile.stats.followers} />
              <Stat label="Following" value={profile.stats.following} />
            </div>
            <ActionButtons profile={profile} onEdit={() => setEditOpen(true)} />
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
            bio: profile.bio,
            website: profile.website,
            location: profile.location,
            avatarUrl: profile.avatarUrl,
            coverUrl: profile.coverUrl,
            interests: profile.interests ?? [],
          }}
          onSave={onSaveProfile}
        />
      </div>
    </div>
  );
}
