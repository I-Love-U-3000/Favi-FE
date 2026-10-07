"use client";

import { useTheme } from "next-themes";
import { Button } from "primereact/button";
import { useState } from "react";
import { ThemeKey, resolveThemeKey } from "@/theme/themes";
import ThemeDialog from "@/components/ThemeDialog";
import { useTranslations } from "next-intl";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const t = useTranslations("Common");

  const currentKey = resolveThemeKey(theme);

  return (
    <>
      <Button
        type="button"
        icon="pi pi-palette"
        rounded
        text
        className="!text-xl hover:scale-110 transition-transform"
        aria-label={t("ChangeTheme")}
        onClick={() => setOpen(true)}
      />
      <ThemeDialog
        visible={open}
        activeKey={currentKey}
        onSelect={(val) => setTheme(val)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
