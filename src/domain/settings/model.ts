export type Theme = 'light' | 'dark';
export type Language = 'de' | 'en';

export interface Settings {
  theme: Theme;
  language: Language;
  compactMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'de',
  compactMode: false,
};
