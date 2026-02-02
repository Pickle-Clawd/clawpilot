export type ThemeId = "midnight" | "reef";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  previewColors: [string, string, string];
  hasAmbient?: boolean;
}

export const themes: ThemeConfig[] = [
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark grays with warm accents",
    previewColors: ["#09090b", "#f97316", "#ec4899"],
  },
  {
    id: "reef",
    name: "Reef",
    description: "Deep ocean with coral highlights",
    previewColors: ["#0A1628", "#FF6B4A", "#0F2847"],
    hasAmbient: true,
  },
];

export const DEFAULT_THEME: ThemeId = "midnight";
export const THEME_STORAGE_KEY = "the-helm-theme";
