"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <section className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-medium mb-3">Appearance</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs opacity-70">Choose your preferred look and feel</div>
          </div>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-medium mb-3">Language</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">App language</div>
            <div className="text-xs opacity-70">Switch between English and Vietnamese</div>
          </div>
          <LanguageSwitcher />
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-medium mb-3">Privacy</h2>
        <div className="text-sm opacity-70">Mock options – wire up later</div>
      </section>
    </div>
  );
}

