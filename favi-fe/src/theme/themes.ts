export const THEMES = {
  light: {
    name: "Light",
    primereact: "lara-light-blue",
    className: "theme-light",
  },
  dark: {
    name: "Dark",
    primereact: "lara-dark-teal",
    className: "theme-dark",
  },
  aurora: {
    name: "Aurora",
    primereact: "md-dark-indigo",
    className: "theme-aurora",
  },
  neon: {
    name: "Neon",
    primereact: "vela-orange",
    className: "theme-neon",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
