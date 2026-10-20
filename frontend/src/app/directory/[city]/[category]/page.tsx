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
  ArrowLeft, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ProgrammaticDirectoryProps {
  params: {
    city: string;
    category: string;
  };
}

const POPULAR_CATEGORIES = [
  'ملابس وأزياء',
  'مطاعم وأكلات',
  'حلويات ومخبوزات',
  'عطور ومستحضرات تجميل',
  'إكسسوارات وهدايا',
  'أحذية وحقائب',
  'إلكترونيات وموبايل',
];

const POPULAR_CITIES = [
  'الفيوم',
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'المنصورة',
  'طنطا',
  'أسيوط',
  'سوهاج',
  'المنيا',
  'بني سويف',
];

export async function generateMetadata({ params }: ProgrammaticDirectoryProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city);
  const category = decodeURIComponent(params.category);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app';
  const canonicalUrl = `${appUrl}/directory/${encodeURIComponent(params.city)}/${encodeURIComponent(params.category)}`;

  const title = `أفضل متاجر ومحلات ${category} في ${city} | تسوق عبر WatsStore by Masar Tech`;
  const description = `دليل أفضل محلات ومتاجر ${category} في محافظة ${city}. تصفح الكتالوجات وقوائم الأسعار بالصور، واطلب أونلاين مباشرة عبر الواتساب مع خدمة التوصيل السريع.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: 'ar_EG',
      siteName: 'WatsStore by Masar Tech',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ProgrammaticDirectoryPage({ params }: ProgrammaticDirectoryProps) {
  const city = decodeURIComponent(params.city);
  const category = decodeURIComponent(params.category);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frontend-bay-ten-58.vercel.app';

  let stores: StoreDirectoryCard[] = [];
  try {
    stores = await api.getDirectory(city, category);
  } catch {
    stores = [];
  }

  // Schema.org Structured Data for Google Rich Results (ItemList & Breadcrumbs)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `أفضل متاجر ومحلات ${category} في ${city}`,
    description: `دليل محلات وكتالوجات ${category} في ${city} على منصة WatsStore by Masar Tech`,
    numberOfItems: stores.length,
    itemListElement: stores.map((store, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Store',
        name: store.storeName,
        url: `${appUrl}/s/${store.slug}`,
        image: store.logoUrl || undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: store.city,
          addressCountry: 'EG',
        },
        priceRange: store.deliveryFee > 0 ? `${store.deliveryFee} ${store.currency}` : 'ج.م',
      },
    })),
  };

  const breadcrumbsData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: appUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'دليل المتاجر في مصر',
        item: `${appUrl}/directory`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `متاجر ${city}`,
        item: `${appUrl}/directory?city=${encodeURIComponent(city)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${category} في ${city}`,
        item: `${appUrl}/directory/${encodeURIComponent(params.city)}/${encodeURIComponent(params.category)}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Inject SEO JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsData) }}
      />

      <Navbar />

      <main className="flex-1 py-8 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Breadcrumbs Navigation */}
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 overflow-x-auto pb-2">
            <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <Link href="/directory" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              دليل المتاجر
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <Link 
              href={`/directory?city=${encodeURIComponent(city)}`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              متاجر {city}
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {category} في {city}
            </span>
          </nav>

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 border border-emerald-800/40 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>دليل الأنشطة والكتالوجات المحلية في {city}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white">
                أفضل متاجر ومحلات{' '}
                <span className="text-emerald-400">{category}</span> في{' '}
                <span className="text-teal-300">{city}</span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                تصفح أحدث كتالوجات وقوائم أسعار محلات {category} في محافظة {city}. اطلب مباشرة من التاجر عبر الواتساب واستلم طلبك دليفري بسرعة وبدون أي عمولات إضافية.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-bold text-white border border-white/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{stores.length} متجر معتمد متوفر</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-bold text-white border border-white/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>طلب مباشر على واتساب التاجر</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Category Switcher within the same City */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                تصفح باقي أنشطة ومحلات {city}:
              </h2>
              <Link 
                href={`/directory?city=${encodeURIComponent(city)}`}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>عرض كل متاجر {city}</span>
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {POPULAR_CATEGORIES.map((cat) => {
                const isActive = cat === category;
                return (
                  <Link
                    key={cat}
                    href={`/directory/${encodeURIComponent(city)}/${encodeURIComponent(cat)}`}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {cat} في {city}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Stores Grid or Empty State */}
          {stores.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 sm:p-16 text-center border border-slate-200 dark:border-slate-800 max-w-lg mx-auto shadow-sm space-y-5 transition-colors">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <StoreIcon className="w-10 h-10 stroke-1" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  لا توجد متاجر {category} مسجلة حالياً في {city}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  هل تمتلك محلاً أو مشروع {category} في {city}؟ كن أول تاجر يفتتح متجره الرقمي هنا واستقبل طلبات زبائنك مباشرة على الواتساب!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all hover:scale-105"
                >
                  <span>🚀 افتح متجرك في {city} الآن مجاناً</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <Link
                  href={`/directory?city=${encodeURIComponent(city)}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all"
                >
                  <span>تصفح كل محلات {city}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store.slug}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
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
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0 text-xl"
                        >
                          🛍️
                        </div>
                      )}

                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {store.productCount} منتج متوفر
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {store.storeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {store.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {store.businessCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      التوصيل:{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-bold">
                        {store.deliveryFee > 0 ? `${store.deliveryFee} ${store.currency}` : 'مجاني'}
                      </strong>
                    </span>

                    <Link
                      href={`/s/${store.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                      <span>زيارة الكتالوج</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Cities Links for Programmatic SEO Internal Linking */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              متاجر {category} في باقي المحافظات:
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {POPULAR_CITIES.map((c) => {
                if (c === city) return null;
                return (
                  <Link
                    key={c}
                    href={`/directory/${encodeURIComponent(c)}/${encodeURIComponent(category)}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                  >
                    {category} في {c}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Programmatic SEO Educational Paragraph */}
          <div className="bg-emerald-50/60 dark:bg-slate-900/80 rounded-3xl p-8 border border-emerald-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-3 transition-colors">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              لماذا تتسوق من محلات ومتاجر {category} في {city} عبر منصة WatsStore؟
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              توفر لك منصة <strong>WatsStore by Masar Tech</strong> إمكانية تصفح أحدث كتالوجات وقوائم منتجات محلات ومتاجر <strong>{category}</strong> في محافظة <strong>{city}</strong> بكل سهولة من هاتفك المحمول. يمكنك اختيار المنتجات والمقاسات والألوان المفضلة، وإرسال طلب الشراء مباشرة إلى رقم الواتساب الرسمي للتاجر لاستلامه دليفري في أسرع وقت دون أي وسيط أو تكاليف خفية.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
