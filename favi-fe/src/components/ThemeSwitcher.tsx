"use client";

import { useTheme } from "next-themes";
import { Button } from "primereact/button";
import { useMemo, useState } from "react";
import { THEMES, ThemeKey } from "@/theme/themes";
import SelectionDialog from "@/components/SelectionDialog";
import { useTranslations } from "next-intl";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const t = useTranslations("Common");

  const options = useMemo(
    () =>
      Object.entries(THEMES)
        .map(([key, val]) => ({
          label: val.name,
          value: key,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  return (
    <>
      <Button
        type="button"
        icon="pi pi-palette"
        rounded
        text
        className="!text-xl"
        aria-label={t("ChangeTheme")}
        onClick={() => setOpen(true)}
      />
      <SelectionDialog
        visible={open}
        title={t("ChooseTheme")}
        options={options}
        value={theme ?? undefined}
        onSelect={(val) => setTheme(val as ThemeKey)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
