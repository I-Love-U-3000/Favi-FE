"use client";

import { useTheme } from "next-themes";
import { Dropdown } from "primereact/dropdown";
import { THEMES, ThemeKey } from "@/theme/themes";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = Object.entries(THEMES).map(([key, val]) => ({
    label: val.name,
    value: key,
  }));

  return (
    <div className="flex items-center gap-2">
      <i className="pi pi-palette text-xl" />
      <Dropdown
        value={theme}
        options={options}
        onChange={(e) => setTheme(e.value as ThemeKey)}
        placeholder="Select Theme"
        className="w-40"
      />
    </div>
  );
}
