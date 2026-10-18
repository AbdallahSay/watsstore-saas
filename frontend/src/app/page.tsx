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
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
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
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs sm:text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">
                باقات تناسب جميع أحجام الأنشطة
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                اختر الباقة المناسبة لمشروعك وابدأ بدون أي التزامات
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* FREE TRIAL */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">تجربة مجانية (14 يوماً)</h3>
                  <p className="text-xs text-slate-500 mt-1">جرب المنصة بكامل خصائصها قبل الاشتراك</p>
                  <div className="mt-6 mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">0</span>
                    <span className="text-sm font-bold text-slate-600">ج.م / لمدة 14 يوماً</span>
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
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">ذكاء اصطناعي لكتابة وصف المنتجات (غير محدود) 🤖</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>طلبات واستفسارات غير محدودة عبر الواتساب</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>دعم متغيرات المنتجات (المقاسات والألوان)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>دعم المحافظ الإلكترونية وإنستاباي 📱</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>رابط ورمز QR لمتجرك ومطبوعاتك</span>
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

              {/* PRO PLAN (POPULAR) */}
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl relative flex flex-col justify-between">
                <span className="absolute -top-3.5 right-8 bg-emerald-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-md">
                  الأكثر طلباً للتجار ⭐
                </span>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">باقة المحترفين Pro</h3>
                  <p className="text-xs text-slate-500 mt-1">للمتاجر الراغبة في التوسع وإطلاق الإعلانات الممولة</p>
                  <div className="mt-6 mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-emerald-600">149</span>
                    <span className="text-sm font-bold text-slate-600">ج.م / شهرياً</span>
                  </div>

                  <ul className="space-y-3.5 text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-800">حتى 100 منتج و 20 كوبون خصم</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-700">ذكاء اصطناعي لكتابة وصف المنتجات (غير محدود) 🤖</span>
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
                      <span>لوحة تحكم إحصائيات المبيعات والطلبات</span>
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
                  اشترك في باقة Pro (149 ج.م)
                </Link>
              </div>

              {/* VIP PLAN */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">باقة النخبة VIP</h3>
                  <p className="text-xs text-slate-500 mt-1">للعلامات التجارية الكبرى والمتاجر الرائدة</p>
                  <div className="mt-6 mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">299</span>
                    <span className="text-sm font-bold text-slate-600">ج.م / شهرياً</span>
                  </div>

                  <ul className="space-y-3.5 text-sm text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>جميع مميزات باقة Pro بالكامل</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">دعم النطاق الخاص (Custom Domain)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>مدير حساب مخصص لمساعدتك في إدخال المنتجات</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>استشارات تسويقية وحملات لزيادة مبيعاتك</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm text-center transition-colors block"
                >
                  انضم إلى باقة VIP (299 ج.م)
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
