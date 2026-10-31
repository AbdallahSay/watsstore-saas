'use client';

import { appSwal } from '@/lib/sweetalert';
import { useEffect, useState, useRef } from 'react';
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
  ShieldAlert,
  Upload,
  Loader2,
  Wallet,
  Building2,
  Lock,
  Crown,
  Copy
} from 'lucide-react';
import { platformConfig } from '@/config/platformConfig';

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
  const [slug, setSlug] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

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
    vodafoneCashNumber: '',
    instaPayAddress: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('watsstore_token');
      if (!token) return;

      try {
        const summary = await api.getDashboardSummary(token);
        const s = summary.storeInfo;
        setPlanType(s.planType || 'Free');
        setSlug(s.slug || '');
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
          vodafoneCashNumber: s.vodafoneCashNumber || '',
          instaPayAddress: s.instaPayAddress || '',
        });
      } catch (err: any) {
        appSwal.fire({
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

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'cover') setUploadingCover(true);

    try {
      const res = await api.uploadImage(token, file);
      if (type === 'logo') {
        setFormData((prev) => ({ ...prev, logoUrl: res.imageUrl }));
      } else {
        setFormData((prev) => ({ ...prev, coverUrl: res.imageUrl }));
      }

      appSwal.fire({
        icon: 'success',
        title: 'تم رفع الصورة بنجاح! 📸',
        text: 'تم تحديث رابط الصورة، لا تنسَ الضغط على "حفظ التعديلات".',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'فشل رفع الصورة',
        text: err.message || 'يرجى التأكد من أن الصورة لا تتجاوز 5 ميجابايت وبصيغة JPG أو PNG أو WEBP',
      });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'cover') setUploadingCover(false);
    }
  };

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

      appSwal.fire({
        icon: 'success',
        title: 'تم حفظ التعديلات بنجاح 🎉',
        text: 'تم تحديث بيانات المتجر والإعدادات ووسائل الدفع مباشرة.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في حفظ الإعدادات',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openUpgradeWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً Masar Tech، أرغب في ترقية باقة متجري (${formData.storeName || slug}) إلى باقة Pro لتفعيل Meta Pixel والمنتجات غير المحدودة.`
    );
    window.open(`https://wa.me/${platformConfig.supportWhatsApp}?text=${text}`, '_blank');
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
      {slug && <section aria-label="معاينة التصميمات الجديدة" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">تصميمات المتجر الجديدة</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">عاين 3 تصميمات مختلفة باستخدام منتجات متجرك الحقيقية. المعاينة لا تغيّر إعدادات متجرك المنشور.</p>
          </div>
          <a href={`/theme-preview/${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer"
             className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            جرّب الثيمات الثلاثة
          </a>
        </div>
      </section>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إعدادات المتجر وهوية العلامة التجارية</h1>
          <p className="text-xs text-slate-500 mt-1">
            خصص معلومات متجرك، وسائل الدفع الإلكتروني (كاش وإنستاباي)، وتتبع إعلانات ميتا بيكسل.
          </p>
        </div>

        {planType === 'Free' && (
          <button
            type="button"
            onClick={openUpgradeWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Crown className="w-4 h-4" />
            <span>ترقية باقة المتجر (Pro / VIP)</span>
          </button>
        )}
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
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المتجر *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الواتساب لاستقبال الطلبات *</label>
              <input
                type="tel"
                required
                value={formData.whatsAppNumber}
                onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                placeholder="010xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المحافظة / المدينة *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {EGYPT_CITIES.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تصنيف النشاط *</label>
              <select
                value={formData.businessCategory}
                onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {BUSINESS_CATEGORIES.map((b) => (
                  <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{b}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={formData.addressDetails}
                onChange={(e) => setFormData({ ...formData, addressDetails: e.target.value })}
                placeholder="اسم الشارع، رقم العمارة أو علامة مميزة"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Delivery, Appearance & Direct Image Uploads */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>المظهر، رسوم التوصيل، وصور المتجر</span>
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

            {/* Logo Upload & URL */}
            <div className="sm:col-span-1.5 space-y-2">
              <label className="block font-bold text-slate-700 mb-1">شعار المتجر (Logo)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="رابط الشعار أو ارفعه مباشرة..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'logo');
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => logoFileInputRef.current?.click()}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap border border-slate-200"
                  title="رفع ملف من جهازك"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>رفع صورة</span>
                </button>
              </div>
              {formData.logoUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={formData.logoUrl}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-500">معاينة الشعار الحالية</span>
                </div>
              )}
            </div>

            {/* Cover Upload & URL */}
            <div className="sm:col-span-1.5 space-y-2">
              <label className="block font-bold text-slate-700 mb-1">غلاف المتجر (Cover Banner)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="رابط الغلاف أو ارفعه مباشرة..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="file"
                  ref={coverFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'cover');
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap border border-slate-200"
                  title="رفع ملف من جهازك"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>رفع صورة</span>
                </button>
              </div>
              {formData.coverUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={formData.coverUrl}
                    alt="Cover Preview"
                    className="h-10 w-24 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-500">معاينة الغلاف الحالية</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Electronic Wallets & InstaPay (Egyptian Payment Methods) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>وسائل الدفع الإلكتروني والتحويل (فودافون كاش & إنستاباي)</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              مدعوم لجميع التجار 🇪🇬
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            عند تفعيل هذه الحقول، ستظهر للزبائن خيارات الدفع بمحفظة فودافون كاش أو إنستاباي أثناء إتمام الطلب، مع زر لنسخ رقمك فوراً وملاحظة لإرسال لقطة شاشة لإشعار التحويل في واتساب.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-600" />
                <span>رقم محفظة الجوال (فودافون كاش / أورنج / إتصالات)</span>
              </label>
              <input
                type="tel"
                value={formData.vodafoneCashNumber}
                onChange={(e) => setFormData({ ...formData, vodafoneCashNumber: e.target.value })}
                placeholder="مثال: 01012345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">اتركه فارغاً إذا كنت تفضل الدفع عند الاستلام فقط</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>عنوان أو رقم إنستاباي (InstaPay Address / Number)</span>
              </label>
              <input
                type="text"
                value={formData.instaPayAddress}
                onChange={(e) => setFormData({ ...formData, instaPayAddress: e.target.value })}
                placeholder="مثال: yourname@instapay أو 01012345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">يظهر للزبائن للتحويل اللحظي عبر تطبيق InstaPay</span>
            </div>
          </div>
        </div>

        {/* Section 4: Google SEO Settings */}
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

        {/* Section 5: Meta Pixel ID (Facebook & Instagram Ads) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>معرّف ميتا بيكسل (Meta Pixel ID) لإعلانات فيسبوك وإنستغرام</span>
            </h2>

            {planType === 'Free' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-600" />
                <span>متاح في باقة Pro 👑</span>
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

            {planType === 'Free' ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>خاصية تتبع الحملات الإعلانية وميتا بيكسل مخصصة لباقات Pro و VIP</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  قم بترقية باقتك بسعر رمزي (149 ج.م/شهر) للحصول على تتبع كامل لتحويلات إعلانات فيسبوك وإنستغرام وإزالة علامة المنصة وإضافة منتجات غير محدودة.
                </p>
                <button
                  type="button"
                  onClick={openUpgradeWhatsApp}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  ترقية حسابك الآن إلى Pro عبر واتساب Masar Tech
                </button>
              </div>
            ) : (
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
            )}
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
