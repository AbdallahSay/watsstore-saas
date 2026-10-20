'use client';

import { appSwal } from '@/lib/sweetalert';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { pixel } from '@/lib/pixel';
import Swal from 'sweetalert2';
import { 
  Store as StoreIcon, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Tag, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

const EGYPT_CITIES = [
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
  'البحيرة',
  'بني سويف',
  'بورسعيد',
  'السويس',
  'الإسماعيلية',
];

const BUSINESS_CATEGORIES = [
  'ملابس وأزياء',
  'مطاعم وأكلات',
  'حلويات ومخبوزات',
  'عطور ومستحضرات تجميل',
  'إكسسوارات وهدايا',
  'أحذية وحقائب',
  'إلكترونيات وموبايل',
  'سوبر ماركت وأغذية',
  'صيدلية ومنتجات عناية',
  'أخرى',
];

export default function RegisterPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isRtl = dir === 'rtl';

  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    storeName: '',
    whatsAppNumber: '',
    businessCategory: 'ملابس وأزياء',
    city: 'الفيوم',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Egyptian mobile number format
    const cleanPhone = formData.whatsAppNumber.replace(/[\s\-\+]/g, '');
    const isEgyptianPhone = /^(01[0125]\d{8}|201[0125]\d{8})$/.test(cleanPhone);
    if (!isEgyptianPhone) {
      setErrorMsg(isRtl ? 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678 أو 201012345678)' : 'Please enter a valid Egyptian mobile number (e.g., 01012345678)');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.register(formData);

      // Fire Lead / Registration event on platform pixel
      const platformPixelId = process.env.NEXT_PUBLIC_PLATFORM_META_PIXEL_ID;
      if (platformPixelId) {
        pixel.lead(platformPixelId, {
          store_name: res.storeName,
          city: res.city,
        });
      }

      // Store credentials in localStorage (isolated merchant session)
      localStorage.setItem('watsstore_token', res.token);
      localStorage.setItem('watsstore_merchant_token', res.token);
      localStorage.setItem('watsstore_user', JSON.stringify(res));

      await appSwal.fire({
        icon: 'success',
        title: t('auth.register_success', undefined, 'مبروك! تم إنشاء متجرك بنجاح 🎉'),
        html: `
          <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'};">
            <p><strong>${t('auth.store_name', undefined, 'اسم المتجر')}:</strong> ${res.storeName}</p>
            <p><strong>${isRtl ? 'رابط متجرك:' : 'Store URL:'}</strong> /s/${res.slug}</p>
            <p><strong>${isRtl ? 'رمز QR الدائم:' : 'Permanent QR:'}</strong> /m/${res.publicCode}</p>
            <p style="color: #059669; margin-top: 10px;">${isRtl ? 'تم إضافة قسم تجريبي "الأكثر مبيعاً" تلقائياً لتبدأ فوراً بإضافة منتجاتك.' : 'A sample category has been created so you can start adding products right away.'}</p>
          </div>
        `,
        confirmButtonText: t('auth.goto_dashboard', undefined, 'الانتقال إلى لوحة التحكم 🚀'),
        confirmButtonColor: '#10B981',
      });

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء إنشاء الحساب' : 'An error occurred during registration'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Top Floating Utility Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t('nav.home', undefined, 'الرئيسية')}</span>
        </Link>
        <ThemeLanguageBar variant="navbar" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-6">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            WatsStore
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('auth.register_title', undefined, 'ابدأ فترتك التجريبية المجانية (14 يوماً)')}
        </h2>
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          {t('auth.register_badge', undefined, 'بدون بطاقة بنكية — تجربة كاملة لكافة المميزات لمدة أسبوعين')}
        </p>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {t('auth.already_have_account', undefined, 'لديك حساب بالفعل؟')}{' '}
          <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
            {t('auth.login_here', undefined, 'تسجيل الدخول هنا')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800 transition-colors">
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.owner_name', undefined, 'اسم صاحب المتجر *')}
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder={t('auth.owner_name_placeholder', undefined, 'مثال: أحمد محمود')}
                    className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.store_name', undefined, 'اسم المتجر / البراند *')}
                </label>
                <div className="relative">
                  <StoreIcon className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder={t('auth.store_name_placeholder', undefined, 'مثال: براند الأناقة')}
                    className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  />
                </div>
                {formData.storeName && (
                  <p className="mt-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>{isRtl ? 'رابط متجرك المتوقع:' : 'Predicted URL:'}</span>
                    <span className="font-bold underline" dir="ltr">
                      watsstore.com/s/{encodeURIComponent(formData.storeName.trim().toLowerCase().replace(/\s+/g, '-'))}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.email', undefined, 'البريد الإلكتروني *')}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="merchant@example.com"
                    className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.password', undefined, 'كلمة المرور *')}
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('auth.password_min', undefined, '6 أحرف على الأقل')}
                    className={`w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.whatsapp', undefined, 'رقم الواتساب لاستقبال الطلبات *')}
              </label>
              <div className="relative">
                <Phone className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                <input
                  type="tel"
                  required
                  value={formData.whatsAppNumber}
                  onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                  placeholder={t('auth.whatsapp_placeholder', undefined, 'مثال: 01012345678 أو 201012345678')}
                  className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.city', undefined, 'المحافظة / المدينة *')}
                </label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  >
                    {EGYPT_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.category', undefined, 'نوع النشاط التجاري *')}
                </label>
                <div className="relative">
                  <Tag className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                  <select
                    value={formData.businessCategory}
                    onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                    className={`w-full ${isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
                  >
                    {BUSINESS_CATEGORIES.map((b) => (
                      <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{isLoading ? t('auth.registering', undefined, 'جاري إنشاء المتجر...') : t('auth.register_button', undefined, 'بدء التجربة المجانية (14 يوماً) 🚀')}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
