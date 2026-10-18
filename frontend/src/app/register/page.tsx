'use client';

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
  AlertCircle,
  Sparkles
} from 'lucide-react';

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
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    storeName: '',
    whatsAppNumber: '',
    businessCategory: 'ملابس وأزياء',
    city: 'الفيوم',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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

      // Store credentials in localStorage
      localStorage.setItem('watsstore_token', res.token);
      localStorage.setItem('watsstore_user', JSON.stringify(res));

      await Swal.fire({
        icon: 'success',
        title: 'مبروك! تم إنشاء متجرك بنجاح 🎉',
        html: `
          <div style="direction: rtl; text-align: right;">
            <p><strong>اسم المتجر:</strong> ${res.storeName}</p>
            <p><strong>رابط متجرك:</strong> /s/${res.slug}</p>
            <p><strong>رمز QR الدائم:</strong> /m/${res.publicCode}</p>
            <p style="color: #059669; margin-top: 10px;">تم إضافة قسم تجريبي "الأكثر مبيعاً" تلقائياً لتبدأ فوراً بإضافة منتجاتك.</p>
          </div>
        `,
        confirmButtonText: 'الانتقال إلى لوحة التحكم 🚀',
        confirmButtonColor: '#10B981',
      });

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            WatsStore
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          أنشئ متجرك المجاني في دقيقتين
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
            تسجيل الدخول هنا
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم صاحب المتجر *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="مثال: أحمد محمود"
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المتجر / البراند *
                </label>
                <div className="relative">
                  <StoreIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="مثال: براند الأناقة"
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="merchant@example.com"
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="6 أحرف على الأقل"
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم الواتساب لاستقبال الطلبات *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.whatsAppNumber}
                  onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                  placeholder="مثال: 01012345678 أو 201012345678"
                  className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المحافظة / المدينة *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {EGYPT_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع النشاط التجاري *
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formData.businessCategory}
                    onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {BUSINESS_CATEGORIES.map((b) => (
                      <option key={b} value={b}>
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
                <span>{isLoading ? 'جاري إنشاء المتجر...' : 'إنشاء المتجر الآن مجاناً 🚀'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
