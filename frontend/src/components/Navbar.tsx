'use client';

import Link from 'next/link';
import { Store as StoreIcon, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              {t('app.name', undefined, 'WatsStore')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-bold">
              {t('app.by', undefined, 'بواسطة Masar Tech')}
            </span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            {t('nav.features', undefined, 'المميزات')}
          </Link>
          <Link href="/#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            {t('nav.pricing', undefined, 'الأسعار والباقات')}
          </Link>
          <Link href="/directory" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('nav.directory', undefined, 'دليل المتاجر المحلية')}
          </Link>
          <Link 
            href="/s/al-amal-fashion" 
            target="_blank"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60"
          >
            {t('nav.demo', undefined, 'معاينة متجر تجريبي ⚡')}
          </Link>
        </nav>

        {/* Right Actions: ThemeLanguageBar + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Theme & Language Bar */}
          <ThemeLanguageBar variant="navbar" />

          <Link
            href="/login"
            className="hidden sm:inline-flex px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {t('nav.login', undefined, 'دخول التاجر')}
          </Link>

          <Link
            href="/register"
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 sm:gap-2 transition-all hover:gap-2.5 shrink-0"
          >
            <span>{t('nav.register', undefined, 'أنشئ متجرك مجاناً')}</span>
            <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
