export type ThemePalette = {
  primary: string;
  primaryHover: string;
  primarySubtle: string;
  accent: string;
  glow: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  borderSubtle: string;
};

export type ThemeInfo = {
  key: string;
  name: string;
  tagline: string;
  file: string;
  mode: "light" | "dark";
  className: string;
  palette: ThemePalette;
};

export const DEFAULT_THEME_KEY = "horizon-light" as const;

export const CURATED_THEMES: Record<string, ThemeInfo> = {
  "horizon-light": {
    key: "horizon-light",
    name: "Horizon Blue",
    tagline: "Clean, crisp slate with royal blue accents",
    file: "lara-light-blue/theme.css",
    mode: "light",
    className: "theme-horizon-light",
    palette: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      primarySubtle: "rgba(37, 99, 235, 0.12)",
      accent: "#0ea5e9",
      glow: "rgba(37, 99, 235, 0.22)",
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceHover: "#f1f5f9",
      text: "#0f172a",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      borderSubtle: "#f1f5f9",
    },
  },
  "sunset-light": {
    key: "sunset-light",
    name: "Warm Sunset",
    tagline: "Cozy cream linen with amber & terracotta glow",
    file: "lara-light-amber/theme.css",
    mode: "light",
    className: "theme-sunset-light",
    palette: {
      primary: "#ea580c",
      primaryHover: "#c2410c",
      primarySubtle: "rgba(234, 88, 12, 0.12)",
      accent: "#f59e0b",
      glow: "rgba(234, 88, 12, 0.22)",
      background: "#fdfbf7",
      surface: "#ffffff",
      surfaceHover: "#faf5ee",
      text: "#1c1917",
      textSecondary: "#78716c",
      border: "#f0e7db",
      borderSubtle: "#fbf8f3",
    },
  },
  "emerald-light": {
    key: "emerald-light",
    name: "Fresh Mint",
    tagline: "Refreshing botanical mint with deep emerald tones",
    file: "lara-light-teal/theme.css",
    mode: "light",
    className: "theme-emerald-light",
    palette: {
      primary: "#059669",
      primaryHover: "#047857",
      primarySubtle: "rgba(5, 150, 105, 0.12)",
      accent: "#10b981",
      glow: "rgba(5, 150, 105, 0.22)",
      background: "#f2fbf6",
      surface: "#ffffff",
      surfaceHover: "#e6f7ee",
      text: "#064e3b",
      textSecondary: "#376d5b",
      border: "#d1fae5",
      borderSubtle: "#e9f9f0",
    },
  },
  "midnight-dark": {
    key: "midnight-dark",
    name: "Midnight Indigo",
    tagline: "Deep navy night with glowing indigo & periwinkle",
    file: "lara-dark-indigo/theme.css",
    mode: "dark",
    className: "theme-midnight-dark",
    palette: {
      primary: "#6366f1",
      primaryHover: "#4f46e5",
      primarySubtle: "rgba(99, 102, 241, 0.18)",
      accent: "#818cf8",
      glow: "rgba(99, 102, 241, 0.32)",
      background: "#0b0f19",
      surface: "#111827",
      surfaceHover: "#1f293d",
      text: "#f9fafb",
      textSecondary: "#94a3b8",
      border: "#1e293b",
      borderSubtle: "#161f33",
    },
  },
  "cyberpunk-dark": {
    key: "cyberpunk-dark",
    name: "Cyber Neon",
    tagline: "Obsidian void with electric purple & hot magenta aura",
    file: "lara-dark-purple/theme.css",
    mode: "dark",
    className: "theme-cyberpunk-dark",
    palette: {
      primary: "#a855f7",
      primaryHover: "#9333ea",
      primarySubtle: "rgba(168, 85, 247, 0.2)",
      accent: "#ec4899",
      glow: "rgba(168, 85, 247, 0.38)",
      background: "#090514",
      surface: "#130924",
      surfaceHover: "#1f103a",
      text: "#fdf4ff",
      textSecondary: "#c084fc",
      border: "#2e1065",
      borderSubtle: "#200947",
    },
  },
  "oled-noir": {
    key: "oled-noir",
    name: "OLED Noir",
    tagline: "True pitch black with high-contrast electric ice",
    file: "lara-dark-blue/theme.css",
    mode: "dark",
    className: "theme-oled-noir",
    palette: {
      primary: "#38bdf8",
      primaryHover: "#0284c7",
      primarySubtle: "rgba(56, 189, 248, 0.16)",
      accent: "#f43f5e",
      glow: "rgba(56, 189, 248, 0.35)",
      background: "#000000",
      surface: "#0a0a0a",
      surfaceHover: "#171717",
      text: "#ffffff",
      textSecondary: "#a3a3a3",
      border: "#262626",
      borderSubtle: "#171717",
    },
  },
};

