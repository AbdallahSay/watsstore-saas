'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDialog } from '@/hooks/useDialog';
import { Store as StoreIcon, ArrowLeft, ArrowRight, ShoppingBag, Menu, X, LogIn, Sparkles } from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { t, dir } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const drawerRef = useDialog(isMobileOpen, () => setIsMobileOpen(false), '(min-width: 1280px)');

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link prefetch={false} href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
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

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link prefetch={false} href="/#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            {t('nav.features', undefined, 'المميزات')}
          </Link>
          <Link prefetch={false} href="/#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            {t('nav.pricing', undefined, 'الأسعار والباقات')}
          </Link>
          <Link prefetch={false} href="/directory" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('nav.directory', undefined, 'دليل المتاجر المحلية')}
          </Link>
          <Link prefetch={false}
            href="/s/al-amal-fashion"
            target="_blank"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60"
          >
            {t('nav.demo', undefined, 'معاينة متجر تجريبي ⚡')}
          </Link>
        </nav>

        {/* Right Actions: ThemeLanguageBar + Auth + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Theme & Language Bar */}
          <div className="hidden md:block"><ThemeLanguageBar variant="navbar" showCurrency={false} /></div>

          <Link prefetch={false}
            href="/login"
            className="hidden lg:inline-flex px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-h-[44px] items-center"
          >
            {t('nav.login', undefined, 'دخول التاجر')}
          </Link>

          <Link prefetch={false}
            href="/register"
            className="hidden sm:flex px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 sm:gap-2 transition-all hover:gap-2.5 shrink-0 min-h-[44px]"
          >
            <span>{t('nav.register', undefined, 'أنشئ متجرك مجاناً')}</span>
            <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="xl:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors"
            aria-label={dir === 'rtl' ? "فتح القائمة" : "Open menu"} aria-expanded={isMobileOpen} aria-controls="site-navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

    </header>
      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm xl:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            ref={drawerRef} id="site-navigation" role="dialog" aria-modal="true" aria-label={dir === 'rtl' ? "القائمة الرئيسية" : "Main navigation"} tabIndex={-1}
            className="fixed inset-y-0 rtl:right-0 ltr:left-0 w-full max-w-xs ws-dialog bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto rtl:border-l ltr:border-r border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold">
                    <StoreIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                    WatsStore
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center min-w-[44px] min-h-[44px]"
                  aria-label={dir === 'rtl' ? "إغلاق القائمة" : "Close menu"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ThemeLanguageBar variant="navbar" className="flex-wrap" />
              {/* Navigation Links */}
              <nav className="space-y-2">
                <Link prefetch={false}
                  href="/#features"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-h-[44px]"
                >
                  {t('nav.features', undefined, 'المميزات')}
                </Link>
                <Link prefetch={false}
                  href="/#pricing"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-h-[44px]"
                >
                  {t('nav.pricing', undefined, 'الأسعار والباقات')}
                </Link>
                <Link prefetch={false}
                  href="/directory"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-h-[44px]"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('nav.directory', undefined, 'دليل المتاجر المحلية')}</span>
                </Link>
                <Link prefetch={false}
                  href="/s/al-amal-fashion"
                  target="_blank"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 transition-colors min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('nav.demo', undefined, 'معاينة متجر تجريبي ⚡')}</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 pb-safe">
              <Link prefetch={false}
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.login', undefined, 'تسجيل دخول التاجر')}</span>
              </Link>
              <Link prefetch={false}
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px]"
              >
                <span>{t('nav.register', undefined, 'أنشئ متجرك مجاناً')}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
