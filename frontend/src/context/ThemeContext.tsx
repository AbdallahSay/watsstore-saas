'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useBrowserStorage, useBrowserReady, writeBrowserStorage } from '@/hooks/useBrowserStorage';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'watsstore_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const savedTheme = useBrowserStorage(THEME_STORAGE_KEY);
  const isMounted = useBrowserReady();
  const theme: Theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : isMounted && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const applyThemeClass = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  useEffect(() => { applyThemeClass(theme); }, [theme]);

  const setTheme = (newTheme: Theme) => {
    writeBrowserStorage(THEME_STORAGE_KEY, newTheme);
    applyThemeClass(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