export type ThemeKey = keyof typeof CURATED_THEMES;

/** Backward-compatible alias for existing imports */
export const THEMES = CURATED_THEMES;

/** Migration map for legacy stored theme keys */
const LEGACY_MIGRATION_MAP: Record<string, ThemeKey> = {
  // Light themes -> closest curated light theme
  laraLightBlue: "horizon-light",
  sagaBlue: "horizon-light",
  tailwindLight: "horizon-light",
  fluentLight: "horizon-light",
  bootstrap4LightBlue: "horizon-light",
  nova: "horizon-light",
  novaAccent: "horizon-light",
  novaAlt: "horizon-light",
  rhea: "horizon-light",
  mdLightIndigo: "horizon-light",
  mdcLightIndigo: "horizon-light",

  laraLightAmber: "sunset-light",
  sagaOrange: "sunset-light",
  sohoLight: "sunset-light",
  bootstrap4LightPurple: "sunset-light",
  mdLightDeeppurple: "sunset-light",
  mdcLightDeeppurple: "sunset-light",
  vivaLight: "sunset-light",

  laraLightGreen: "emerald-light",
  laraLightTeal: "emerald-light",
  laraLightCyan: "emerald-light",
  sagaGreen: "emerald-light",

  // Dark themes -> closest curated dark theme
  laraDarkBlue: "midnight-dark",
  laraDarkIndigo: "midnight-dark",
  laraDarkCyan: "midnight-dark",
  mdDarkIndigo: "midnight-dark",
  mdcDarkIndigo: "midnight-dark",
  aryaBlue: "midnight-dark",
  bootstrap4DarkBlue: "midnight-dark",
  velaBlue: "midnight-dark",

  laraDarkPurple: "cyberpunk-dark",
  laraDarkPink: "cyberpunk-dark",
  laraDarkAmber: "cyberpunk-dark",
  sagaPurple: "cyberpunk-dark",
  aryaPurple: "cyberpunk-dark",
  aryaOrange: "cyberpunk-dark",
  bootstrap4DarkPurple: "cyberpunk-dark",
  mdDarkDeeppurple: "cyberpunk-dark",
  mdcDarkDeeppurple: "cyberpunk-dark",
  velaPurple: "cyberpunk-dark",
  velaOrange: "cyberpunk-dark",
  mira: "cyberpunk-dark",
  vivaDark: "cyberpunk-dark",

  lunaAmber: "oled-noir",
  lunaBlue: "oled-noir",
  lunaGreen: "oled-noir",
  lunaPink: "oled-noir",
  nano: "oled-noir",
  sohoDark: "oled-noir",
  velaGreen: "oled-noir",
  aryaGreen: "oled-noir",
  laraDarkGreen: "oled-noir",
  laraDarkTeal: "oled-noir",
};

export function resolveThemeKey(rawKey: string | null | undefined): ThemeKey {
  if (!rawKey) return DEFAULT_THEME_KEY;
  if (rawKey in CURATED_THEMES) return rawKey as ThemeKey;
  if (rawKey in LEGACY_MIGRATION_MAP) return LEGACY_MIGRATION_MAP[rawKey];
  return DEFAULT_THEME_KEY;
}
