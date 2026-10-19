'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, LayoutDashboard, HelpCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Merchant Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
        {/* Warning Icon Badge */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
            خطأ في تحميل بيانات لوحة التحكم
          </span>
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            تعذر جلب بعض البيانات
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            حدث انقطاع مؤقت أثناء الاتصال بخوادم WatsStore. يمكنك إعادة المحاولة دون فقدان جلستك.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 py-1 px-2.5 rounded-md inline-block">
              معرف الخطأ: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/60 dark:border-slate-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>نظرة عامة</span>
          </Link>
        </div>

        {/* Help Tip */}
        <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>إذا استمر الخلل، يرجى التحقق من اتصال الإنترنت أو التواصل مع الدعم الفني</span>
        </div>
      </div>
    </div>
  );
}
