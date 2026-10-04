"use client";

import { useEffect, useState, useCallback } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { useAuth } from "@/components/AuthProvider";
import { profileAPI } from "@/lib/api/profileAPI";
import { useTranslations } from "next-intl";

type PrivacyLevel = "Public" | "Followers" | "Private";

interface PrivacyOption {
  label: string;
  value: PrivacyLevel;
  description: string;
}

export default function SettingsPage() {
  const t = useTranslations("SettingsPage");
  const { user, isAuthenticated } = useAuth();

  const [profilePrivacy, setProfilePrivacy] = useState<PrivacyLevel>("Public");
  const [followersPrivacy, setFollowersPrivacy] = useState<PrivacyLevel>("Public");
  const [initialProfilePrivacy, setInitialProfilePrivacy] = useState<PrivacyLevel>("Public");
  const [initialFollowersPrivacy, setInitialFollowersPrivacy] = useState<PrivacyLevel>("Public");
  const [version, setVersion] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PRIVACY_OPTIONS: PrivacyOption[] = [
    {
      label: t("Public"),
      value: "Public",
      description: t("PublicDesc"),
    },
    {
      label: t("Followers"),
      value: "Followers",
      description: t("FollowersDesc"),
    },
    {
      label: t("Private"),
      value: "Private",
      description: t("PrivateDesc"),
    },
  ];

  // Helper to fetch the latest profile data and version from backend
  const loadProfile = useCallback(async (targetUserId?: string) => {
    const id = targetUserId || user?.id;
    if (!id) return null;

    try {
      const p: any = await profileAPI.getById(id);
      if (p) {
        const rawPrivacy = p.privacyLevel;
        const pPriv: PrivacyLevel =
          rawPrivacy === 1 || rawPrivacy === "Followers"
            ? "Followers"
            : rawPrivacy === 2 || rawPrivacy === "Private"
            ? "Private"
            : "Public";

        const rawFollowPrivacy = p.followPrivacyLevel;
        const fPriv: PrivacyLevel =
          rawFollowPrivacy === 1 || rawFollowPrivacy === "Followers"
            ? "Followers"
            : rawFollowPrivacy === 2 || rawFollowPrivacy === "Private"
            ? "Private"
            : "Public";

        setInitialProfilePrivacy(pPriv);
        setInitialFollowersPrivacy(fPriv);
        const latestVersion = typeof p.version === "number" ? p.version : 1;
        setVersion(latestVersion);

        return {
          profile: p,
          pPriv,
          fPriv,
          version: latestVersion,
        };
      }
    } catch (err) {
      console.debug("Could not fetch profile settings:", err);
    }
    return null;
  }, [user?.id]);

  // Load existing privacy settings on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await loadProfile(user.id);
      if (!cancelled && res) {
        setProfilePrivacy(res.pPriv);
        setFollowersPrivacy(res.fPriv);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, loadProfile]);

  const hasChanges =
    profilePrivacy !== initialProfilePrivacy ||
    followersPrivacy !== initialFollowersPrivacy;

  const handleSave = async () => {
    if (!isAuthenticated || saving || !user?.id) return;
    setSaving(true);
    setError(null);
    setSyncNotice(null);
    setSaved(false);

    const privacyToNum = (p: PrivacyLevel) =>
      p === "Followers" ? 1 : p === "Private" ? 2 : 0;

    try {
      const res: any = await profileAPI.update({
        privacyLevel: privacyToNum(profilePrivacy),
        followPrivacyLevel: privacyToNum(followersPrivacy),
        version,
      });

      setInitialProfilePrivacy(profilePrivacy);
      setInitialFollowersPrivacy(followersPrivacy);
      if (res?.version) setVersion(res.version);

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      // Check for Concurrency Conflict (HTTP 409 or CONCURRENCY_CONFLICT code)
      const isConflict =
        err?.status === 409 ||
        err?.code === "CONCURRENCY_CONFLICT" ||
        err?.message?.includes("phiên làm việc khác") ||
        err?.error?.includes("phiên làm việc khác");

      if (isConflict) {
        // Automatically fetch the latest version of the object
        const latest = await loadProfile(user.id);
        if (latest && typeof latest.version === "number") {
          // Attempt automatic retry with the fresh version
          try {
            const retryRes: any = await profileAPI.update({
              privacyLevel: privacyToNum(profilePrivacy),
              followPrivacyLevel: privacyToNum(followersPrivacy),
              version: latest.version,
            });

            setInitialProfilePrivacy(profilePrivacy);
            setInitialFollowersPrivacy(followersPrivacy);
            if (retryRes?.version) setVersion(retryRes.version);

            setSaved(true);
            setSyncNotice(t("AutoSyncSuccess"));
            setTimeout(() => {
              setSaved(false);
              setSyncNotice(null);
            }, 3500);
            return;
          } catch (retryErr: any) {
            // If retry also failed, sync latest values into state and inform user
            setProfilePrivacy(latest.pPriv);
            setFollowersPrivacy(latest.fPriv);
            setError(
              err?.message ||
              t("ConflictNotice")
            );
            return;
          }
        }
      }

      setError(err?.error || err?.message || t("SaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const selectedOptionTemplate = (option: PrivacyOption, props: any) => {
    if (option) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{option.label}</span>
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  const optionTemplate = (option: PrivacyOption) => {
    return (
      <div className="flex flex-col py-1">
        <span className="font-medium text-sm">{option.label}</span>
        <span className="text-xs opacity-70 mt-0.5">{option.description}</span>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24 md:pb-12" style={{ color: "var(--text)" }}>
      {/* Page Header with Save Button on top for quick access */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Title")}</h1>
          <p className="text-xs sm:text-sm opacity-70 mt-0.5">{t("PrivacyDesc")}</p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full animate-fade-in">
                <i className="pi pi-check text-xs" />
                {t("Saved")}
              </span>
            )}
          </div>
        )}
      </div>

      {syncNotice && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm flex items-center gap-3 animate-fade-in">
          <i className="pi pi-sync text-lg shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
          <span>{syncNotice}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
          <i className="pi pi-exclamation-circle text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Appearance Section */}
      <section
        className="rounded-2xl p-4 sm:p-6 mb-6 glass-panel transition"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <i className="pi pi-palette text-lg opacity-80" />
          <h2 className="text-lg font-semibold">{t("Appearance")}</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("Theme")}</div>
            <div className="text-xs opacity-70">{t("ThemeDesc")}</div>
          </div>
          <ThemeSwitcher />
        </div>
      </section>

      {/* Language Section */}
      <section
        className="rounded-2xl p-4 sm:p-6 mb-6 glass-panel transition"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <i className="pi pi-globe text-lg opacity-80" />
          <h2 className="text-lg font-semibold">{t("Language")}</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("AppLanguage")}</div>
            <div className="text-xs opacity-70">{t("LanguageDesc")}</div>
          </div>
          <LanguageSwitcher />
        </div>
      </section>

      {/* Privacy Section */}
      <section
        className="rounded-2xl p-4 sm:p-6 glass-panel transition"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <i className="pi pi-lock text-lg opacity-80" />
            <h2 className="text-lg font-semibold">{t("Privacy")}</h2>
          </div>
          {loading && (
            <span className="text-xs opacity-60 flex items-center gap-1.5">
              <i className="pi pi-spin pi-spinner text-xs" />
              Loading...
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm opacity-70 mb-6">{t("PrivacyDesc")}</p>

        {!isAuthenticated ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2.5">
            <i className="pi pi-info-circle text-base" />
            <span>{t("LoginPrompt")}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Privacy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 max-w-md">
                <div className="text-sm font-medium">{t("ProfilePrivacy")}</div>
                <div className="text-xs opacity-70">
                  {PRIVACY_OPTIONS.find((opt) => opt.value === profilePrivacy)?.description}
                </div>
              </div>
              <Dropdown
                value={profilePrivacy}
                onChange={(e) => setProfilePrivacy(e.value)}
                options={PRIVACY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Select privacy level"
                valueTemplate={selectedOptionTemplate}
                itemTemplate={optionTemplate}
                className="w-full sm:w-56"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              />
            </div>

            <Divider className="my-2" />

            {/* Follow Privacy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 max-w-md">
                <div className="text-sm font-medium">{t("FollowPrivacy")}</div>
                <div className="text-xs opacity-70">
                  {PRIVACY_OPTIONS.find((opt) => opt.value === followersPrivacy)?.description}
                </div>
              </div>
              <Dropdown
                value={followersPrivacy}
                onChange={(e) => setFollowersPrivacy(e.value)}
                options={PRIVACY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Select privacy level"
                valueTemplate={selectedOptionTemplate}
                itemTemplate={optionTemplate}
                className="w-full sm:w-56"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              />
            </div>

            {/* Bottom Save Button for Mobile / Long forms */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 dark:border-white/5">
              <div className="text-xs opacity-60 flex items-center gap-2">
                <span>{hasChanges ? t("UnsavedChanges") : t("AllChangesSaved")}</span>
                {version > 1 && (
                  <span className="opacity-40 text-[11px]">(v{version})</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow"
                style={{
                  backgroundColor: "var(--primary, #3b82f6)",
                  color: "white",
                }}
              >
                {saving ? (
                  <>
                    <i className="pi pi-spin pi-spinner text-xs" />
                    <span>{t("Saving")}</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-save text-sm" />
                    <span>{t("SaveChanges")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
