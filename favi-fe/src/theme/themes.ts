export type ThemePalette = {
  primary: string;
  accent: string;
  glow: string;
  background: string;
};

export type ThemeInfo = {
  name: string;
  file: string;
  mode: "light" | "dark";
  className: string;
  palette: ThemePalette;
};

const LIGHT_FALLBACK: ThemePalette = {
  primary: "#3b82f6",
  accent: "#38bdf8",
  glow: "#bae6fd",
  background: "#f3f4f6",
};

const DARK_FALLBACK: ThemePalette = {
  primary: "#6366f1",
  accent: "#a5b4fc",
  glow: "#818cf8",
  background: "#111827",
};

export const DEFAULT_THEME_KEY = "laraLightBlue" as const;

const THEME_ENTRIES = [
  { key: "aryaBlue", name: "Arya Blue", file: "arya-blue/theme.css", mode: "dark" },
  { key: "aryaGreen", name: "Arya Green", file: "arya-green/theme.css", mode: "dark" },
  { key: "aryaOrange", name: "Arya Orange", file: "arya-orange/theme.css", mode: "dark" },
  { key: "aryaPurple", name: "Arya Purple", file: "arya-purple/theme.css", mode: "dark" },
  { key: "bootstrap4DarkBlue", name: "Bootstrap4 Dark Blue", file: "bootstrap4-dark-blue/theme.css", mode: "dark" },
  { key: "bootstrap4DarkPurple", name: "Bootstrap4 Dark Purple", file: "bootstrap4-dark-purple/theme.css", mode: "dark" },
  { key: "bootstrap4LightBlue", name: "Bootstrap4 Light Blue", file: "bootstrap4-light-blue/theme.css", mode: "light" },
  { key: "bootstrap4LightPurple", name: "Bootstrap4 Light Purple", file: "bootstrap4-light-purple/theme.css", mode: "light" },
  { key: "fluentLight", name: "Fluent Light", file: "fluent-light/theme.css", mode: "light" },
  { key: "laraDarkAmber", name: "Lara Dark Amber", file: "lara-dark-amber/theme.css", mode: "dark" },
  { key: "laraDarkBlue", name: "Lara Dark Blue", file: "lara-dark-blue/theme.css", mode: "dark" },
  { key: "laraDarkCyan", name: "Lara Dark Cyan", file: "lara-dark-cyan/theme.css", mode: "dark" },
  { key: "laraDarkGreen", name: "Lara Dark Green", file: "lara-dark-green/theme.css", mode: "dark" },
  { key: "laraDarkIndigo", name: "Lara Dark Indigo", file: "lara-dark-indigo/theme.css", mode: "dark" },
  { key: "laraDarkPink", name: "Lara Dark Pink", file: "lara-dark-pink/theme.css", mode: "dark" },
  { key: "laraDarkPurple", name: "Lara Dark Purple", file: "lara-dark-purple/theme.css", mode: "dark" },
  { key: "laraDarkTeal", name: "Lara Dark Teal", file: "lara-dark-teal/theme.css", mode: "dark" },
  { key: "laraLightAmber", name: "Lara Light Amber", file: "lara-light-amber/theme.css", mode: "light" },
  { key: "laraLightBlue", name: "Lara Light Blue", file: "lara-light-blue/theme.css", mode: "light" },
  { key: "laraLightCyan", name: "Lara Light Cyan", file: "lara-light-cyan/theme.css", mode: "light" },
  { key: "laraLightGreen", name: "Lara Light Green", file: "lara-light-green/theme.css", mode: "light" },
  { key: "laraLightIndigo", name: "Lara Light Indigo", file: "lara-light-indigo/theme.css", mode: "light" },
  { key: "laraLightPink", name: "Lara Light Pink", file: "lara-light-pink/theme.css", mode: "light" },
  { key: "laraLightPurple", name: "Lara Light Purple", file: "lara-light-purple/theme.css", mode: "light" },
  { key: "laraLightTeal", name: "Lara Light Teal", file: "lara-light-teal/theme.css", mode: "light" },
  { key: "lunaAmber", name: "Luna Amber", file: "luna-amber/theme.css", mode: "dark" },
  { key: "lunaBlue", name: "Luna Blue", file: "luna-blue/theme.css", mode: "dark" },
  { key: "lunaGreen", name: "Luna Green", file: "luna-green/theme.css", mode: "dark" },
  { key: "lunaPink", name: "Luna Pink", file: "luna-pink/theme.css", mode: "dark" },
  { key: "mdDarkDeeppurple", name: "Material Dark Deep Purple", file: "md-dark-deeppurple/theme.css", mode: "dark" },
  { key: "mdDarkIndigo", name: "Material Dark Indigo", file: "md-dark-indigo/theme.css", mode: "dark" },
  { key: "mdLightDeeppurple", name: "Material Light Deep Purple", file: "md-light-deeppurple/theme.css", mode: "light" },
  { key: "mdLightIndigo", name: "Material Light Indigo", file: "md-light-indigo/theme.css", mode: "light" },
  { key: "mdcDarkDeeppurple", name: "Material Compact Dark Deep Purple", file: "mdc-dark-deeppurple/theme.css", mode: "dark" },
  { key: "mdcDarkIndigo", name: "Material Compact Dark Indigo", file: "mdc-dark-indigo/theme.css", mode: "dark" },
  { key: "mdcLightDeeppurple", name: "Material Compact Light Deep Purple", file: "mdc-light-deeppurple/theme.css", mode: "light" },
  { key: "mdcLightIndigo", name: "Material Compact Light Indigo", file: "mdc-light-indigo/theme.css", mode: "light" },
  { key: "mira", name: "Mira", file: "mira/theme.css", mode: "dark" },
  { key: "nano", name: "Nano", file: "nano/theme.css", mode: "dark" },
  { key: "nova", name: "Nova", file: "nova/theme.css", mode: "light" },
  { key: "novaAccent", name: "Nova Accent", file: "nova-accent/theme.css", mode: "light" },
  { key: "novaAlt", name: "Nova Alt", file: "nova-alt/theme.css", mode: "light" },
  { key: "rhea", name: "Rhea", file: "rhea/theme.css", mode: "light" },
  { key: "sagaBlue", name: "Saga Blue", file: "saga-blue/theme.css", mode: "light" },
  { key: "sagaGreen", name: "Saga Green", file: "saga-green/theme.css", mode: "light" },
  { key: "sagaOrange", name: "Saga Orange", file: "saga-orange/theme.css", mode: "light" },
  { key: "sagaPurple", name: "Saga Purple", file: "saga-purple/theme.css", mode: "light" },
  { key: "sohoDark", name: "Soho Dark", file: "soho-dark/theme.css", mode: "dark" },
  { key: "sohoLight", name: "Soho Light", file: "soho-light/theme.css", mode: "light" },
  { key: "tailwindLight", name: "Tailwind Light", file: "tailwind-light/theme.css", mode: "light" },
  { key: "velaBlue", name: "Vela Blue", file: "vela-blue/theme.css", mode: "dark" },
  { key: "velaGreen", name: "Vela Green", file: "vela-green/theme.css", mode: "dark" },
  { key: "velaOrange", name: "Vela Orange", file: "vela-orange/theme.css", mode: "dark" },
  { key: "velaPurple", name: "Vela Purple", file: "vela-purple/theme.css", mode: "dark" },
  { key: "vivaDark", name: "Viva Dark", file: "viva-dark/theme.css", mode: "dark" },
  { key: "vivaLight", name: "Viva Light", file: "viva-light/theme.css", mode: "light" },
] as const;

export const THEMES = THEME_ENTRIES.reduce<Record<string, ThemeInfo>>((acc, entry) => {
  acc[entry.key] = {
    name: entry.name,
    file: entry.file,
    mode: entry.mode,
    className: `theme-${entry.key}`,
    palette: entry.mode === "dark" ? DARK_FALLBACK : LIGHT_FALLBACK,
  };
  return acc;
}, {});

export type ThemeKey = typeof THEME_ENTRIES[number]["key"];
