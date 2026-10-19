'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Check, ChevronDown, Globe } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES, LanguageCode } from '@/i18n/languages';

interface ThemeLanguageBarProps {
  variant?: 'navbar' | 'dashboard' | 'compact' | 'store' | 'admin';
  showLabels?: boolean;
  className?: string;
}

export default function ThemeLanguageBar({
  variant = 'navbar',
  showLabels = false,
  className = '',
}: ThemeLanguageBarProps) {
  const { theme, toggleTheme, isMounted: themeMounted } = useTheme();
  const { language, setLanguage, isMounted: langMounted, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangOpen(false);
      }
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangOpen]);

  const activeLang = LANGUAGES[language] || LANGUAGES['ar'];
  const isDark = themeMounted ? theme === 'dark' : false;

  const isDarkBg = variant === 'dashboard' || variant === 'admin';

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 select-none ${className}`}
      data-testid="theme-language-bar"
    >
      {/* --- THEME TOGGLE BUTTON --- */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? t('theme.light', undefined, 'الوضع الفاتح') : t('theme.dark', undefined, 'الوضع الداكن')}
        title={isDark ? t('theme.light', undefined, 'الوضع الفاتح') : t('theme.dark', undefined, 'الوضع الداكن')}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-sm'
            : isDarkBg
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            : 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 border-slate-200 dark:border-slate-700 shadow-sm'
        } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
        data-testid="theme-toggle-btn"
      >
        <span className="sr-only">{t('theme.toggle')}</span>
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-slate-600 dark:text-slate-300" />
          )}
        </div>
        {showLabels && (
          <span className="ml-1.5 text-xs font-bold hidden sm:inline">
            {isDark ? t('theme.light') : t('theme.dark')}
          </span>
        )}
      </button>

      {/* --- 7-LANGUAGE SELECTOR DROPDOWN --- */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsLangOpen(!isLangOpen)}
          aria-expanded={isLangOpen}
          aria-haspopup="listbox"
          aria-label={t('lang.select')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
            isDarkBg
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
          data-testid="language-dropdown-btn"
        >
          <span className="text-base leading-none" role="img" aria-label={activeLang.name}>
            {activeLang.flag}
          </span>
          <span className="hidden sm:inline font-bold">
            {activeLang.name}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isLangOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isLangOpen && (
          <div
            role="listbox"
            aria-label={t('lang.select')}
            className="absolute top-full mt-1.5 right-0 z-50 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 p-1.5 animate-fadeIn backdrop-blur-md"
            data-testid="language-menu"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
              <span>{t('lang.select')}</span>
              <Globe className="w-3 h-3 text-emerald-500" />
            </div>

            <div className="space-y-0.5">
              {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
                const item = LANGUAGES[code];
                const isActive = language === code;
                return (
                  <button
                    key={code}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => {
                      setLanguage(code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    data-testid={`lang-option-${code}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none" role="img" aria-label={item.name}>
                        {item.flag}
                      </span>
                      <span>{item.nativeName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {item.code}
                      </span>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
