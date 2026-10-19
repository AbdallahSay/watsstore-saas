export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-pulse transition-colors duration-200">
      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </header>

      {/* Hero / Cover Banner Skeleton */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="h-40 sm:h-56 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Horizontal Category Pills Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 overflow-x-hidden">
          {[1, 2, 3, 4, 5, 6].map((cat) => (
            <div
              key={cat}
              className="h-9 w-24 sm:w-28 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"
            />
          ))}
        </div>
      </div>

      {/* 6-Card Responsive Product Grid Skeleton */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Product Image Skeleton */}
              <div className="aspect-square w-full bg-slate-200 dark:bg-slate-800" />

              {/* Product Info Skeleton */}
              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-9 w-9 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
