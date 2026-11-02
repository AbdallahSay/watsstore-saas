export type LanguageCode = 'ar' | 'en' | 'fr' | 'de' | 'es' | 'tr' | 'ru';
export type Direction = 'rtl' | 'ltr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  flag: string;
  dir: Direction;
  nativeName: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  ar: { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇪🇬', dir: 'rtl' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  fr: { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  de: { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  es: { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  tr: { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  ru: { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'ar';

export type TranslationDictionary = Record<string, string>;
