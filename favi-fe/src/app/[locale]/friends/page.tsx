"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { useTranslations } from "next-intl";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import profileAPI from "@/lib/api/profileAPI";
import { useAuth } from "@/components/AuthProvider";

type Recommendation = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
};

export default function FriendsPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("FriendsPage");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated) {
        setRecommendations([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await profileAPI.getRecommendations(0, 20);
        if (!cancelled) {
          const items = (res?.items ?? res) as any[];
          const mapped: Recommendation[] = (items || []).map((p) => ({
            id: String(p.id ?? p.Id ?? p.profileId ?? p.profileID ?? p.userId ?? ""),
            username: p.username ?? p.Username ?? p.handle ?? String(p.id ?? p.Id ?? ""),
            displayName: p.displayName ?? p.DisplayName ?? p.name ?? p.fullName ?? undefined,
            avatarUrl: p.avatarUrl ?? p.AvatarUrl ?? p.avatar ?? p.avatarURL ?? undefined,
            bio: p.bio ?? p.Bio ?? undefined,
            followersCount: p.stats?.followers ?? p.stats?.Followers ?? p.followersCount ?? p.FollowersCount ?? undefined,
            followingCount: p.stats?.following ?? p.stats?.Following ?? p.followingCount ?? p.FollowingCount ?? undefined,
          })).filter(x => x.id && x.username);
          setRecommendations(mapped);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || e?.error || "Failed to load recommendations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleFollow = async (id: string) => {
    try {
      setActioning(id);
      await profileAPI.follow(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      // ignore for now, maybe toast later
    } finally {
      setActioning((current) => (current === id ? null : current));
    }
  };

  const text = useMemo(
    () => ({
      title: t("Title", { defaultMessage: "Friends" }),
      sectionSuggestions: t("SuggestionsTitle", { defaultMessage: "Who you may know" }),
      loginRequired: t("LoginRequired", { defaultMessage: "Please login to see suggestions." }),
      empty: t("Empty", { defaultMessage: "No suggestions at the moment." }),
      follow: t("Follow", { defaultMessage: "Follow" }),
    }),
    [t]
  );

  return (
    <div className="max-w-5xl mx-auto p-6" style={{ color: "var(--text)" }}>
      <h1 className="text-2xl font-semibold mb-6">{text.title}</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">{text.sectionSuggestions}</h2>

        {!isAuthenticated && (
          <div className="text-sm opacity-70">{text.loginRequired}</div>
        )}

        {isAuthenticated && loading && (
          <div className="text-sm opacity-70">Loading...</div>
        )}

        {isAuthenticated && error && !loading && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {isAuthenticated && !loading && !error && recommendations.length === 0 && (
          <div className="text-sm opacity-70">{text.empty}</div>
        )}

        <div className="mt-3 space-y-3">
          {recommendations.map((s) => {
            const display = s.displayName || s.username;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl p-3"
                style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <ProfileHoverCard
                    user={{
                      id: s.id,
                      username: s.username,
                      name: display,
                      avatarUrl: s.avatarUrl,
                      bio: s.bio,
                      followersCount: s.followersCount,
                      followingCount: s.followingCount,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.avatarUrl || "/avatar-default.svg"}
                      alt={display}
                      className="w-10 h-10 rounded-full cursor-pointer border"
                    />
                  </ProfileHoverCard>
                  <div>
                    <div className="text-sm font-medium">{display}</div>
                    <div className="text-xs opacity-70">@{s.username}</div>
                  </div>
                </div>
                <Button
                  label={text.follow}
                  onClick={() => handleFollow(s.id)}
                  loading={actioning === s.id}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
