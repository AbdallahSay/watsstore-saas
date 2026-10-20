'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';

interface CurrencySwitcherProps {
  variant?: 'navbar' | 'dashboard' | 'compact';
  className?: string;
}

export default function CurrencySwitcher({ variant = 'navbar', className = '' }: CurrencySwitcherProps) {
  const { currency, setCurrency, currencyInfo, isMounted } = useCurrency();
  const { language, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!isMounted) return null;

  const isAr = language === 'ar';
  const isDashboard = variant === 'dashboard';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={isAr ? 'تحويل العملة' : 'Currency Converter'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
          isDashboard
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            : 'bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm'
        } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
      >
        <span className="text-base leading-none">{currencyInfo.flag}</span>
        <span className="hidden sm:inline font-bold">{currencyInfo.symbol}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          dir={dir}
          role="listbox"
          className={`absolute top-full mt-1.5 z-[100] w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/80 p-1.5 animate-fadeIn ${
            dir === 'rtl' ? 'right-0 left-auto' : 'left-0 right-auto'
          }`}
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span>{isAr ? 'تحويل العملة' : 'Currency'}</span>
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          </div>

          <div className="space-y-0.5">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
              const info = CURRENCIES[code];
              const isActive = currency === code;
              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => { setCurrency(code); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{info.flag}</span>
                    <span>{isAr ? info.nameAr : info.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {info.symbol}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="mt-1.5 px-2.5 pt-1.5 pb-0.5 text-[9px] text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
            {isAr ? 'الأسعار تقريبية للاستدلال فقط' : 'Rates are approximate for reference only'}
          </p>
        </div>
      )}
    </div>
  );
}
