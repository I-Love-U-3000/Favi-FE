"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { Tag } from "primereact/tag";
import { useTranslations } from "next-intl";
import { mockUserProfile } from "@/lib/mockTest/mockUserProfile";
import { mockPost } from "@/lib/mockTest/mockPost";
import { mockCollection } from "@/lib/mockTest/mockCollection";
import type { UserProfile, PhotoPost, Collection, PostResponse, SocialLink, SocialKind } from "@/types";
import profileAPI from "@/lib/api/profileAPI";
import postAPI from "@/lib/api/postAPI";
import chatAPI from "@/lib/api/chatAPI";
import { normalizeProfile, writeCachedProfile } from "@/lib/profileCache";
import CollectionDialog from "@/components/CollectionDialog";
import EditProfileDialog, { EditableProfile } from "@/components/EditProfileDialog";
import ReportDialog from "@/components/ReportDialog";
import { useAuth } from "@/components/AuthProvider";
import { useOverlay } from "@/components/RootProvider";

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
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

function ActionButtons({ profile, onEdit, isOwner }: { profile: UserProfile; onEdit: () => void; isOwner: boolean }) {
  const [following, setFollowing] = useState(!!profile.isFollowing);
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();

  const handleMessageClick = async () => {
    try {
      // gọi backend tạo / lấy DM giữa currentUser và profile này
      const conv = await chatAPI.getOrCreateDm(profile.id);
      // điều hướng sang trang chat, truyền conversationId
      router.push(`/chat?conversationId=${conv.id}`);
    } catch (e: any) {
      alert(e?.error || e?.message || "Failed to start conversation");
    }
  };

  if (isOwner) {
    return (
      <div className="flex gap-2 items-center">
        <Button label="Edit profile" className="p-button-outlined" onClick={onEdit} />
        <Button icon="pi pi-share-alt" className="p-button-text" />
        <MoreMenuButton />
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
          } catch (e: any) {
            alert(e?.error || e?.message || 'Action failed');
          }
        }}
      />
      <Button
        icon="pi pi-envelope"
        className="p-button-outlined"
        onClick={handleMessageClick}
      />
      <Button icon="pi pi-flag" className="p-button-text" onClick={() => setReportOpen(true)} />
      <MoreMenuButton />
      <ReportDialog visible={reportOpen} onHide={() => setReportOpen(false)} targetType="user" targetName={profile.username} />
    </div>
  );
}

function MoreMenuButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleAction = (label: string) => {
    setOpen(false);
    alert(`${label} is coming soon.`);
  };

  const options = [
    { key: "archive", label: "Kho lưu trữ" },
    { key: "trash", label: "Thùng rác" },
  ];

  return (
    <div className="relative" ref={wrapperRef}>
      <Button icon="pi pi-ellipsis-h" className="p-button-text" aria-label="More options" onClick={() => setOpen(v => !v)} />
      {open && (
        <div className="absolute right-0 mt-2 z-20 w-44 overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-neutral-900 text-sm">
          {options.map(option => (
            <button
              key={option.key}
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => handleAction(option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from "@/i18n/routing";

function PhotoGrid({ items }: { items: PhotoPost[] }) {
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

function CollectionsGrid({ items }: { items: Collection[] }) {
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
  const { showToast } = useOverlay();

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
  const [savingProfile, setSavingProfile] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

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

  const detectSocialKindFromUrl = (url: string): SocialKind | "Website" => {
    let host = "";
    try {
      const normalized = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      host = new URL(normalized).hostname.toLowerCase();
    } catch {
      return "Website";
    }

    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "Twitter";
    if (host.includes("tiktok.com")) return "Tiktok";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "Youtube";
    if (host.includes("github.com")) return "Github";
    if (host.includes("linkedin.com")) return "LinkedIn";
    return "Website";
  };

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const loadLinks = async () => {
      setLoadingLinks(true);
      try {
        const raw = await profileAPI.getLinksPublic(profile.id);
        const items: any[] = Array.isArray(raw) ? raw : raw?.items ?? [];
        if (cancelled) return;
        const mapped: SocialLink[] = items
          .map((x) => {
            const url: string = (x.url ?? x.Url ?? "").trim();
            if (!url) return null;
            const rawKind = x.socialKind ?? x.SocialKind ?? x.type ?? x.Type ?? x.kind ?? x.Kind;
            let socialKind: SocialKind | "Website";
            if (typeof rawKind === "number") {
              const map: Record<number, SocialKind> = {
                0: "Website",
                1: "Facebook",
                2: "Instagram",
                3: "Twitter",
                4: "Tiktok",
                5: "Youtube",
                6: "Github",
                7: "LinkedIn",
              };
              socialKind = map[rawKind] ?? "Website";
            } else if (typeof rawKind === "string") {
              const k = rawKind as SocialKind;
              socialKind =
                k === "Website" ||
                  k === "Facebook" ||
                  k === "Instagram" ||
                  k === "Twitter" ||
                  k === "Tiktok" ||
                  k === "Youtube" ||
                  k === "Github" ||
                  k === "LinkedIn"
                  ? k
                  : detectSocialKindFromUrl(url);
            } else {
              socialKind = detectSocialKindFromUrl(url);
            }

            const rawId = x.id ?? x.Id;
            return {
              id: rawId ? String(rawId) : undefined,
              socialKind,
              url,
            } as SocialLink;
          })
          .filter((x): x is SocialLink => Boolean(x));
        setLinks(mapped);
      } catch {
        if (!cancelled) setLinks([]);
      } finally {
        if (!cancelled) setLoadingLinks(false);
      }
    };

    loadLinks();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!previewImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage]);

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
        displayName: p.displayName,
        bio: p.bio ?? null,
        website: p.website ?? null,
        location: p.location ?? null,
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
          avatarUrl: avatarUrl ?? "/avatar-default.svg",
          coverUrl: coverUrl ?? undefined,
        });
      }

      // Sync social links (best-effort)
      if (p.socialLinks) {
        try {
          const currentById = new Map<string, SocialLink>();
          links.forEach((l) => {
            if (l.id) currentById.set(l.id, l);
          });

          const next = (p.socialLinks || []).filter((l) => l.url.trim());

          // Determine removals and updates
          const toRemove: string[] = [];
          currentById.forEach((existing, id) => {
            const nextItem = next.find((n) => n.id === id);
            if (!nextItem) {
              toRemove.push(id);
            } else if (nextItem.url.trim() !== existing.url) {
              toRemove.push(id);
            }
          });

          // Determine additions (new or changed)
          const toAdd = next.filter(
            (n) =>
              !n.id ||
              !n.id ||
              !currentById.has(n.id) ||
              currentById.get(n.id)?.url !== n.url.trim()
          );

          for (const id of toRemove) {
            await profileAPI.removeLink(id);
          }

          for (const item of toAdd) {
            const url = item.url.trim();
            const kind = detectSocialKindFromUrl(url);
            await profileAPI.addLink({ socialKind: kind, url });
          }

          // Reload links after changes
          const raw = await profileAPI.getLinksPublic(profile.id);
          const items: any[] = Array.isArray(raw) ? raw : raw?.items ?? [];
          const mapped: SocialLink[] = items
            .map((x) => {
              const url: string = (x.url ?? x.Url ?? "").trim();
              if (!url) return null;
              const rawKind = x.socialKind ?? x.SocialKind ?? x.type ?? x.Type ?? x.kind ?? x.Kind;
              let socialKind: SocialKind | "Website";
              if (typeof rawKind === "number") {
                const map: Record<number, SocialKind> = {
                  0: "Website",
                  1: "Facebook",
                  2: "Instagram",
                  3: "Twitter",
                  4: "Tiktok",
                  5: "Youtube",
                  6: "Github",
                  7: "LinkedIn",
                };
                socialKind = map[rawKind] ?? "Website";
              } else if (typeof rawKind === "string") {
                const k = rawKind as SocialKind;
                socialKind =
                  k === "Website" ||
                    k === "Facebook" ||
                    k === "Instagram" ||
                    k === "Twitter" ||
                    k === "Tiktok" ||
                    k === "Youtube" ||
                    k === "Github" ||
                    k === "LinkedIn"
                    ? k
                    : detectSocialKindFromUrl(url);
              } else {
                socialKind = detectSocialKindFromUrl(url);
              }

              const rawId = x.id ?? x.Id;
              return {
                id: rawId ? String(rawId) : undefined,
                socialKind,
                url,
              } as SocialLink;
            })
            .filter((x): x is SocialLink => Boolean(x));
          setLinks(mapped);
        } catch {
          // ignore link sync errors; profile already updated
        }
      }

      showToast({
        severity: "success",
        summary: t("UpdateProfileSuccessTitle"),
        detail: t("UpdateProfileSuccessMessage"),
        life: 3500,
      });
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
      try { writeCachedProfile(next.id, next); } catch { }
      return next;
    });
  };

  if (loading) return <div className="p-6 text-sm opacity-70">Loading profile…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!profile) return <div className="p-6 text-sm opacity-70">User not found.</div>;

  const isOwner = !!(profile.isMe || (user?.id && profile.id === user.id));
  const trimmedDisplayName = profile.displayName?.trim();
  const primaryName = trimmedDisplayName || profile.username;
  const coverUrl = profile.coverUrl ?? "";
  const avatarUrl = profile.avatarUrl ?? "/avatar-default.svg";

  return (
    <div className="min-h-screen">
      {/* COVER */}
      <div className="relative">
        <div className="relative w-full aspect-[16/6]" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), transparent)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {coverUrl && (
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ background: 'transparent' }}
              aria-label="Xem ảnh bìa"
              onClick={() => setPreviewImage({ url: coverUrl, alt: `${primaryName} cover` })}
            >
              <img
                src={coverUrl}
                alt={`${primaryName} cover`}
                className="h-full w-full object-cover"
              />
            </button>
          )}
        </div>

        {/* AVATAR */}
        <div className="absolute inset-x-0 -bottom-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative h-40 w-40 rounded-full overflow-hidden ring-4" style={{ borderColor: 'var(--bg)', backgroundColor: 'var(--bg-secondary)' }}>
              {avatarUrl ? (
                <button
                  type="button"
                  className="absolute inset-0 h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-full"
                  style={{ background: 'transparent' }}
                  aria-label="Xem avatar"
                  onClick={() => {
                    if (avatarUrl != "/avatar-default.svg") {
                      setPreviewImage({ url: avatarUrl, alt: `${primaryName} cover` })
                    }
                  }}
                >
                  <img src={avatarUrl} alt={`${primaryName} avatar`} className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="h-full w-full grid place-items-center text-sm opacity-60">No avatar</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER INFO */}
      <div className="mx-auto max-w-6xl px-6" style={{ color: 'var(--text)' }}>
        <div className="flex flex-col md:flex-row gap-4 justify-between pt-16">
          <div>
            <div className="text-2xl font-semibold">{primaryName}</div>
            {trimmedDisplayName && (
              <div className="text-sm opacity-70">@{profile.username}</div>
            )}

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
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            <TabPanel header="Posts">
              <PhotoGrid items={posts} />
            </TabPanel>

            <TabPanel header="Collections">
              {isOwner && (
                <div className="flex justify-end mb-4">
                  <Button label="New collection" icon="pi pi-images" onClick={() => setNewCollectionOpen(true)} />
                </div>
              )}
              <CollectionsGrid items={collections} />
            </TabPanel>

            <TabPanel header="Links">
              <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="space-y-3">
                  {loadingLinks ? (
                    <div className="text-sm opacity-70">Loading links...</div>
                  ) : links.length === 0 ? (
                    <div className="text-sm opacity-70">
                      No social links have been added yet.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {links.map((link) => {
                        const kind = link.socialKind;
                        const icon =
                          kind === "Facebook"
                            ? "pi pi-facebook"
                            : kind === "Instagram"
                              ? "pi pi-instagram"
                              : kind === "Twitter"
                                ? "pi pi-twitter"
                                : kind === "Tiktok"
                                  ? "pi pi-video"
                                  : kind === "Youtube"
                                    ? "pi pi-youtube"
                                    : kind === "Github"
                                      ? "pi pi-github"
                                      : kind === "LinkedIn"
                                        ? "pi pi-linkedin"
                                        : "pi pi-link";
                        return (
                          <a
                            key={link.id ?? link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm"
                            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                          >
                            <i className={icon} />
                            <span className="truncate max-w-[180px]">{link.url}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
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
            socialLinks: links.map((l) => ({ id: l.id, url: l.url })),
          }}
          onSave={onSaveProfile}
          saving={savingProfile}
        />
        {isOwner && (
          <CollectionDialog visible={newCollectionOpen} onHide={() => setNewCollectionOpen(false)} />
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="w-10 h-10 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="Close preview"
              onClick={(event) => {
                event.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <i className="pi pi-times" />
            </button>
          </div>
          <div className="max-w-[90vw] max-h-[85vh]" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
