'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  Settings, 
  Store as StoreIcon, 
  MapPin, 
  Phone, 
  DollarSign, 
  Palette, 
  Search, 
  BarChart3, 
  Save, 
  Check, 
  Sparkles,
  ShieldAlert
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

export default function DashboardSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [planType, setPlanType] = useState('Free');

  const [formData, setFormData] = useState({
    storeName: '',
    whatsAppNumber: '',
    businessCategory: 'ملابس وأزياء',
    city: 'الفيوم',
    addressDetails: '',
    logoUrl: '',
    coverUrl: '',
    themeColor: '#10B981',
    currency: 'ج.م',
    deliveryFee: 0,
    seoTitle: '',
    seoDescription: '',
    metaPixelId: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('watsstore_token');
      if (!token) return;

      try {
        const summary = await api.getDashboardSummary(token);
        const s = summary.storeInfo;
        setPlanType(s.planType || 'Free');
        setFormData({
          storeName: s.storeName || '',
          whatsAppNumber: s.whatsAppNumber || '',
          businessCategory: s.businessCategory || 'ملابس وأزياء',
          city: s.city || 'الفيوم',
          addressDetails: s.addressDetails || '',
          logoUrl: s.logoUrl || '',
          coverUrl: s.coverUrl || '',
          themeColor: s.themeColor || '#10B981',
          currency: s.currency || 'ج.م',
          deliveryFee: s.deliveryFee || 0,
          seoTitle: s.seoTitle || '',
          seoDescription: s.seoDescription || '',
          metaPixelId: s.metaPixelId || '',
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.message || 'فشل في تحميل الإعدادات',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setIsSaving(true);
    try {
      await api.updateStoreSettings(token, {
        ...formData,
        deliveryFee: Number(formData.deliveryFee) || 0,
      });

      // Update stored user if storeName changed
      const storedUser = localStorage.getItem('watsstore_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          parsed.storeName = formData.storeName;
          parsed.whatsAppNumber = formData.whatsAppNumber;
          parsed.themeColor = formData.themeColor;
          localStorage.setItem('watsstore_user', JSON.stringify(parsed));
        } catch {}
      }

      Swal.fire({
        icon: 'success',
        title: 'تم حفظ التعديلات بنجاح 🎉',
        text: 'تم تحديث بيانات المتجر والإعدادات والبيكسل مباشرة.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في حفظ الإعدادات',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">إعدادات المتجر وهوية العلامة التجارية</h1>
        <p className="text-xs text-slate-500 mt-1">
          قم بتخصيص معلومات متجرك، رسوم التوصيل، بيانات سيو جوجل، وتتبع إعلانات ميتا بيكسل.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Store Basic Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <StoreIcon className="w-4 h-4 text-emerald-600" />
            <span>بيانات المتجر الأساسية</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المتجر *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الواتساب لاستقبال الطلبات *</label>
              <input
                type="tel"
                required
                value={formData.whatsAppNumber}
                onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                placeholder="010xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المحافظة / المدينة *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white"
              >
                {EGYPT_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تصنيف النشاط *</label>
              <select
                value={formData.businessCategory}
                onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white"
              >
                {BUSINESS_CATEGORIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={formData.addressDetails}
                onChange={(e) => setFormData({ ...formData, addressDetails: e.target.value })}
                placeholder="اسم الشارع، رقم العمارة أو علامة مميزة"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Delivery & Appearance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>المظهر ورسوم التوصيل</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">رسوم التوصيل الافتراضية (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">اكتب 0 إذا كان التوصيل مجاني</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عملة المتجر</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">لون هوية المتجر (Theme Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-700"
                />
              </div>
            </div>

            <div className="sm:col-span-1.5">
              <label className="block font-bold text-slate-700 mb-1">رابط لوجو المتجر (URL)</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-1.5">
              <label className="block font-bold text-slate-700 mb-1">رابط غلاف المتجر Cover (URL)</label>
              <input
                type="url"
                value={formData.coverUrl}
                onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Google SEO Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>تهيئة محركات البحث (Google SEO)</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان المتجر في جوجل (SEO Title)</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="مثال: بوتيك الأناقة | أجمل الفساتين والعبايات في الفيوم"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">وصف المتجر في جوجل (Meta Description)</label>
              <textarea
                rows={2}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="اكتب نبذة توضح ما يقدمه متجرك لمساعدة الزبائن في العثور عليك في جوجل..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Meta Pixel ID (Facebook & Instagram Ads) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>معرّف ميتا بيكسل (Meta Pixel ID) لإعلانات فيسبوك وإنستغرام</span>
            </h2>

            {planType === 'Free' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                متاح في باقة Pro و VIP 🔒
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                مفعل بحسابك ({planType}) ✨
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-500 leading-relaxed">
              ضع معرف البيكسل الخاص بحسابك الإعلاني على Meta (مكون من 15-16 رقم) ليتم تتبع أحداث{' '}
              <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">ViewContent</code> و{' '}
              <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">AddToCart</code> و{' '}
              <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">Purchase</code> تلقائياً عند طلب العميل.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Meta Pixel ID</label>
              <input
                type="text"
                value={formData.metaPixelId}
                onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                placeholder="مثال: 987654321012345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات الآن'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
