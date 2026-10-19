'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  LanguageCode,
  LanguageInfo,
  Direction,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  TRANSLATIONS,
} from '@/i18n/languages';

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
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isMounted, setIsMounted] = useState(false);

  const applyLanguageToHtml = useCallback((langCode: LanguageCode) => {
    if (typeof document !== 'undefined') {
      const info = LANGUAGES[langCode] || LANGUAGES[DEFAULT_LANGUAGE];
      document.documentElement.lang = info.code;
      document.documentElement.dir = info.dir;
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (savedLang && LANGUAGES[savedLang]) {
        setLanguageState(savedLang);
        applyLanguageToHtml(savedLang);
      } else {
        applyLanguageToHtml(DEFAULT_LANGUAGE);
      }
    } catch {
      applyLanguageToHtml(DEFAULT_LANGUAGE);
    }
  }, [applyLanguageToHtml]);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (!LANGUAGES[code]) return;
    setLanguageState(code);
    applyLanguageToHtml(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {}
  }, [applyLanguageToHtml]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
      let value = dict[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || fallback || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return value;
    },
    [language]
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
