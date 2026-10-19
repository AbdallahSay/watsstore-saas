'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200 selection:bg-rose-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full text-center space-y-7 bg-white dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Warning Badge */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 dark:from-rose-500/20 dark:to-amber-500/20 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-inner">
            <AlertTriangle className="w-10 h-10 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-300 dark:border-rose-800/60">
            خطأ في النظام
          </span>
        </div>

        {/* Headlines */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            حدث خطأ غير متوقع
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            نعتذر عن هذا الخلل. تم تسجيل تفاصيل الخطأ تلقائياً وجاري التعامل معه من فريقنا التقني.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 py-1.5 px-3 rounded-lg inline-block">
              رمز الخطأ: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/60 dark:border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Footer brand signature */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
          WatsStore — الحماية والمرونة العالية
        </div>
      </div>
    </div>
  );
}
