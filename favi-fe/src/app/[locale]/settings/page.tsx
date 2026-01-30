"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";

type PrivacyLevel = "Public" | "Followers" | "Followees" | "Private";

interface PrivacyOption {
  label: string;
  value: PrivacyLevel;
  description: string;
}

export default function SettingsPage() {
  const t = useTranslations("SettingsPage");
  const [profilePrivacy, setProfilePrivacy] = useState<PrivacyLevel>("Public");
  const [followersPrivacy, setFollowersPrivacy] = useState<PrivacyLevel>("Public");
  const [followeesPrivacy, setFolloweesPrivacy] = useState<PrivacyLevel>("Public");

  const PRIVACY_OPTIONS: PrivacyOption[] = useMemo(() => [
    {
      label: t("Public"),
      value: "Public",
      description: t("PublicDescription"),
    },
    {
      label: t("Followers"),
      value: "Followers",
      description: t("FollowersDescription"),
    },
    {
      label: t("Followees"),
      value: "Followees",
      description: t("FolloweesDescription"),
    },
    {
      label: t("Private"),
      value: "Private",
      description: t("PrivateDescription"),
    },
  ], [t]);

  const selectedOptionTemplate = (option: PrivacyOption, props: any) => {
    if (option) {
      return (
        <div className="flex flex-col">
          <span>{option.label}</span>
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  const optionTemplate = (option: PrivacyOption) => {
    return (
      <div className="flex flex-col">
        <span className="font-medium">{option.label}</span>
        <span className="text-xs opacity-70">{option.description}</span>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ color: "var(--text)" }}>
      <h1 className="text-2xl font-semibold mb-6">{t("Title")}</h1>

      <section
        className="rounded-2xl p-4 mb-6"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-medium mb-3">{t("Appearance")}</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("Theme")}</div>
            <div className="text-xs opacity-70">{t("ThemeDescription")}</div>
          </div>
          <ThemeSwitcher />
        </div>
      </section>

      <section
        className="rounded-2xl p-4 mb-6"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-medium mb-3">{t("Language")}</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("AppLanguage")}</div>
            <div className="text-xs opacity-70">{t("LanguageDescription")}</div>
          </div>
          <LanguageSwitcher />
        </div>
      </section>

      <section
        className="rounded-2xl p-4"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-medium mb-4">{t("Privacy")}</h2>
        <div className="text-sm opacity-70 mb-6">
          {t("PrivacyDescription")}
        </div>

        {/* Profile Privacy */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
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
              placeholder={t("SelectPrivacy")}
              valueTemplate={selectedOptionTemplate}
              itemTemplate={optionTemplate}
              className="w-48"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <Divider />

        {/* Followers Privacy */}
        <div className="space-y-2 mb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("FollowersPrivacy")}</div>
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
              placeholder={t("SelectPrivacy")}
              valueTemplate={selectedOptionTemplate}
              itemTemplate={optionTemplate}
              className="w-48"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <Divider />

        {/* Followees Privacy */}
        <div className="space-y-2 mt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("FolloweesPrivacy")}</div>
              <div className="text-xs opacity-70">
                {PRIVACY_OPTIONS.find((opt) => opt.value === followeesPrivacy)?.description}
              </div>
            </div>
            <Dropdown
              value={followeesPrivacy}
              onChange={(e) => setFolloweesPrivacy(e.value)}
              options={PRIVACY_OPTIONS}
              optionLabel="label"
              optionValue="value"
              placeholder={t("SelectPrivacy")}
              valueTemplate={selectedOptionTemplate}
              itemTemplate={optionTemplate}
              className="w-48"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
