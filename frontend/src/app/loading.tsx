import { Store } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="relative flex flex-col items-center">
        {/* Outer glowing pulsing aura */}
        <div className="absolute -inset-4 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-xl animate-pulse" />

        {/* Brand Icon Badge inside Spinning Rings */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer spinner ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-600 dark:border-t-emerald-500 animate-spin" />
          
          {/* Inner pulsating brand badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Store className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Brand Name & Loading Message */}
        <div className="mt-6 text-center space-y-1.5">
          <h3 className="text-lg font-black bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            WatsStore
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            جاري تحميل المنصة بأعلى سرعة...
          </p>
        </div>
      </div>
    </div>
  );
}
