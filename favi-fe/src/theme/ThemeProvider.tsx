"use client";

import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { THEMES, ThemeKey, DEFAULT_THEME_KEY } from "./themes";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme={DEFAULT_THEME_KEY}
      enableSystem={false}
      storageKey="favi-theme"
    >
      <ThemeLoader>{children}</ThemeLoader>
    </NextThemeProvider>
  );
}

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const prevClass = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Defer theme loading until client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const key = (theme as ThemeKey) || DEFAULT_THEME_KEY;
    const info = THEMES[key] || THEMES[DEFAULT_THEME_KEY];
    const linkId = "prime-theme-link";
    const href = `/themes/${info.file}`;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.id = linkId;
      document.head.appendChild(link);
    }

    const html = document.documentElement;
    const applyTheme = () => {
      if (prevClass.current) {
        html.classList.remove(prevClass.current);
      }
      html.classList.add(info.className);
      prevClass.current = info.className;
      html.dataset.themeMode = info.mode;

      if (info.mode === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }

      try {
        const computed = getComputedStyle(html);
        const read = (token: string, fallback: string) => {
          const value = computed.getPropertyValue(token);
          return value?.trim() || fallback;
        };
        html.style.setProperty("--auth-primary", read("--primary-color", info.palette.primary));
        html.style.setProperty("--auth-accent", read("--primary-300", info.palette.accent));
        html.style.setProperty("--auth-glow", read("--surface-200", info.palette.glow));
        html.style.setProperty("--auth-background", read("--surface-b", info.palette.background));
      } catch {
        html.style.setProperty("--auth-primary", info.palette.primary);
        html.style.setProperty("--auth-accent", info.palette.accent);
        html.style.setProperty("--auth-glow", info.palette.glow);
        html.style.setProperty("--auth-background", info.palette.background);
      }
    };

    if (link.getAttribute("href") !== href) {
      link.onload = () => {
        applyTheme();
        if (link) link.onload = null;
      };
      link.setAttribute("href", href);
    } else {
      applyTheme();
    }

    return () => {
      if (link) link.onload = null;
    };
  }, [theme, mounted]);

  return <>{children}</>;
}
