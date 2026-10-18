import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { StoreDirectoryCard } from '@/types';
import { 
  Store as StoreIcon, 
  MapPin, 
  Tag, 
  ShoppingBag, 
  ArrowLeft, 
  Search, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DirectoryPageProps {
  searchParams: {
    city?: string;
    category?: string;
  };
}

const EGYPT_CITIES = [
  'الكل',
  'الفيوم',
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'المنصورة',
  'طنطا',
  'أسيوط',
  'سوهاج',
  'المنيا',
  'الشرقية',
  'القليوبية',
  'بني سويف',
  'بورسعيد',
];

const BUSINESS_CATEGORIES = [
  'الكل',
  'ملابس وأزياء',
  'مطاعم وأكلات',
  'حلويات ومخبوزات',
  'عطور ومستحضرات تجميل',
  'إكسسوارات وهدايا',
  'أحذية وحقائب',
  'إلكترونيات وموبايل',
];

export async function generateMetadata({ searchParams }: DirectoryPageProps): Promise<Metadata> {
  const { city, category } = searchParams;
  let title = 'دليل المتاجر ومنيو الواتساب في مصر | WatsStore';
  let desc = 'تصفح دليل متاجر الواتساب والكتالوجات المحلية في محافظات مصر. تسوق واطلب مباشرة من التاجر بضغطة زر.';

  if (city && category) {
    title = `متاجر ${category} في ${city} | دليل WatsStore مصر`;
    desc = `تصفح أفضل محلات وكتالوجات ${category} في ${city}. تسوق أونلاين واطلب مباشرة عبر الواتساب.`;
  } else if (city) {
    title = `متاجر ومنيو الواتساب في ${city} | WatsStore مصر`;
    desc = `تصفح المتاجر والمطاعم المحلية في ${city} واطلب دليفري مباشرة عبر الواتساب.`;
  } else if (category) {
    title = `متاجر ${category} أونلاين في مصر | WatsStore`;
    desc = `أفضل كتالوجات ومتاجر ${category} في جميع محافظات مصر على الواتساب.`;
  }

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      locale: 'ar_EG',
    },
  };
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const selectedCity = searchParams.city && searchParams.city !== 'الكل' ? searchParams.city : undefined;
  const selectedCategory = searchParams.category && searchParams.category !== 'الكل' ? searchParams.category : undefined;

  let stores: StoreDirectoryCard[] = [];
  try {
    stores = await api.getDirectory(selectedCity, selectedCategory);
  } catch {
    stores = [];
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-slate-50 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3.5 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دليل المتاجر والكتالوجات المحلية في محافظات مصر</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              {selectedCity || selectedCategory ? (
                <>
                  متاجر{' '}
                  <span className="text-emerald-600">{selectedCategory || 'جميع الأنشطة'}</span>
                  {selectedCity && <> في <span className="text-emerald-600">{selectedCity}</span></>}
                </>
              ) : (
                'اكتشف أفضل المتاجر المحلية في منطقتك'
              )}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              تصفح منيو وكتالوجات المحلات القريبة منك، اختر منتجاتك، وتواصل فوراً مع التاجر عبر الواتساب بدون عمولات وساطة.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-10 space-y-5">
            {/* Cities Filter */}
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2.5">المحافظة / المدينة:</span>
              <div className="flex flex-wrap gap-2">
                {EGYPT_CITIES.map((city) => {
                  const isActive = (!selectedCity && city === 'الكل') || selectedCity === city;
                  const queryCity = city === 'الكل' ? undefined : city;
                  const params = new URLSearchParams();
                  if (queryCity) params.set('city', queryCity);
                  if (selectedCategory) params.set('category', selectedCategory);

                  return (
                    <Link
                      key={city}
                      href={`/directory?${params.toString()}`}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {city}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Categories Filter */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-2.5">نوع النشاط:</span>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_CATEGORIES.map((cat) => {
                  const isActive = (!selectedCategory && cat === 'الكل') || selectedCategory === cat;
                  const queryCat = cat === 'الكل' ? undefined : cat;
                  const params = new URLSearchParams();
                  if (selectedCity) params.set('city', selectedCity);
                  if (queryCat) params.set('category', queryCat);

                  return (
                    <Link
                      key={cat}
                      href={`/directory?${params.toString()}`}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-md mx-auto my-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <StoreIcon className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">لا توجد متاجر مطابقة في هذا التصنيف</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                كن أول تاجر يسجل في هذه المنطقة أو اختر تصنيفاً آخر لتصفح المتاجر المتاحة.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <span>سجل متجرك الآن مجاناً</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store.slug}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.storeName}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: store.themeColor }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
                        >
                          <StoreIcon className="w-7 h-7" />
                        </div>
                      )}

                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {store.productCount} منتج متوفر
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {store.storeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {store.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {store.businessCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      التوصيل: <strong className="text-slate-700 font-bold">{store.deliveryFee > 0 ? `${store.deliveryFee} ${store.currency}` : 'مجاني'}</strong>
                    </span>

                    <Link
                      href={`/s/${store.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                      <span>زيارة المتجر</span>
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
    </>
  );
}
