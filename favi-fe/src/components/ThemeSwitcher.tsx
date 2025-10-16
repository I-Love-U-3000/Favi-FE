"use client";

import { useTheme } from "next-themes";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useState, useMemo } from "react";
import { THEMES, ThemeKey } from "@/theme/themes";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      Object.entries(THEMES).map(([key, val]) => ({
        label: val.name,
        value: key,
      })),
    []
  );

  return (
    <div className="relative">
      <Button
        icon="pi pi-palette"
        rounded
        text
        className="!text-xl"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute right-0 mt-2 w-40">
          <Dropdown
            value={theme}
            options={options}
            onChange={(e) => {
              setTheme(e.value as ThemeKey);
              setOpen(false);
            }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}