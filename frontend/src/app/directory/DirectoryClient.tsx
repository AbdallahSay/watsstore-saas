'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { StoreDirectoryCard } from '@/types';
import { 
  Store as StoreIcon, 
  MapPin, 
  Tag, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  Search,
  X,
  RotateCcw,
  Truck
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';

interface DirectoryClientProps {
  stores: StoreDirectoryCard[];
  selectedCity?: string;
  selectedCategory?: string;
  cities: string[];
  categories: string[];
}

export default function DirectoryClient({
  stores,
  selectedCity: initialCity,
  selectedCategory: initialCategory,
  cities,
  categories,
}: DirectoryClientProps) {
  const { t, dir } = useLanguage();
  const { format: formatCurrency, currency } = useCurrency();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isRtl = dir === 'rtl';

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState(initialCity || '');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || '');

  // Real-time multi-criteria filtering
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // 1. City match
      if (cityFilter && cityFilter !== 'الكل' && cityFilter !== 'All') {
        if (store.city !== cityFilter) return false;
      }

      // 2. Category match
      if (categoryFilter && categoryFilter !== 'الكل' && categoryFilter !== 'All') {
        if (store.businessCategory !== categoryFilter) return false;
      }

      // 3. Search query match (storeName, city, businessCategory, slug)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = store.storeName?.toLowerCase().includes(q);
        const cityMatch = store.city?.toLowerCase().includes(q);
        const catMatch = store.businessCategory?.toLowerCase().includes(q);
        const slugMatch = store.slug?.toLowerCase().includes(q);
        if (!nameMatch && !cityMatch && !catMatch && !slugMatch) {
          return false;
        }
      }

      return true;
    });
  }, [stores, cityFilter, categoryFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCityFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || 
    (cityFilter && cityFilter !== 'الكل' && cityFilter !== 'All') || 
    (categoryFilter && categoryFilter !== 'الكل' && categoryFilter !== 'All')
  );

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('dir.badge', undefined, 'دليل المتاجر والكتالوجات المحلية في محافظات مصر')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {cityFilter || categoryFilter ? (
                <>
                  {t('dir.title_filtered', { category: categoryFilter || (isRtl ? 'جميع الأنشطة' : 'All Categories'), city: cityFilter || '' }, 
                    `متاجر ${categoryFilter || (isRtl ? 'جميع الأنشطة' : 'All Categories')}${cityFilter ? ` في ${cityFilter}` : ''}`
                  )}
                </>
              ) : (
                t('dir.title_default', undefined, 'اكتشف أفضل المتاجر المحلية في منطقتك')
              )}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('dir.subtitle', undefined, 'تصفح منيو وكتالوجات المحلات القريبة منك، اختر منتجاتك، وتواصل فوراً مع التاجر عبر الواتساب بدون عمولات وساطة.')}
            </p>
          </div>

          {/* Interactive Filter Control Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-10 space-y-6 transition-colors">
            {/* Top Row: Search Input + Select Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Real-time Search Input */}
              <div className="md:col-span-6 relative">
                <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('dir.search_placeholder', undefined, 'ابحث عن اسم متجر، أو محافظة، أو نشاط تجاري...')}
                  className={`w-full ${isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1`}
                    aria-label="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Governorate Dropdown */}
              <div className="md:col-span-3 relative">
                <MapPin className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {t('dir.filter_all_cities', undefined, 'كل المحافظات')}
                  </option>
                  {cities.filter(c => c !== 'الكل' && c !== 'All').map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div className="md:col-span-3 relative">
                <Tag className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {t('dir.filter_all_cats', undefined, 'كل الأنشطة التجارية')}
                  </option>
                  {categories.filter(b => b !== 'الكل' && b !== 'All').map((b) => (
                    <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* City Filter Pills */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('dir.city_filter', undefined, 'المحافظة / المدينة:')}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {t('dir.results_count', { count: filteredStores.length }, `المتاجر المتاحة: ${filteredStores.length}`)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCityFilter('')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !cityFilter
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('dir.all', undefined, 'الكل')}
                </button>
                {cities.filter(c => c !== 'الكل' && c !== 'All').map((city) => {
                  const isActive = cityFilter === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setCityFilter(isActive ? '' : city)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5">
                {t('dir.cat_filter', undefined, 'نوع النشاط:')}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !categoryFilter
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('dir.all', undefined, 'الكل')}
                </button>
                {categories.filter(b => b !== 'الكل' && b !== 'All').map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(isActive ? '' : cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset Filters CTA if active */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dir.results_count', { count: filteredStores.length }, `تم العثور على ${filteredStores.length} متجر مطابق`)}
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('dir.reset_filters', undefined, 'إعادة ضبط الفلاتر')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Stores Grid */}
          {filteredStores.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                <StoreIcon className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {t('dir.empty_title', undefined, 'لا توجد متاجر مطابقة في هذا التصنيف')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('dir.empty_sub', undefined, 'كن أول تاجر يسجل في هذه المنطقة أو اختر تصنيفاً آخر لتصفح المتاجر المتاحة.')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('dir.reset_filters', undefined, 'عرض جميع المتاجر')}</span>
                  </button>
                )}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20"
                >
                  <span>{t('dir.register_cta', undefined, 'سجل متجرك الآن مجاناً')}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <div
                  key={store.slug}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.storeName}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: store.themeColor }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
                        >
                          <StoreIcon className="w-7 h-7" />
                        </div>
                      )}

                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {t('dir.products_available', { count: store.productCount }, `${store.productCount} منتج متوفر`)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {store.storeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {store.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {store.businessCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('dir.delivery', undefined, 'التوصيل:')}{' '}
                      <strong className="text-slate-700 dark:text-slate-200 font-bold">
                        {store.deliveryFee > 0
                          ? formatCurrency(store.deliveryFee)
                          : t('dir.free_delivery', undefined, 'مجاني')}
                      </strong>
                    </span>

                    <Link
                      href={`/s/${store.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                      <span>{t('dir.visit_store', undefined, 'زيارة المتجر')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
