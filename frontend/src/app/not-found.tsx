import Link from 'next/link';
import { Home, LayoutDashboard, Compass, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Background ambient light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full text-center space-y-8 bg-white dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Icon & 404 Badge */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
            <SearchX className="w-10 h-10 animate-bounce" />
          </div>
          <span className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
            404
          </span>
        </div>

        {/* Headlines */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            عذراً، الصفحة غير موجودة
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            يبدو أن الرابط الذي تحاول الوصول إليه غير متاح، أو ربما تم نقله أو حذفه مؤخراً.
          </p>
        </div>

        {/* 3 Quick Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/60 dark:border-slate-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة التحكم</span>
          </Link>

          <Link
            href="/directory"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/60 dark:border-slate-700"
          >
            <Compass className="w-4 h-4" />
            <span>دليل المتاجر</span>
          </Link>
        </div>

        {/* Footer brand signature */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
          WatsStore — منصة التجارة الذكية المتكاملة عبر واتساب
        </div>
      </div>
    </div>
  );
}
