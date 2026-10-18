'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShoppingBag, 
  MessageCircle, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Smartphone, 
  Search, 
  BarChart3,
  ExternalLink,
  X
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [pricing, setPricing] = useState({
    proMonthlyPrice: 299,
    proAnnualPrice: 2499,
    vipMonthlyPrice: 599,
    vipAnnualPrice: 4999,
    isLaunchDiscountBannerActive: true,
    launchDiscountText: "🔥 عرض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!",
  });
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    api.getPublicPricing()
      .then((data) => {
        if (data) {
          setPricing((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.warn('Using default pricing matrix fallback:', err));
  }, []);

  return (
    <>
      {/* Top Urgency & Scarcity Marketing Banner */}
      {showBanner && pricing.isLaunchDiscountBannerActive && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2.5 text-xs sm:text-sm font-black shadow-md flex items-center justify-between relative z-50 animate-fadeIn">
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{pricing.launchDiscountText || "🔥 عرض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!"}</span>
            <a href="#pricing" className="underline mr-2 text-amber-200 hover:text-white font-black transition-colors">
              اختر باقتك وسجل الآن ←
            </a>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="إغلاق الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 pt-16 pb-24 md:pt-24 md:pb-32">
          {/* Subtle decorative circles */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-8 border border-emerald-200/80 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>المنصة الأولى المخصصة للتجار وأصحاب المشاريع في مصر 🇪🇬</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
              حوّل محادثات الواتساب إلى{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                متجر إلكتروني ذكي
              </span>{' '}
              يبيع على مدار الساعة
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              أنشئ كتالوج منتجاتك في دقيقتين. زبائنك يختارون المقاسات والألوان، ويصلك طلب مرتب بفاتورة وإجمالي الحساب مباشرة على رقمك بالواتساب بدون عمولات خفية.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                <span>ابدأ تجربة مجانية لمدة 14 يوماً</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <Link
                href="/s/al-amal-fashion"
                target="_blank"
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base rounded-2xl border border-slate-300 shadow-sm flex items-center justify-center gap-2.5 transition-all hover:border-slate-400"
              >
                <span>شاهد متجر تجريبي حي ⚡</span>
                <ExternalLink className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>بدون بطاقة بنكية للتسجيل</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>متوافق 100% مع الجوال والموبايل</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ربط مباشر لبيكسل ميتا (Facebook & Instagram Ads)</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs sm:text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">
                لماذا يفضل تجار مصر WatsStore؟
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                كل ما تحتاجه لمضاعفة مبيعاتك عبر واتساب بدون تعقيدات المتاجر التقليدية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">طلبات منظمة على الواتساب</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  وداعاً لرسائل &quot;بكام ده؟&quot; العشوائية. يستلم التاجر رسالة مفصلة برقم الطلب، أصناف المنتجات، المقاسات، الألوان، العنوان بالتفصيل، والإجمالي المستحق.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">ربط Meta Pixel المزدوج</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  تتبع دقيق لإعلانات فيسبوك وإنستغرام عبر تفعيل أحداث ViewContent وAddToCart وPurchase لحظة إتمام الطلب، لتحسين حملاتك الإعلانية بأعلى عائد ROAS.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">SEO محلي ومحافظات مصر</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  تهيئة تلقائية لنتائج بحث جوجل (SSR + JSON-LD Schema + خريطة موقع Sitemap) وظهور قوي في دليل المتاجر حسب محافظتك (القاهرة، الفيوم، الجيزة، الإسكندرية...).
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">سرعة فائقة وخفة</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  واجهة عصرية بتصميم Next.js فائق الخفة يفتح فوراً لعميلك حتى مع باقات الإنترنت الضعيفة، لتقليل نسبة الارتداد وزيادة معدل التحويل.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">رمز QR دائم وقصير</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  احصل على رابط قصير ورمز QR خاص بمتجرك لا يتغير لطباعته على الأكياس، كروت العمل، أو واجهة المحل ليدخل الزبون للمنيو مباشرة.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">إحصائيات وأرشفة كاملة</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  لوحة تحكم سهلة تسجل جميع طلباتك في قاعدة بيانات SQL مع إجمالي الإيرادات وسجل تفصيلي ببيانات العملاء لإعادة استهدافهم لاحقاً.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs sm:text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">
                باقات تناسب جميع أحجام الأنشطة
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                اختر الباقة المناسبة لمشروعك وابدأ بدون أي التزامات
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                جميع الباقات تشمل تجربة مجانية كاملة 14 يوماً بدون الحاجة لبطاقة بنكية
              </p>

              {/* Billing Cycle Switcher with Psychological Savings */}
              <div className="mt-8 inline-flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-md scale-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الاشتراك الشهري
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                    billingCycle === 'annual'
                      ? 'bg-emerald-600 text-white shadow-md scale-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>الاشتراك السنوي</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                    billingCycle === 'annual' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    وفر حتى 30% 🎁
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
              {/* FREE TRIAL */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">تجربة مجانية (14 يوماً)</h3>
                  <p className="text-xs text-slate-500 mt-1">جرب المنصة بكامل خصائصها قبل الاشتراك</p>
                  
                  <div className="mt-6 mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">0</span>
                      <span className="text-sm font-bold text-slate-600">ج.م / لمدة 14 يوماً</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">بدون بطاقة ائتمان أو عمولات مخفية</p>
                  </div>

                  <ul className="space-y-3.5 text-sm text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>حتى 10 منتجات خلال فترة التجربة</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>كوبون خصم واحد نشط لمتجرك</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <span className="text-xs">🔒</span>
                      <span className="line-through">كتابة الوصف بالذكاء الاصطناعي (متاح في Pro)</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <span className="text-xs">🔒</span>
                      <span className="line-through">تصدير تقارير الطلبات إلى Excel (متاح في Pro)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>طلبات واستفسارات غير محدودة عبر الواتساب</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>دعم متغيرات المنتجات والمحافظ الإلكترونية</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>رابط ورمز QR دائم لمتجرك ومطبوعاتك</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm text-center transition-colors block"
                >
                  ابدأ تجربتك المجانية (14 يوماً)
                </Link>
              </div>

              {/* PRO PLAN (DECOY & HERO POPULAR) */}
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl relative ring-4 ring-emerald-500/10 flex flex-col justify-between transform md:-translate-y-2 transition-all">
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-300/40 tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>الأكثر طلباً للتجار ⭐ (أفضل قيمة واستثمار)</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">باقة المحترفين Pro</h3>
                  <p className="text-xs text-slate-500 mt-1">للمتاجر الراغبة في التوسع ومضاعفة المبيعات</p>
                  
                  {billingCycle === 'annual' ? (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-emerald-600">{pricing.proAnnualPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-600">ج.م / سنوياً</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          وفر 1,089 ج.م (شهران مجاناً) 🎁
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (~{Math.round(pricing.proAnnualPrice / 12)} ج.م/شهرياً)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-emerald-600">{pricing.proMonthlyPrice}</span>
                        <span className="text-sm font-bold text-slate-600">ج.م / شهرياً</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">تجديد شهري مرن، يمكنك الإلغاء بأي وقت</p>
                    </div>
                  )}

                  <ul className="space-y-3.5 text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-800">حتى 100 منتج و 15 كوبون خصم نشط</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">✨ 15 وصف بالذكاء الاصطناعي شهرياً 🤖</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">📊 تصدير الطلبات وتقارير المبيعات لـ Excel</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">تفعيل Meta Pixel لتتبع إعلانات فيسبوك وإنستغرام</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>إزالة شارة المنصة بالكامل لعلامة تجارية خاصة</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>لوحة تحكم إحصائيات المبيعات والمنتجات الأكثر طلباً</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>دعم فني وتدريب سريع ومباشر على الواتساب</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm text-center shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] block"
                >
                  اشترك في باقة Pro {billingCycle === 'annual' ? `(${pricing.proAnnualPrice.toLocaleString()} ج.م/سنوياً)` : `(${pricing.proMonthlyPrice} ج.م/شهرياً)`}
                </Link>
              </div>

              {/* VIP PLAN */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">باقة كبار التجار VIP 👑</h3>
                  <p className="text-xs text-slate-500 mt-1">للعلامات التجارية الكبرى والمتاجر الرائدة</p>
                  
                  {billingCycle === 'annual' ? (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900">{pricing.vipAnnualPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-600">ج.م / سنوياً</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          وفر 2,189 ج.م سنوياً 👑
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (~{Math.round(pricing.vipAnnualPrice / 12)} ج.م/شهرياً)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900">{pricing.vipMonthlyPrice}</span>
                        <span className="text-sm font-bold text-slate-600">ج.م / شهرياً</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">شامل كافة مميزات المنصة والدعم المخصص</p>
                    </div>
                  )}

                  <ul className="space-y-3.5 text-sm text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900">منتجات غير محدودة وكوبونات غير محدودة 🚀</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">💎 150 وصفاً ذكياً بالذكاء الاصطناعي شهرياً</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">📊 تصدير الطلبات وتقارير المبيعات لـ Excel</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">دعم النطاق الخاص الكامل (Custom Domain)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>جميع مميزات باقة Pro بالكامل</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>مدير حساب مخصص وأولوية قصوى في الدعم الفني</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm text-center transition-colors block"
                >
                  انضم إلى باقة VIP {billingCycle === 'annual' ? `(${pricing.vipAnnualPrice.toLocaleString()} ج.م/سنوياً)` : `(${pricing.vipMonthlyPrice} ج.م/شهرياً)`}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black">
              جاهز لتجربة أسرع متجر واتساب في مصر؟
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
              سجل متجرك الآن في دقيقتين وابدأ تجربة مجانية كاملة لمدة 14 يوماً بدون بطاقة بنكية.
            </p>
            <div>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-base rounded-2xl shadow-xl transition-all hover:scale-105"
              >
                <span>ابدأ تجربتك المجانية (14 يوماً)</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
