"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { useTranslations } from "next-intl";
import { CURATED_THEMES, ThemeInfo, ThemeKey } from "@/theme/themes";

interface ThemeDialogProps {
  visible: boolean;
  activeKey?: string;
  onSelect: (key: ThemeKey) => void;
  onClose: () => void;
}

type FilterMode = "all" | "light" | "dark";

export default function ThemeDialog({
  visible,
  activeKey,
  onSelect,
  onClose,
}: ThemeDialogProps) {
  const t = useTranslations("Common");
  const [filter, setFilter] = useState<FilterMode>("all");

  const themes = Object.values(CURATED_THEMES).filter((thm) => {
    if (filter === "all") return true;
    return thm.mode === filter;
  });

  return (
    <Dialog
      header={
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <i className="pi pi-palette text-sm" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{t("ChooseTheme")}</h3>
            <p className="text-xs opacity-60">Pick your personalized visual atmosphere</p>
          </div>
        </div>
      }
      visible={visible}
      onHide={onClose}
      modal
      className="w-[640px] max-w-[95vw] rounded-2xl overflow-hidden shadow-2xl"
      contentClassName="p-4 sm:p-5"
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            filter === "all"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-semibold"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          All (6)
        </button>
        <button
          type="button"
          onClick={() => setFilter("light")}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            filter === "light"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-semibold"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <i className="pi pi-sun text-[11px] text-amber-500" />
          <span>Light (3)</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("dark")}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            filter === "dark"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-semibold"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <i className="pi pi-moon text-[11px] text-indigo-400" />
          <span>Dark (3)</span>
        </button>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[62vh] overflow-y-auto pr-1">
        {themes.map((item: ThemeInfo) => {
          const isSelected = activeKey === item.key;
          const { palette } = item;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onSelect(item.key as ThemeKey);
                onClose();
              }}
              className={`relative group rounded-xl p-3.5 text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-primary border-primary shadow-lg"
                  : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 hover:shadow-md hover:-translate-y-0.5"
              }`}
              style={{
                backgroundColor: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
              }}
            >
              {/* Mini Preview Mockup Box */}
              <div
                className="w-full h-24 rounded-lg p-2.5 mb-3 flex flex-col justify-between border overflow-hidden relative"
                style={{
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                }}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div
                      className="w-12 h-1.5 rounded-full"
                      style={{ backgroundColor: palette.text, opacity: 0.8 }}
                    />
                  </div>
                  <div
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: palette.primarySubtle,
                      color: palette.primary,
                    }}
                  >
                    {item.mode === "light" ? "Light" : "Dark"}
                  </div>
                </div>

                {/* Card Surface inside Mockup */}
                <div
                  className="rounded-md p-2 border flex items-center justify-between shadow-sm"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  }}
                >
                  <div className="space-y-1">
                    <div
                      className="w-16 h-1.5 rounded-full"
                      style={{ backgroundColor: palette.text, opacity: 0.85 }}
                    />
                    <div
                      className="w-10 h-1 rounded-full"
                      style={{ backgroundColor: palette.textSecondary, opacity: 0.6 }}
                    />
                  </div>
                  <div
                    className="w-12 h-4 rounded-md flex items-center justify-center text-[9px] font-semibold text-white shadow-xs"
                    style={{ backgroundColor: palette.primary }}
                  >
                    Button
                  </div>
                </div>

                {/* Ambient glow splash */}
                <div
                  className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl pointer-events-none opacity-60"
                  style={{ backgroundColor: palette.glow }}
                />
              </div>

              {/* Title, Tagline & Details */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm leading-tight" style={{ color: "var(--text)" }}>
                      {item.name}
                    </span>
                    {isSelected && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-xs"
                        style={{ backgroundColor: palette.primary }}
                      >
                        <i className="pi pi-check text-[9px]" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-65 line-clamp-1 mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {item.tagline}
                  </p>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                    title={`Background: ${palette.background}`}
                    style={{ backgroundColor: palette.background }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                    title={`Primary: ${palette.primary}`}
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                    title={`Accent: ${palette.accent}`}
                    style={{ backgroundColor: palette.accent }}
                  />
                </div>
                <span className="text-[11px] font-mono opacity-50 uppercase">
                  {palette.primary}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
