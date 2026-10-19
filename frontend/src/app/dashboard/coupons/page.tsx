'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StoreCoupon } from '@/types';
import Swal from 'sweetalert2';
import { 
  Tag, 
  CheckCircle2, 
  Trash2, 
  Percent, 
  Coins, 
  Calendar, 
  Plus, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Power, 
  AlertCircle,
  X,
  Users
} from 'lucide-react';

export default function DashboardCouponsPage() {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'Percentage' | 'FixedAmount'>('Percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    try {
      const data = await api.getMerchantCoupons(token);
      setCoupons(data);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل كوبونات الخصم',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: StoreCoupon) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setActionLoadingId(coupon.id);
    try {
      const updated = await api.toggleCouponStatus(token, coupon.id);
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: updated.isActive } : c));

      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        icon: 'success',
        title: updated.isActive ? `تم تفعيل الكوبون ${coupon.code}` : `تم إيقاف الكوبون ${coupon.code}`,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تغيير حالة الكوبون',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCoupon = async (coupon: StoreCoupon) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    const result = await Swal.fire({
      title: 'هل أنت متأكد من حذف الكوبون؟',
      text: `سيتم حذف الكود (${coupon.code}) ولن يتمكن العملاء من استخدامه مجدداً.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف الكوبون',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setActionLoadingId(coupon.id);
    try {
      await api.deleteMerchantCoupon(token, coupon.id);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));

      Swal.fire({
        icon: 'success',
        title: 'تم الحذف',
        text: 'تم حذف كوبون الخصم بنجاح',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في حذف الكوبون',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('يرجى إدخال كود الخصم');
      return;
    }

    const val = parseFloat(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('يرجى إدخال قيمة خصم صحيحة أكبر من الصفر');
      return;
    }

    if (formDiscountType === 'Percentage' && val > 100) {
      setFormError('نسبة الخصم المئوية لا يمكن أن تتجاوز 100%');
      return;
    }

    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setIsSubmitting(true);
    try {
      const newCoupon = await api.createMerchantCoupon(token, {
        code: cleanCode,
        discountType: formDiscountType,
        discountValue: val,
        usageLimit: formUsageLimit ? parseInt(formUsageLimit, 10) : undefined,
        expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
        isActive: formIsActive
      });

      setCoupons(prev => [newCoupon, ...prev]);
      setIsModalOpen(false);

      // Reset form
      setFormCode('');
      setFormDiscountValue('');
      setFormUsageLimit('');
      setFormExpiryDate('');
      setFormIsActive(true);

      Swal.fire({
        icon: 'success',
        title: 'تم إنشاء الكوبون بنجاح 🎉',
        text: `الكود ${newCoupon.code} أصبح متاحاً الآن لعملائك في المتجر`,
        confirmButtonColor: '#10B981',
      });
    } catch (err: any) {
      setFormError(err.message || 'فشل في إنشاء الكوبون، قد يكون الكود مستخدماً بالفعل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => {
    if (activeTab === 'active' && !c.isActive) return false;
    if (activeTab === 'inactive' && c.isActive) return false;
    if (searchQuery.trim() && !c.code.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalCoupons = coupons.length;
  const activeCouponsCount = coupons.filter(c => c.isActive).length;
  const totalTimesUsed = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Tag className="w-7 h-7 text-emerald-600" />
            <span>كوبونات الخصم والعروض الترويجية</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            أنشئ أكواد خصم ترويجية لجذب عملاء جدد ومضاعفة مبيعات متجرك على واتساب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsLoading(true); fetchCoupons(); }}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء كود خصم جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الكوبونات</span>
            <span className="text-2xl font-black text-slate-800">{totalCoupons}</span>
            <span className="text-xs text-slate-400 block mt-1">كود خصم مسجل</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">الكوبونات الفعالة</span>
            <span className="text-2xl font-black text-emerald-600">{activeCouponsCount}</span>
            <span className="text-xs text-emerald-600/80 block mt-1">جاهزة للاستخدام بالمتجر</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي مرات الاستخدام</span>
            <span className="text-2xl font-black text-indigo-600">{totalTimesUsed}</span>
            <span className="text-xs text-slate-400 block mt-1">طلب استفاد من الخصم</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({totalCoupons})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            المفعلة ({activeCouponsCount})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'inactive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            المعطلة ({totalCoupons - activeCouponsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بكود الخصم..."
            className="w-full text-xs font-medium pr-9 pl-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Coupons Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل كوبونات الخصم...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">لا توجد كوبونات خصم حالياً</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery.trim()
              ? `لا توجد نتائج مطابقة لبحثك "${searchQuery}".`
              : 'قم بإنشاء كود خصم ترويجي مثل (EID2026 أو WELCOME) وشاركه مع عملائك على وسائل التواصل.'}
          </p>
          {!searchQuery.trim() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أول كود خصم</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">كود الخصم</th>
                  <th className="p-4">نوع وقيمة الخصم</th>
                  <th className="p-4">مرات الاستخدام</th>
                  <th className="p-4">تاريخ الانتهاء</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                  const isMaxReached = coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="p-4 font-bold text-slate-800">
                        {coupon.discountType === 'Percentage' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Percent className="w-3.5 h-3.5" />
                            <span>خصم {coupon.discountValue}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            <Coins className="w-3.5 h-3.5" />
                            <span>خصم {coupon.discountValue} ج.م</span>
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">
                            {coupon.timesUsed} {coupon.usageLimit ? `من ${coupon.usageLimit}` : 'استخدام'}
                          </div>
                          {coupon.usageLimit ? (
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${isMaxReached ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (coupon.timesUsed / coupon.usageLimit) * 100)}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">غير محدود</span>
                          )}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="p-4 text-slate-600">
                        {coupon.expiryDate ? (
                          <div className="space-y-0.5">
                            <span className={`block font-medium ${isExpired ? 'text-rose-600 line-through' : 'text-slate-700'}`}>
                              {new Date(coupon.expiryDate).toLocaleDateString('ar-EG')}
                            </span>
                            {isExpired && (
                              <span className="text-[10px] text-rose-500 font-bold block">منتهي الصلاحية</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">صالح دائماً</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {coupon.isActive ? (
                          isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              منتهي الصلاحية
                            </span>
                          ) : isMaxReached ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              نفد الحد الأقصى
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              نشط ومفعل
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={actionLoadingId === coupon.id}
                            className={`p-2 rounded-xl border transition-all ${
                              coupon.isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={coupon.isActive ? 'تعطيل الكوبون' : 'تفعيل الكوبون'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            disabled={actionLoadingId === coupon.id}
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                            title="حذف الكوبون"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-200 dark:border-emerald-800">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">إنشاء كود خصم جديد</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">حدد رمز الكوبون، نوع الخصم، وشروط الاستخدام</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  كود الخصم (Promo Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="مثال: MASAR10 أو EID2026 أو SAVE50"
                  className="w-full text-sm font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase tracking-wider"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  سيقوم العميل بكتابة هذا الرمز في سلة الشراء لتفعيل الخصم.
                </span>
              </div>

              {/* Discount Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormDiscountType('Percentage')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formDiscountType === 'Percentage'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>نسبة مئوية (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormDiscountType('FixedAmount')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formDiscountType === 'FixedAmount'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>مبلغ ثابت (ج.م)</span>
                </button>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  قيمة الخصم {formDiscountType === 'Percentage' ? '(%)' : '(ج.م)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max={formDiscountType === 'Percentage' ? '100' : undefined}
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  placeholder={formDiscountType === 'Percentage' ? 'مثال: 10 أو 20' : 'مثال: 50 أو 100'}
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Usage Limit & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الحد الأقصى للاستخدام (اختياري)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="اتركه فارغاً لغير محدود"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    تاريخ انتهاء الكوبون (اختياري)
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Is Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تفعيل كود الخصم فوراً في المتجر</span>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{isSubmitting ? 'جاري الإنشاء...' : 'حفظ ونشر الكود 🚀'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
