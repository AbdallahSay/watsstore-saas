export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="جاري تحميل لوحة التحكم...">
      {/* Top Welcome / Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-2.5">
          <div className="h-6 w-48 sm:w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-32 sm:w-40 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-10 w-32 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl" />
        </div>
      </div>

      {/* 4 Top KPI Stat Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-slate-800/80" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton (Table / Card Listing) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Table Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-44 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3.5">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 sm:w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-20 sm:w-28 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md hidden sm:block" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
