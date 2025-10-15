"use client";

import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { THEMES, ThemeKey } from "./themes";
import "primereact/resources/themes/lara-light-blue/theme.css"; 
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="favi-theme"
    >
      <ThemeLoader>{children}</ThemeLoader>
    </NextThemeProvider>
  );
}

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!theme) return;

    const themeInfo = THEMES[theme as ThemeKey];
    if (!themeInfo) return;

    import(`primereact/resources/themes/${themeInfo.primereact}/theme.css`);
    document.documentElement.className = themeInfo.className;
  }, [theme]);

  return <>{children}</>;
}
