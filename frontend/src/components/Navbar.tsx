'use client';

import Link from 'next/link';
import { Store as StoreIcon, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              WatsStore
            </span>
            <span className="text-xs text-slate-500 block -mt-1 font-medium">متاجر الواتساب الذكية</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="/#features" className="hover:text-emerald-600 transition-colors">المميزات</Link>
          <Link href="/#pricing" className="hover:text-emerald-600 transition-colors">الأسعار والباقات</Link>
          <Link href="/directory" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            دليل المتاجر المحلية
          </Link>
          <Link 
            href="/s/al-amal-fashion" 
            target="_blank"
            className="text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60"
          >
            معاينة متجر تجريبي ⚡
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
          >
            دخول التاجر
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:gap-3"
          >
            <span>أنشئ متجرك مجاناً</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
