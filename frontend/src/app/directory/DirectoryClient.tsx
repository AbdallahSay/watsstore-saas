'use client';

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
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DirectoryClientProps {
  stores: StoreDirectoryCard[];
  selectedCity?: string;
  selectedCategory?: string;
  cities: string[];
  categories: string[];
}

export default function DirectoryClient({
  stores,
  selectedCity,
  selectedCategory,
  cities,
  categories,
}: DirectoryClientProps) {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('dir.badge', undefined, 'دليل المتاجر والكتالوجات المحلية في محافظات مصر')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {selectedCity || selectedCategory ? (
                <>
                  {t('dir.title_filtered', { category: selectedCategory || (dir === 'rtl' ? 'جميع الأنشطة' : 'All Categories'), city: selectedCity || '' }, 
                    `متاجر ${selectedCategory || 'جميع الأنشطة'}${selectedCity ? ` في ${selectedCity}` : ''}`
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

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-10 space-y-5 transition-colors">
            {/* Cities Filter */}
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5">
                {t('dir.city_filter', undefined, 'المحافظة / المدينة:')}
              </span>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => {
                  const isAll = city === 'الكل' || city === 'All';
                  const isActive = (!selectedCity && isAll) || selectedCity === city;
                  const queryCity = isAll ? undefined : city;
                  let href = '/directory';
                  if (queryCity && selectedCategory) {
                    href = `/directory/${encodeURIComponent(queryCity)}/${encodeURIComponent(selectedCategory)}`;
                  } else if (queryCity) {
                    href = `/directory?city=${encodeURIComponent(queryCity)}`;
                  } else if (selectedCategory) {
                    href = `/directory?category=${encodeURIComponent(selectedCategory)}`;
                  }

                  return (
                    <Link
                      key={city}
                      href={href}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isAll ? t('dir.all', undefined, 'الكل') : city}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Categories Filter */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5">
                {t('dir.cat_filter', undefined, 'نوع النشاط:')}
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isAll = cat === 'الكل' || cat === 'All';
                  const isActive = (!selectedCategory && isAll) || selectedCategory === cat;
                  const queryCat = isAll ? undefined : cat;

                  let href = '/directory';
                  if (selectedCity && queryCat) {
                    href = `/directory/${encodeURIComponent(selectedCity)}/${encodeURIComponent(queryCat)}`;
                  } else if (queryCat) {
                    href = `/directory?category=${encodeURIComponent(queryCat)}`;
                  } else if (selectedCity) {
                    href = `/directory?city=${encodeURIComponent(selectedCity)}`;
                  }

                  return (
                    <Link
                      key={cat}
                      href={href}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isAll ? t('dir.all', undefined, 'الكل') : cat}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                <StoreIcon className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {t('dir.empty_title', undefined, 'لا توجد متاجر مطابقة في هذا التصنيف')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('dir.empty_sub', undefined, 'كن أول تاجر يسجل في هذه المنطقة أو اختر تصنيفاً آخر لتصفح المتاجر المتاحة.')}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20"
              >
                <span>{t('dir.register_cta', undefined, 'سجل متجرك الآن مجاناً')}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
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
                        {store.deliveryFee > 0 ? `${store.deliveryFee} ${store.currency}` : t('dir.free_delivery', undefined, 'مجاني')}
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
