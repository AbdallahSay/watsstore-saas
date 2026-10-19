import Link from 'next/link';
import { Store, Compass, PlusCircle, Home } from 'lucide-react';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full text-center space-y-7 bg-white dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Store Icon Badge with Inactive/Closed Indicator */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 shadow-inner">
              <Store className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-black">
              !
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60 mt-3">
            المتجر غير متوفر
          </span>
        </div>

        {/* Headlines */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            هذا المتجر غير متاح حالياً
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            قد يكون هذا المتجر تم إيقافه مؤقتاً بواسطة صاحبه، أو أن رابط المتجر غير صحيح. يمكنك تصفح المتاجر المتاحة في مدينتك أو بدء متجرك الآن مجاناً.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/directory"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Compass className="w-4 h-4" />
            <span>تصفح دليل المتاجر</span>
          </Link>

          <Link
            href="/register"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/60 dark:border-slate-700"
          >
            <PlusCircle className="w-4 h-4" />
            <span>أنشئ متجرك مجاناً</span>
          </Link>
        </div>

        {/* Home fallback link */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>العودة للصفحة الرئيسية لـ WatsStore</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
