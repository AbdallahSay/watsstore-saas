'use client';

import { useBrowserStorage, useBrowserReady, writeBrowserStorage } from '@/hooks/useBrowserStorage';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  LanguageCode,
  LanguageInfo,
  Direction,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  TranslationDictionary,
} from '@/i18n/languages';
import arabic from '@/i18n/dictionaries/ar.json';

const additionalDictionaries = {
  en: () => import('@/i18n/dictionaries/en.json'),
  fr: () => import('@/i18n/dictionaries/fr.json'),
  de: () => import('@/i18n/dictionaries/de.json'),
  es: () => import('@/i18n/dictionaries/es.json'),
  tr: () => import('@/i18n/dictionaries/tr.json'),
  ru: () => import('@/i18n/dictionaries/ru.json'),
};

interface LanguageContextType {
  language: LanguageCode;
  languageInfo: LanguageInfo;
  dir: Direction;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
  isMounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'watsstore_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const savedLanguage = useBrowserStorage(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
  const language = savedLanguage && LANGUAGES[savedLanguage] ? savedLanguage : DEFAULT_LANGUAGE;
  const isMounted = useBrowserReady();
  const [dictionaries, setDictionaries] = useState<Partial<Record<LanguageCode, TranslationDictionary>>>({ar:arabic});
  useEffect(() => {
    if (language === 'ar' || dictionaries[language]) return;
    let active = true;
    additionalDictionaries[language]().then(module => {
      if (active) setDictionaries(previous => ({...previous,[language]:module.default}));
    }).catch(() => { /* Arabic fallbacks remain usable if the optional language chunk fails. */ });
    return () => { active = false; };
  }, [language, dictionaries]);

  const applyLanguageToHtml = useCallback((langCode: LanguageCode) => {
    if (typeof document !== 'undefined') {
      const info = LANGUAGES[langCode] || LANGUAGES[DEFAULT_LANGUAGE];
      document.documentElement.lang = info.code;
      document.documentElement.dir = info.dir;
    }
  }, []);

  useEffect(() => { applyLanguageToHtml(language); }, [language, applyLanguageToHtml]);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (!LANGUAGES[code]) return;
    writeBrowserStorage(LANGUAGE_STORAGE_KEY, code);
    applyLanguageToHtml(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {}
  }, [applyLanguageToHtml]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string): string => {
      const dict: TranslationDictionary = dictionaries[language] || arabic;
      let value = dict[key] || arabic[key as keyof typeof arabic] || fallback || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return value;
    },
    [language, dictionaries]
  );

  const languageInfo = LANGUAGES[language] || LANGUAGES[DEFAULT_LANGUAGE];
  const dir = languageInfo.dir;

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageInfo,
        dir,
        setLanguage,
        t,
        isMounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
