'use client';

import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { CurrencyProvider } from './CurrencyContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
