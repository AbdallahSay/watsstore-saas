'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MessageCircle,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Search,
  BarChart3,
  ExternalLink,
  X,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Palette,
  Star,
  ShieldCheck,
  Eye,
  Store,
  Phone,
  Layers
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  STORE_THEMES,
  STORE_THEME_IDS,
  THEME_CATEGORIES,
  StoreThemeId,
  BusinessCategoryKey,
} from '@/lib/store-themes';

export default function HomePage() {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<BusinessCategoryKey>('all');
  const [pricing, setPricing] = useState({
    proMonthlyPrice: 299,
    proAnnualPrice: 2499,
    vipMonthlyPrice: 599,
    vipAnnualPrice: 4999,
    isLaunchDiscountBannerActive: true,
    launchDiscountText: '',
  });
  const [showBanner, setShowBanner] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqItems = [
    {
      q: t('faq.q1', undefined, 'كيف يستقبل متجري الطلبات من الزبائن؟'),
      a: t('faq.a1', undefined, 'عندما يختار الزبون منتجاته ويحدد الكميات والمقاسات والعنوان، يضغط على "إتمام الطلب عبر واتساب"، فيتم إنشاء رسالة مرتبة تلقائياً بها فاتورة كاملة ومجموع الحساب ويتم تحويله مباشرة إلى محادثتك على الواتساب مع حفظ بيانات الطلب في لوحة التحكم.'),
    },
    {
      q: t('faq.q2', undefined, 'هل أحتاج لبطاقة بنكية لبدء التجربة المجانية؟'),
      a: t('faq.a2', undefined, 'لا على الإطلاق! التسجيل مجاني تماماً لمدة 14 يوماً بدون الحاجة لأي بطاقة بنكية، وتستطيع إضافة منتجاتك وتجربة كافة القوالب ومميزات المنصة فوراً.'),
    },
    {
      q: t('faq.q3', undefined, 'هل يمكنني ربط إعلانات الفيسبوك وتتبع المبيعات بـ Meta Pixel؟'),
      a: t('faq.a3', undefined, 'نعم بكل تأكيد! باقة Pro وVIP توفر ربطاً متقدماً لبيكسل ميتا مع تتبع تلقائي لأحداث ViewContent وAddToCart وPurchase لحساب العائد على الإنفاق الإعلاني بدقة.'),
    },
    {
      q: t('faq.q4', undefined, 'ما الفرق بين الرابط المباشر والرمز الدائم QR؟'),
      a: t('faq.a4', undefined, 'الرابط المباشر يفتح متجرك عبر الويب، أما رمز QR فهو كود مختصر دائم يمكنك طباعته على الأكياس والفواتير والكراتين ولن يتغير حتى لو قمت بتعديل اسم المتجر مستقبلاً.'),
    },
    {
      q: dir === 'rtl' ? 'هل يمكنني تغيير قالب وتصميم المتجر لاحقاً؟' : 'Can I switch my storefront theme later?',
      a: dir === 'rtl' ? 'نعم! يمكنك التبديل بين جميع القوالب الـ 10 بضغطة زر واحدة من لوحة التحكم في أي وقت دون أن تفقد منتجاتك أو بيانات طلباتك.' : 'Yes! You can switch between all 10 designs with a single click from your merchant dashboard without losing any products or order history.',
    },
  ];

  const testimonials = [
    {
      name: dir === 'rtl' ? 'كريم الشريف' : 'Karim El-Sherif',
      role: dir === 'rtl' ? 'مؤسس الشريف فاشون — القاهرة' : 'Founder, El-Sherif Fashion — Cairo',
      quote: dir === 'rtl' ? 'واتس ستور غيّر شكل البيع تماماً عندنا، الزبون بيدخل يختار المقاس واللون والأوردر بيوصلني على الواتس جاهز بالعنوان ومحسوب فيه مصاريف الشحن بدون أي لخبطة.' : 'WatsStore completely transformed our sales. Customers select size and color, and we receive clean WhatsApp orders with addresses and shipping fees calculated instantly.',
      theme: 'Editorial Luxe',
      growth: '+45%',
      growthLabel: dir === 'rtl' ? 'زيادة في تحويل الطلبات' : 'Order conversion increase',
    },
    {
      name: dir === 'rtl' ? 'سارة عبد الرحمن' : 'Sara Abdelrahman',
      role: dir === 'rtl' ? 'بيور ليدي كوزمتكس — الإسكندرية' : 'Pure Lady Cosmetics — Alexandria',
      quote: dir === 'rtl' ? 'ربط Meta Pixel مع المتجر ساعدنا نعرف إعلاناتنا على فيسبوك وإنستغرام بتجيب كام بالظبط. وفرنا وقت الموديريتورز وزادت المبيعات بنسبة ملحوظة من أول أسبوع.' : 'Integrating Meta Pixel with the storefront showed us exact ROAS for our Instagram & Facebook campaigns. Saved massive moderation time and boosted weekly revenue.',
      theme: 'Pure Beauty',
      growth: '3.8x',
      growthLabel: dir === 'rtl' ? 'عائد الإنفاق الإعلاني ROAS' : 'Ad spend return (ROAS)',
    },
    {
      name: dir === 'rtl' ? 'م. محمود عبد العظيم' : 'Eng. Mahmoud Abdelazim',
      role: dir === 'rtl' ? 'تك زون للإلكترونيات — المنصورة' : 'TechZone Electronics — Mansoura',
      quote: dir === 'rtl' ? 'تصميم تك جريد فائق السرعة على الموبايل والعملاء مبهورين بالخفة والسهولة. لوحة التحكم سهلة والدعم الفني متجاوب وممتاز على الواتساب.' : 'The Tech Grid theme is ultra-fast on mobile. Customers love the fluid experience. The merchant dashboard is clean and WhatsApp support is always responsive.',
      theme: 'Tech Grid',
      growth: '100%',
      growthLabel: dir === 'rtl' ? 'جاهزية وسرعة على الموبايل' : 'Mobile readiness score',
    },
  ];

  useEffect(() => {
    api.getPublicPricing()
      .then((data) => {
        if (data) {
          setPricing((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.warn('Using default pricing matrix fallback:', err));
  }, []);

  const handleBannerClick = async () => {
    const { default: appSwal } = await import('@/lib/sweetalert');
    appSwal.fire({
      icon: 'info',
      title: t('home.banner_text', undefined, '🔥 عرض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!'),
      text: t('home.pricing_sub', undefined, 'جميع الباقات تشمل تجربة مجانية كاملة 14 يوماً بدون الحاجة لبطاقة بنكية'),
      confirmButtonText: t('swal.ok', undefined, 'حسناً'),
    });
  };

  const filteredThemes = STORE_THEME_IDS.filter((id) => {
    if (selectedThemeCategory === 'all') return true;
    return STORE_THEMES[id].primaryCategory === selectedThemeCategory;
  });

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Urgency & Scarcity Marketing Banner */}
      {showBanner && pricing.isLaunchDiscountBannerActive && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2.5 text-xs sm:text-sm font-black shadow-md flex items-center justify-between relative z-50 animate-fadeIn">
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <button
              type="button"
              onClick={handleBannerClick}
              className="text-start hover:underline cursor-pointer"
            >
              {pricing.launchDiscountText || t('home.banner_text', undefined, '🔥 عرض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!')}
            </button>
            <a href="#pricing" className="underline mr-2 text-amber-200 hover:text-white font-black transition-colors">
              {t('home.banner_cta', undefined, 'اختر باقتك وسجل الآن ←')}
            </a>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={t('home.banner_close', undefined, 'إغلاق الإشعار')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://frontend-bay-ten-58.vercel.app/#organization',
                  name: 'WatsStore',
                  url: 'https://frontend-bay-ten-58.vercel.app',
                  logo: 'https://frontend-bay-ten-58.vercel.app/favicon.ico',
                  description: 'منصة التجارة الإلكترونية وكتالوجات الواتساب الرائدة في مصر',
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://frontend-bay-ten-58.vercel.app/#software',
                  name: 'WatsStore SaaS',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'All',
                  offers: {
                    '@type': 'AggregateOffer',
                    priceCurrency: 'EGP',
                    lowPrice: '0',
                    highPrice: '599',
                    offerCount: '3',
                  },
                },
              ],
            }),
          }}
        />

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 pt-16 pb-20 md:pt-24 md:pb-28 transition-colors">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-300/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-8 border border-emerald-200/80 dark:border-emerald-800/80 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{t('hero.badge', undefined, 'المنصة الأولى المخصصة للتجار وأصحاب المشاريع في مصر 🇪🇬')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.18] max-w-4xl mx-auto">
              {dir === 'rtl' ? 'أنشئ متجرًا إلكترونيًا بتجربة مجانية لمدة 14 يومًا' : 'Create your online store with a free 14-day trial'}{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                {dir === 'rtl' ? 'واستقبل الطلبات عبر واتساب' : 'and receive orders on WhatsApp'}
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {dir === 'rtl'
                ? 'اختر من بين 10 تصاميم احترافية مخصصة لمجالك التجاري. يستلم عملاؤك تجربة تسوق سريعة على الموبايل، وتصلك طلبات منظمة وفاتورة جاهزة على الواتساب مع تتبع إعلانات Meta Pixel.'
                : 'Choose from 10 category-crafted designs. Your customers enjoy a fluid mobile experience, and you receive structured WhatsApp orders with full Meta Pixel tracking.'}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link prefetch={false}
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 min-h-[48px]"
              >
                <span>{t('hero.cta_primary', undefined, 'ابدأ تجربة مجانية لمدة 14 يوماً')}</span>
                <ArrowIcon className="w-5 h-5" />
              </Link>

              <a
                href="#themes"
                className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-base rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2.5 transition-all hover:border-slate-400 min-h-[48px]"
              >
                <Palette className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{dir === 'rtl' ? 'استعرض تصاميم المتاجر (10)' : 'Explore 10 Store Themes'}</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t('hero.trust_no_card', undefined, 'بدون بطاقة بنكية للتسجيل')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t('home.trust_mobile', undefined, 'متوافق 100% مع الجوال والموبايل')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t('home.trust_pixel', undefined, 'ربط مباشر لبيكسل ميتا (Meta Ads)')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{dir === 'rtl' ? '10 قوالب احترافية لكل الأنشطة' : '10 Niche E-Commerce Themes'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 10-THEME SHOWCASE SECTION */}
        <section id="themes" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800/60">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{dir === 'rtl' ? '10 تصاميم متجر حقيقية وغير مكررة' : '10 Truly Distinct Storefront Themes'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {dir === 'rtl' ? 'تصميم مخصص يعبر عن هوية نشاطك التجاري' : 'An Art-Directed Storefront for Every Business'}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {dir === 'rtl'
                  ? 'ليست مجرد ألوان مختلفة! كل قالب صُمم بهوية بصرية كاملة، خطوط وتوزيع بطاقات ملائم لطبيعة منتجاتك — أزياء، سنيكرز، تجميل، إلكترونيات، طعام، وأكثر.'
                  : 'Not just recolors. Each theme features dedicated typography, card proportions, visual hierarchy, and category-tailored mobile UX.'}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar max-w-full">
              {THEME_CATEGORIES.map((cat) => {
                const isActive = selectedThemeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedThemeCategory(cat.id as BusinessCategoryKey)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {dir === 'rtl' ? cat.labelAr : cat.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredThemes.map((themeId) => {
                const theme = STORE_THEMES[themeId];
                return (
                  <div
                    key={theme.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header & Category Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          {dir === 'rtl' ? theme.categoryLabelAr : theme.categoryLabelEn}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {theme.fontMood}
                        </span>
                      </div>

                      {/* Theme Name */}
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {dir === 'rtl' ? theme.nameAr : theme.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-3">
                        {theme.name}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                        {dir === 'rtl' ? theme.descriptionAr : theme.description}
                      </p>

                      {/* Color Palette Swatches */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 mb-5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                          {dir === 'rtl' ? 'باليت الألوان المعتمدة:' : 'Curated Color Palette:'}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full shadow-inner border border-black/10"
                            style={{ backgroundColor: theme.sampleColors.accent }}
                            title="Accent Color"
                          />
                          <div
                            className="w-7 h-7 rounded-full shadow-inner border border-black/10"
                            style={{ backgroundColor: theme.sampleColors.bg }}
                            title="Background Color"
                          />
                          <div
                            className="w-7 h-7 rounded-full shadow-inner border border-black/10"
                            style={{ backgroundColor: theme.sampleColors.card }}
                            title="Card Surface"
                          />
                          <div
                            className="w-7 h-7 rounded-full shadow-inner border border-black/10"
                            style={{ backgroundColor: theme.sampleColors.fg }}
                            title="Foreground Text"
                          />
                        </div>
                      </div>

                      {/* Recommended For Chips */}
                      <div className="mb-6">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                          {dir === 'rtl' ? 'مثالي لـ:' : 'Recommended for:'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(dir === 'rtl' ? theme.recommendedForAr : theme.recommendedFor).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
                      <Link prefetch={false}
                        href={`/s/al-amal-fashion?theme=${theme.id}`}
                        target="_blank"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>{dir === 'rtl' ? 'معاينة القالب الحي' : 'Live Preview'}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>

                      <Link prefetch={false}
                        href="/register"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all min-h-[44px]"
                      >
                        <span>{dir === 'rtl' ? 'جرب هذا القالب' : 'Use this theme'}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase mb-2">
                {t('home.why_watsstore', undefined, 'لماذا يفضل تجار مصر WatsStore؟')}
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t('home.features_headline', undefined, 'كل ما تحتاجه لمضاعفة مبيعاتك عبر واتساب بدون تعقيدات المتاجر التقليدية')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat1_title', undefined, 'طلبات منظمة على الواتساب')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat1_desc', undefined, 'وداعاً لرسائل "بكام ده؟" العشوائية. يستلم التاجر رسالة مفصلة برقم الطلب، أصناف المنتجات، المقاسات، الألوان، العنوان بالتفصيل، والإجمالي المستحق.')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat2_title', undefined, 'ربط Meta Pixel المزدوج')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat2_desc', undefined, 'تتبع دقيق لإعلانات فيسبوك وإنستغرام عبر تفعيل أحداث ViewContent وAddToCart وPurchase لحظة إتمام الطلب، لتحسين حملاتك بأعلى عائد ROAS.')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat3_title', undefined, 'SEO محلي ومحافظات مصر')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat3_desc', undefined, 'تهيئة تلقائية لنتائج بحث جوجل (SSR + JSON-LD Schema) وظهور قوي في دليل المتاجر حسب محافظتك (القاهرة، الفيوم، الجيزة، الإسكندرية...).')}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat4_title', undefined, 'سرعة فائقة وخفة')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat4_desc', undefined, 'واجهة عصرية بتصميم Next.js فائق الخفة يفتح فوراً لعميلك حتى مع باقات الإنترنت الضعيفة، لتقليل نسبة الارتداد وزيادة معدل التحويل.')}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat5_title', undefined, 'رمز QR دائم وقصير')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat5_desc', undefined, 'احصل على رابط قصير ورمز QR خاص بمتجرك لا يتغير لطباعته على الأكياس، كروت العمل، أو واجهة المحل ليدخل الزبون للمنيو مباشرة.')}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('home.feat6_title', undefined, 'إحصائيات وأرشفة كاملة')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('home.feat6_desc', undefined, 'لوحة تحكم سهلة تسجل جميع طلباتك في قاعدة بيانات SQL مع إجمالي الإيرادات وسجل تفصيلي ببيانات العملاء لإعادة استهدافهم لاحقاً.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS & REAL SOCIAL PROOF */}
        <section id="testimonials" className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800/60">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{dir === 'rtl' ? 'تجارب حقيقية من تجار المحافظات' : 'Trusted by Leading Egyptian Merchants'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {dir === 'rtl' ? 'قصص نجاح تجار WatsStore في مصر' : 'How WatsStore Drives Real Commerce'}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                {dir === 'rtl'
                  ? 'اكتشف كيف ساهمت منصة واتس ستور في زيادة مبيعات المتاجر وتقليل الفاقد وتسهيل استقبال الطلبات.'
                  : 'Real businesses growing with structured WhatsApp orders, instant Meta Pixel tracking, and zero hidden fees.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((tItem, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                      "{tItem.quote}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{tItem.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tItem.role}</p>
                    </div>
                    <div className="text-end">
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-400 block">{tItem.growth}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">{tItem.growthLabel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Impact Metric Strip */}
            <div className="mt-12 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 block">500,000+ ج.م</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                  {dir === 'rtl' ? 'قيمة طلبات شهرية عبر المنصة' : 'Monthly processed orders'}
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 block">10</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                  {dir === 'rtl' ? 'قوالب تجارية متخصصة' : 'Category-crafted themes'}
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 block">14 يوماً</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                  {dir === 'rtl' ? 'تجربة مجانية كاملة بدون كارت' : 'Free trial without card'}
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 block">100%</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                  {dir === 'rtl' ? 'جاهزية وسرعة على الموبايل' : 'Mobile-first responsiveness'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="py-24 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase mb-2">
                {t('home.pricing_tag', undefined, 'باقات تناسب جميع أحجام الأنشطة')}
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t('home.pricing_title', undefined, 'اختر الباقة المناسبة لمشروعك وابدأ بدون أي التزامات')}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                {t('home.pricing_sub', undefined, 'جميع الباقات تشمل تجربة مجانية كاملة 14 يوماً بدون الحاجة لبطاقة بنكية')}
              </p>

              {/* Billing Cycle Switcher */}
              <div className="mt-8 inline-flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[44px] ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md scale-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('home.pricing_monthly', undefined, 'الاشتراك الشهري')}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 min-h-[44px] ${
                    billingCycle === 'annual'
                      ? 'bg-emerald-700 text-white shadow-md scale-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{t('home.pricing_annual', undefined, 'الاشتراك السنوي')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                    billingCycle === 'annual' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {t('home.pricing_save30', undefined, 'وفر حتى 30% 🎁')}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
              {/* FREE TRIAL */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('home.plan_free_title', undefined, 'تجربة مجانية (14 يوماً)')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('home.plan_free_sub', undefined, 'جرب المنصة بكامل خصائصها قبل الاشتراك')}
                  </p>

                  <div className="mt-6 mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">0</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {t('home.plan_free_period', undefined, 'ج.م / لمدة 14 يوماً')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      {t('home.plan_free_no_card', undefined, 'بدون بطاقة ائتمان أو عمولات مخفية')}
                    </p>
                  </div>

                  <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_free_feat1', undefined, 'حتى 10 منتجات خلال فترة التجربة')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{dir === 'rtl' ? 'إمكانية تجربة جميع القوالب الـ 10' : 'Access to all 10 theme designs'}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_free_feat2', undefined, 'كوبون خصم واحد نشط لمتجرك')}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                      <span className="text-xs">🔒</span>
                      <span className="line-through">
                        {t('home.plan_free_locked_ai', undefined, 'كتابة الوصف بالذكاء الاصطناعي (متاح في Pro)')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                      <span className="text-xs">🔒</span>
                      <span className="line-through">
                        {t('home.plan_free_locked_excel', undefined, 'تصدير تقارير الطلبات إلى Excel (متاح في Pro)')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_free_feat3', undefined, 'طلبات واستفسارات غير محدودة عبر الواتساب')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_free_feat4', undefined, 'دعم متغيرات المنتجات والمحافظ الإلكترونية')}</span>
                    </li>
                  </ul>
                </div>

                <Link prefetch={false}
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm text-center transition-colors block min-h-[44px] flex items-center justify-center"
                >
                  {t('home.cta_button', undefined, 'ابدأ تجربتك المجانية (14 يوماً)')}
                </Link>
              </div>

              {/* PRO PLAN */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl relative ring-4 ring-emerald-500/10 flex flex-col justify-between transform md:-translate-y-2 transition-all">
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-300/40 tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('home.plan_pro_badge', undefined, 'الأكثر طلباً للتجار ⭐ (أفضل قيمة واستثمار)')}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                    {t('home.plan_pro_title', undefined, 'باقة المحترفين Pro')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('home.plan_pro_sub', undefined, 'للمتاجر الراغبة في التوسع ومضاعفة المبيعات')}
                  </p>

                  {billingCycle === 'annual' ? (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-emerald-700">{pricing.proAnnualPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {t('home.per_year', undefined, 'ج.م / سنوياً')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {t('home.save_pro_annual', undefined, 'وفر 1,089 ج.م (شهران مجاناً) 🎁')}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          {t('home.approx_per_month', { price: Math.round(pricing.proAnnualPrice / 12) }, `~${Math.round(pricing.proAnnualPrice / 12)} ج.م/شهرياً`)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-emerald-700">{pricing.proMonthlyPrice}</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {t('home.per_month', undefined, 'ج.م / شهرياً')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {t('home.flexible_monthly', undefined, 'تجديد شهري مرن، يمكنك الإلغاء بأي وقت')}
                      </p>
                    </div>
                  )}

                  <ul className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        {t('home.plan_pro_feat1', undefined, 'حتى 100 منتج و 15 كوبون خصم نشط')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {dir === 'rtl' ? 'تخصيص القوالب الـ 10 بالكامل وألوان الهوية' : 'Full access to all 10 themes & custom palettes'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t('home.plan_pro_feat2', undefined, '✨ 15 وصف بالذكاء الاصطناعي شهرياً 🤖')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t('home.plan_pro_feat3', undefined, '📊 تصدير الطلبات وتقارير المبيعات لـ Excel')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t('home.plan_pro_feat4', undefined, 'تفعيل Meta Pixel لتتبع إعلانات فيسبوك وإنستغرام')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_pro_feat5', undefined, 'إزالة شارة المنصة بالكامل لعلامة تجارية خاصة')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_pro_feat7', undefined, 'دعم فني وتدريب سريع ومباشر على الواتساب')}</span>
                    </li>
                  </ul>
                </div>

                <Link prefetch={false}
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm text-center shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] block min-h-[44px] flex items-center justify-center"
                >
                  {t('home.subscribe_pro', undefined, 'اشترك في باقة Pro الآن')}
                </Link>
              </div>

              {/* VIP PLAN */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('home.plan_vip_title', undefined, 'باقة كبار التجار VIP 👑')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('home.plan_vip_sub', undefined, 'للعلامات التجارية الكبرى والمتاجر الرائدة')}
                  </p>

                  {billingCycle === 'annual' ? (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{pricing.vipAnnualPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {t('home.per_year', undefined, 'ج.م / سنوياً')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          {t('home.save_vip_annual', undefined, 'وفر 2,189 ج.م سنوياً 👑')}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          {t('home.approx_per_month', { price: Math.round(pricing.vipAnnualPrice / 12) }, `~${Math.round(pricing.vipAnnualPrice / 12)} ج.م/شهرياً`)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{pricing.vipMonthlyPrice}</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {t('home.per_month', undefined, 'ج.م / شهرياً')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {t('home.vip_flexible', undefined, 'شامل كافة مميزات المنصة والدعم المخصص')}
                      </p>
                    </div>
                  )}

                  <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t('home.plan_vip_feat1', undefined, 'منتجات غير محدودة وكوبونات غير محدودة 🚀')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t('home.plan_vip_feat2', undefined, '💎 150 وصفاً ذكياً بالذكاء الاصطناعي شهرياً')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t('home.plan_vip_feat3', undefined, '📊 تصدير الطلبات وتقارير المبيعات لـ Excel')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t('home.plan_vip_feat4', undefined, 'دعم النطاق الخاص الكامل (Custom Domain)')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_vip_feat5', undefined, 'جميع مميزات باقة Pro بالكامل')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('home.plan_vip_feat6', undefined, 'مدير حساب مخصص وأولوية قصوى في الدعم الفني')}</span>
                    </li>
                  </ul>
                </div>

                <Link prefetch={false}
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-bold text-sm text-center transition-colors block shadow-md min-h-[44px] flex items-center justify-center"
                >
                  {t('home.subscribe_vip', undefined, 'انضم إلى باقة VIP الآن')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full mb-3">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t('faq.title', undefined, 'الأسئلة الشائعة والأكثر تكراراً')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {t('faq.title', undefined, 'الأسئلة الشائعة')}
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('faq.subtitle', undefined, 'كل ما تريد معرفته عن منصة WatsStore وكيفية بدء البيع عبر الواتساب في دقائق معدودة.')}
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-start flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm sm:text-base min-h-[52px]"
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTACT MASAR TECH SECTION */}
        <section id="contact" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span>{dir === 'rtl' ? 'فريق الدعم الفني في خدمتك' : 'Dedicated Egyptian Support Team'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {dir === 'rtl' ? 'هل لديك أي استفسار أو تحتاج مساعدة في إعداد متجرك؟' : 'Need help setting up your catalog or custom domain?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              {dir === 'rtl'
                ? 'فريق Masar Tech جاهز لمساعدتك في ربط بيكسل ميتا، اختيار القالب المناسب، وتفعيل اشتراكك فوراً.'
                : 'Our engineering and onboarding team is available directly on WhatsApp to guide you through setup.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="https://wa.me/201011653619?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Masar%20Tech%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%AD%D9%88%D9%84%20%D9%85%D9%86%D8%B5%D8%A9%20WatsStore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition-all min-h-[44px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{dir === 'rtl' ? 'محادثة مباشرة عبر واتساب: 01011653619' : 'Chat via WhatsApp: 01011653619'}</span>
              </a>

              <a
                href="tel:01011653619"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{dir === 'rtl' ? 'اتصال مباشر: 01011653619' : 'Call: 01011653619'}</span>
              </a>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black">
              {t('home.cta_title', undefined, 'جاهز لتجربة أسرع متجر واتساب في مصر؟')}
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
              {t('home.cta_sub', undefined, 'سجل متجرك الآن في دقيقتين وابدأ تجربة مجانية كاملة لمدة 14 يوماً بدون بطاقة بنكية.')}
            </p>
            <div>
              <Link prefetch={false}
                href="/register"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-base rounded-2xl shadow-xl transition-all hover:scale-105 min-h-[48px]"
              >
                <span>{t('home.cta_button', undefined, 'ابدأ تجربتك المجانية (14 يوماً)')}</span>
                <ArrowIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
