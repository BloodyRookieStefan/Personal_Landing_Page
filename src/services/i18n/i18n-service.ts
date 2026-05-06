import type { Language } from '../../domain/settings/model';
import { de } from './locales/de';
import { en } from './locales/en';

type Translations = Record<string, string>;

const locales: Record<Language, Translations> = { de, en };

let currentLanguage: Language = 'de';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const translations = locales[currentLanguage];
  let text = translations[key] ?? locales.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
