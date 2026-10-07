"use client";

import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { THEMES, ThemeKey, DEFAULT_THEME_KEY, resolveThemeKey } from "./themes";
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
  const { theme, setTheme } = useTheme();
  const prevClass = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isInitialLoad = useRef(true);

  // Defer theme loading until client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    // Resolve legacy or unknown key
    const resolvedKey = resolveThemeKey(theme);
    if (theme && theme !== resolvedKey) {
      // Migrate stored legacy key in next-themes
      setTheme(resolvedKey);
      return;
    }

    const info = THEMES[resolvedKey] || THEMES[DEFAULT_THEME_KEY];
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
      // Trigger smooth transition only after initial render
      if (!isInitialLoad.current) {
        html.classList.add("theme-transitioning");
        setTimeout(() => {
          html.classList.remove("theme-transitioning");
        }, 280);
      } else {
        isInitialLoad.current = false;
      }

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

      const p = info.palette;

      // Core app-wide CSS tokens
      html.style.setProperty("--bg", p.background);
      html.style.setProperty("--bg-secondary", p.surface);
      html.style.setProperty("--bg-hover", p.surfaceHover);
      html.style.setProperty("--text", p.text);
      html.style.setProperty("--text-secondary", p.textSecondary);
      html.style.setProperty("--primary", p.primary);
      html.style.setProperty("--primary-hover", p.primaryHover);
      html.style.setProperty("--primary-subtle", p.primarySubtle);
      html.style.setProperty("--accent", p.accent);
      html.style.setProperty("--border", p.border);
      html.style.setProperty("--border-subtle", p.borderSubtle);
      html.style.setProperty("--theme-glow", p.glow);

      // Auth Screen tokens
      html.style.setProperty("--auth-primary", p.primary);
      html.style.setProperty("--auth-accent", p.accent);
      html.style.setProperty("--auth-glow", p.glow);
      html.style.setProperty("--auth-background", p.background);

      // PrimeReact dynamic variables overrides
      html.style.setProperty("--primary-color", p.primary);
      html.style.setProperty("--primary-color-text", "#ffffff");
      html.style.setProperty("--surface-ground", p.background);
      html.style.setProperty("--surface-card", p.surface);
      html.style.setProperty("--surface-overlay", p.surface);
      html.style.setProperty("--surface-border", p.border);
      html.style.setProperty("--text-color", p.text);
      html.style.setProperty("--text-color-secondary", p.textSecondary);
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
  }, [theme, mounted, setTheme]);

  return <>{children}</>;
}
