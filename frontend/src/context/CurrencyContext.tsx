'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'SAR' | 'AED' | 'GBP' | 'TRY';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  flag: string;
  name: string;
  nameAr: string;
  /** Static fallback rate vs EGP (1 EGP = x foreign) — updated periodically */
  fallbackRate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  EGP: { code: 'EGP', symbol: 'ج.م', flag: '🇪🇬', name: 'Egyptian Pound', nameAr: 'جنيه مصري', fallbackRate: 1 },
  USD: { code: 'USD', symbol: '$',   flag: '🇺🇸', name: 'US Dollar',       nameAr: 'دولار أمريكي', fallbackRate: 0.0204 },
  EUR: { code: 'EUR', symbol: '€',   flag: '🇪🇺', name: 'Euro',            nameAr: 'يورو',         fallbackRate: 0.0188 },
  SAR: { code: 'SAR', symbol: 'ر.س', flag: '🇸🇦', name: 'Saudi Riyal',     nameAr: 'ريال سعودي',   fallbackRate: 0.0765 },
  AED: { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', name: 'UAE Dirham',      nameAr: 'درهم إماراتي', fallbackRate: 0.0749 },
  GBP: { code: 'GBP', symbol: '£',   flag: '🇬🇧', name: 'British Pound',   nameAr: 'جنيه إسترليني', fallbackRate: 0.0161 },
  TRY: { code: 'TRY', symbol: '₺',   flag: '🇹🇷', name: 'Turkish Lira',    nameAr: 'ليرة تركية',   fallbackRate: 0.6612 },
};

const CURRENCY_STORAGE_KEY = 'watsstore_currency';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rate: number;
  currencyInfo: CurrencyInfo;
  convert: (egpAmount: number) => number;
  format: (egpAmount: number) => string;
  isMounted: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('EGP');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(() => {
    const r = {} as Record<CurrencyCode, number>;
    (Object.keys(CURRENCIES) as CurrencyCode[]).forEach((c) => {
      r[c] = CURRENCIES[c].fallbackRate;
    });
    return r;
  });
  const [isMounted, setIsMounted] = useState(false);

  // Restore persisted currency on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch {}
  }, []);

  // Fetch live rates from exchangerate-api (free, no key needed for basic endpoint)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/EGP', { next: { revalidate: 3600 } } as RequestInit);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.rates) {
          const newRates = { ...rates };
          (Object.keys(CURRENCIES) as CurrencyCode[]).forEach((c) => {
            if (c !== 'EGP' && data.rates[c]) {
              newRates[c] = data.rates[c];
            }
          });
          newRates['EGP'] = 1;
          setRates(newRates);
        }
      } catch {
        // Keep fallback rates — no UI error shown
      }
    };
    fetchRates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try { localStorage.setItem(CURRENCY_STORAGE_KEY, c); } catch {}
  }, []);

  const rate = rates[currency] ?? CURRENCIES[currency].fallbackRate;
  const currencyInfo = CURRENCIES[currency];

  const convert = useCallback((egpAmount: number): number => {
    if (currency === 'EGP') return egpAmount;
    return Math.round(egpAmount * rate * 100) / 100;
  }, [currency, rate]);

  const format = useCallback((egpAmount: number): string => {
    const converted = convert(egpAmount);
    const sym = currencyInfo.symbol;
    // For EGP, keep Arabic convention (number then symbol)
    if (currency === 'EGP') return `${converted.toLocaleString('ar-EG')} ${sym}`;
    return `${sym}${converted.toFixed(2)}`;
  }, [convert, currency, currencyInfo]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, currencyInfo, convert, format, isMounted }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
