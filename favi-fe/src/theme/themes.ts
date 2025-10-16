export const THEMES = {
  light: {
    name: "Light",
    primereact: "lara-light-blue",
    className: "light", 
  },
  darkNight: {
    name: "Dark Night",
    primereact: "lara-dark-blue",
    className: "dark-night",
  },
  blueHorizon: {
    name: "Blue Horizon",
    primereact: "lara-light-indigo",
    className: "blue-horizon",
  },
  sakura: {
    name: "Sakura",
    primereact: "lara-light-purple",
    className: "sakura",
  },
  claude: {
    name: "Claude",
    primereact: "lara-light-teal",
    className: "claude",
  },
  aurora: {
    name: "Aurora",
    primereact: "md-dark-indigo",
    className: "aurora",
  },
  minty: {
    name: "Minty",
    primereact: "saga-green",
    className: "minty",
  },
  oceanic: {
    name: "Oceanic",
    primereact: "vela-blue",
    className: "oceanic",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;