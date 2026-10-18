'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { 
  CreditCard, 
  Crown, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap, 
  Receipt, 
  ShieldCheck, 
  Smartphone, 
  Building2,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { MerchantBillingStatus, SubscriptionRequestItem, PlatformPricingSettings } from '@/types';

export default function MerchantBillingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<MerchantBillingStatus | null>(null);
  const [pricing, setPricing] = useState<PlatformPricingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upgrade Plan selection states
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Annual'>('Annual');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'VIP'>('Pro');
  const [paymentMethod, setPaymentMethod] = useState<'VodafoneCash' | 'InstaPay' | 'OnlineCard'>('VodafoneCash');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const loadBillingData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const [billingRes, pricingRes] = await Promise.all([
        api.getMerchantBillingStatus(authToken),
        api.getPublicPricing().catch(() => null)
      ]);
      setStatus(billingRes);
      if (pricingRes) {
        setPricing(pricingRes);
      }
    } catch (err: any) {
      console.error('Failed to load billing status:', err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ في جلب بيانات الفوترة',
        text: err.message || 'تعذر تحميل بيانات الاشتراك والفوترة',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('watsstore_token');
    if (savedToken) {
      setToken(savedToken);
      loadBillingData(savedToken);
    } else {
      setIsLoading(false);
    }
  }, [loadBillingData]);

  const copyToClipboard = (text: string, type: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(type);
      setTimeout(() => setIsCopied(null), 2500);

      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        background: '#0f172a',
        color: '#f8fafc',
      });
      toast.fire({
        icon: 'success',
        title: `تم نسخ ${type === 'vodafone' ? 'رقم محفظة فودافون كاش' : 'عنوان إنستاباي'} بنجاح!`,
      });
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!transactionId.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'رقم العملية مطلوب',
        text: 'يرجى إدخال رقم العملية أو كود الحوالة التأكيدي للتحقق من الدفع.',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitMerchantUpgradeRequest(token, {
        planType: selectedPlan,
        billingCycle,
        paymentMethod,
        transactionId: transactionId.trim(),
        notes: notes.trim() || undefined
      });

      if (paymentMethod === 'OnlineCard' || res.status === 'Approved') {
        Swal.fire({
          icon: 'success',
          title: 'تم تفعيل وترقية الباقة بنجاح! 🎉',
          text: res.message || 'تم اعتماد الدفع الإلكتروني وتفعيل باقتك فوراً.',
          confirmButtonColor: '#10B981',
          background: '#0f172a',
          color: '#f8fafc',
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'تم إرسال طلب الترقية بنجاح! ⏳',
          text: 'طلبك قيد المراجعة حالياً من قبل الإدارة، وسيتم تفعيل الباقة وتأكيد التحويل خلال دقائق.',
          confirmButtonColor: '#10B981',
          background: '#0f172a',
          color: '#f8fafc',
        });
      }

      setTransactionId('');
      setNotes('');
      // Reload billing data
      await loadBillingData(token);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'فشل إرسال الطلب',
        text: err.message || 'حدث خطأ أثناء تسجيل طلب الترقية',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-400">جاري تحميل بيانات الفوترة والاشتراك...</span>
      </div>
    );
  }

  // Calculate pricing based on current settings
  const proMonthly = pricing?.proMonthlyPrice ?? 299;
  const proAnnual = pricing?.proAnnualPrice ?? 2499;
  const vipMonthly = pricing?.vipMonthlyPrice ?? 599;
  const vipAnnual = pricing?.vipAnnualPrice ?? 4999;

  const currentAmount = selectedPlan === 'VIP'
    ? (billingCycle === 'Annual' ? vipAnnual : vipMonthly)
    : (billingCycle === 'Annual' ? proAnnual : proMonthly);

  const vodafoneWallet = status?.vodafoneCashWallet || pricing?.vodafoneCashWallet || '01027150123';
  const instapayHandle = status?.instaPayHandle || pricing?.instaPayHandle || 'watsstore@instapay';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-600 font-bold flex items-center gap-1">
              <span>لوحة التحكم</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">الفواتير والاشتراكات</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>إدارة الاشتراك والفوترة وبوابات الدفع</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تابع حالة باقتك الحالية، استهلك رصيد الذكاء الاصطناعي، وقم بالترقية عبر فودافون كاش أو إنستاباي.
          </p>
        </div>

        <button
          onClick={() => token && loadBillingData(token)}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          <span>تحديث الحالة</span>
        </button>
      </div>

      {/* 1. Active Pending Request Notice Banner (If Any) */}
      {status?.activePendingRequest && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 text-amber-900 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  قيد المراجعة والاعتماد
                </span>
                <span className="text-xs text-amber-700">
                  {new Date(status.activePendingRequest.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                </span>
              </div>
              <h3 className="text-base font-black">
                طلب ترقية إلى باقة {status.activePendingRequest.planType === 'VIP' ? 'كبار التجار (VIP)' : 'المحترفين (Pro)'} ({status.activePendingRequest.billingCycle === 'Annual' ? 'سنوي' : 'شهري'})
              </h3>
              <p className="text-xs text-amber-800">
                وسيلة الدفع: <span className="font-bold">{status.activePendingRequest.paymentMethod}</span> | رقم العملية: <span className="font-mono font-bold">{status.activePendingRequest.transactionId}</span> | المبلغ: <span className="font-bold">{status.activePendingRequest.amount} ج.م</span>
              </p>
            </div>
          </div>

          <div className="text-xs bg-white/70 border border-amber-200 px-3.5 py-2 rounded-2xl font-bold text-amber-900 self-stretch sm:self-auto text-center">
            سيتم تفعيل متجرك فور مطابقة الحوالة من قبل الإدارة
          </div>
        </div>
      )}

      {/* 2. Current Plan Overview Card */}
      {status && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">الباقة الحالية لمتجرك</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {status.planType === 'VIP' ? 'باقة كبار التجار (VIP 👑)' : status.planType === 'Pro' ? 'باقة المحترفين (Pro ⭐)' : 'تجربة مجانية (14 يوماً)'}
                  </h2>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    status.isTrialExpired
                      ? 'bg-rose-100 text-rose-700'
                      : status.planType === 'Free'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {status.isTrialExpired ? 'منتهية الصلاحية ⚠️' : 'نشطة وتعمل ✅'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-400 block font-bold">تاريخ انتهاء الصلاحية</span>
                <span className="text-xs sm:text-sm font-black text-slate-700 font-mono">
                  {status.planType === 'Free'
                    ? (status.trialEndsAt ? new Date(status.trialEndsAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : `${status.remainingTrialDays} أيام متبقية`)
                    : (status.subscriptionEndsAt ? new Date(status.subscriptionEndsAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : 'اشتراك مفتوح')}
                </span>
              </div>
            </div>
          </div>

          {/* AI Quota & Plan Limits Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Generations Progress */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>توليد وصف المنتجات بالذكاء الاصطناعي</span>
                </span>
                <span className="font-black text-slate-900">
                  {status.aiGenerationsUsed} / {status.aiGenerationsLimit}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    status.aiGenerationsLimit === 0 ? 'bg-slate-400 w-0' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: status.aiGenerationsLimit > 0
                      ? `${Math.min(100, (status.aiGenerationsUsed / status.aiGenerationsLimit) * 100)}%`
                      : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                {status.planType === 'Free' ? (
                  <span className="text-rose-600 font-bold">🔒 مقفل في الباقة المجانية (متاح في Pro و VIP)</span>
                ) : (
                  <span>متبقي <strong className="text-emerald-700">{status.remainingAiQuota}</strong> عملية توليد هذا الشهر</span>
                )}
              </div>
            </div>

            {/* Product Limit */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">سعة المنتجات بالمتجر</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">
                  {status.planType === 'VIP' ? 'غير محدود' : status.planType === 'Pro' ? '100' : '10'}
                </span>
                <span className="text-xs text-slate-500">منتج</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {status.planType === 'Free' ? 'قم بالترقية لإضافة حتى 100 منتج أو غير محدود' : 'سعة ممتازة لعرض تشكيلة كتالوج واسعة'}
              </span>
            </div>

            {/* Coupons & Features */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">كوبونات الخصم والتصدير</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">
                  {status.planType === 'VIP' ? 'غير محدود' : status.planType === 'Pro' ? '15' : '1'}
                </span>
                <span className="text-xs text-slate-500">كوبون نشط</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                تصدير إكسل: {status.planType === 'Free' ? '🔒 مغلق' : '✅ مفعل ومتاح'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Upgrade Section: Comparing Pro & VIP with Billing Switcher */}
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>طوّر متجرك وضاعف مبيعاتك وأرباحك</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            اختر الباقة المناسبة لحجم تجارتك
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            ترقية فورية بدون انقطاع لمتجرك مع دعم فني متواصل وحفظ كامل لمنتجاتك وطلباتك.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setBillingCycle('Monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                billingCycle === 'Monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دفع شهري
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('Annual')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                billingCycle === 'Annual'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>دفع سنوي</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                billingCycle === 'Annual' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-100 text-amber-800 font-bold'
              }`}>
                وفر 30% (شهران مجاناً) 🎁
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Pro Plan */}
          <div className={`bg-white border-2 rounded-3xl p-6 sm:p-8 space-y-6 transition-all relative flex flex-col justify-between ${
            selectedPlan === 'Pro' 
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20' 
              : 'border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  الأكثر طلباً للتجار ⭐ (Pro)
                </span>
                {selectedPlan === 'Pro' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">باقة المحترفين</h3>
                <p className="text-xs text-slate-500 mt-1">المثالية للتجار أصحاب المتاجر المتنامية وحملات السوشيال ميديا</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {billingCycle === 'Annual' ? proAnnual : proMonthly}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ج.م / {billingCycle === 'Annual' ? 'سنوياً' : 'شهرياً'}
                </span>
              </div>

              {billingCycle === 'Annual' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  وفرت 1,089 ج.م مقارنة بالدفع الشهري!
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100</strong> منتج كامل مع الصور والأقسام</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>15</strong> كوبون خصم ترويجي نشط</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>15</strong> وصف تسويقي شهرياً بالذكاء الاصطناعي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تصدير الطلبات والمبيعات لملفات <strong>Excel CSV</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دومين فرعي ورابط مخصص ورمز QR للمحل</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlan('Pro')}
              className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all mt-6 ${
                selectedPlan === 'Pro'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {selectedPlan === 'Pro' ? 'الباقة المحددة للترقية ✓' : 'اختيار باقة المحترفين'}
            </button>
          </div>

          {/* Card 2: VIP Plan */}
          <div className={`bg-white border-2 rounded-3xl p-6 sm:p-8 space-y-6 transition-all relative flex flex-col justify-between ${
            selectedPlan === 'VIP' 
              ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20' 
              : 'border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  كبار التجار والبراندات 👑 (VIP)
                </span>
                {selectedPlan === 'VIP' && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">باقة كبار التجار</h3>
                <p className="text-xs text-slate-500 mt-1">سعة مطلقة بدون قيود للعلامات التجارية والشركات الكبرى</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {billingCycle === 'Annual' ? vipAnnual : vipMonthly}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ج.م / {billingCycle === 'Annual' ? 'سنوياً' : 'شهرياً'}
                </span>
              </div>

              {billingCycle === 'Annual' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold">
                  وفرت 2,189 ج.م دفعة واحدة باشتراكك السنوي!
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>منتجات غير محدودة</strong> بدون أي حد أقصى</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>كوبونات خصم غير محدودة</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>150</strong> وصف بالذكاء الاصطناعي شهرياً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تصدير Excel وتقارير أداء متقدمة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>أولوية دعم فني على مدار الساعة على الواتساب</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlan('VIP')}
              className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all mt-6 ${
                selectedPlan === 'VIP'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {selectedPlan === 'VIP' ? 'الباقة المحددة للترقية ✓' : 'اختيار باقة VIP'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Payment Submission Form & Method Selector */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>طرق الدفع والتأكيد المعتمدة في مصر</span>
            </div>
            <h3 className="text-xl font-black text-white">
              إتمام ترقية المتجر إلى {selectedPlan === 'VIP' ? 'باقة VIP' : 'باقة المحترفين'}
            </h3>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl flex items-baseline gap-2">
            <span className="text-xs text-slate-400">إجمالي المبلغ المطلوب:</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{currentAmount} ج.م</span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">اختر وسيلة الدفع المناسبة لك:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Vodafone Cash */}
            <button
              type="button"
              onClick={() => setPaymentMethod('VodafoneCash')}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 ${
                paymentMethod === 'VodafoneCash'
                  ? 'border-rose-500 bg-rose-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">فودافون كاش</span>
                <Smartphone className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[11px] text-slate-400">تحويل كاش فوري عبر رقم المحفظة</span>
            </button>

            {/* 2. InstaPay */}
            <button
              type="button"
              onClick={() => setPaymentMethod('InstaPay')}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 ${
                paymentMethod === 'InstaPay'
                  ? 'border-purple-500 bg-purple-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">إنستاباي (InstaPay)</span>
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[11px] text-slate-400">تحويل بنكي لحظي عبر المعرف أو الرقم</span>
            </button>

            {/* 3. Online Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod('OnlineCard')}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 ${
                paymentMethod === 'OnlineCard'
                  ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">بطاقة بنكية (Visa / Master)</span>
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">تفعيل فوري تلقائي ⚡</span>
            </button>
          </div>
        </div>

        {/* Payment Instructions Card */}
        {paymentMethod === 'VodafoneCash' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-rose-400 block">خطوات التحويل عبر فودافون كاش:</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">رقم محفظة فودافون كاش المعتمد للمنصة:</span>
                <span className="text-lg font-black font-mono text-white tracking-wider">{vodafoneWallet}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(vodafoneWallet, 'vodafone')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopied === 'vodafone' ? 'تم النسخ!' : 'نسخ الرقم'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              1. افتح محفظتك أو اطلب <code className="text-rose-400 font-mono font-bold">*9*7*الرقم*المبلغ#</code>.<br />
              2. حول مبلغ <strong className="text-white">{currentAmount} ج.م</strong>.<br />
              3. ادخل رقم العملية (أو رقم التليفون المحول منه) في الحقل أدناه واضغط تأكيد الطلب.
            </p>
          </div>
        )}

        {paymentMethod === 'InstaPay' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-purple-400 block">خطوات التحويل عبر إنستاباي (InstaPay IPN):</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">عنوان الدفع اللحظي IPN المعتمد:</span>
                <span className="text-lg font-black font-mono text-white tracking-wider">{instapayHandle}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(instapayHandle, 'instapay')}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopied === 'instapay' ? 'تم النسخ!' : 'نسخ العنوان'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              1. افتح تطبيق InstaPay واختر &quot;إرسال نقود&quot; إلى عنوان دفع أو حساب بنكي.<br />
              2. حول مبلغ <strong className="text-white">{currentAmount} ج.م</strong>.<br />
              3. انسخ الرقم المرجعي للعملية (Reference No) وضعه أدناه.
            </p>
          </div>
        )}

        {paymentMethod === 'OnlineCard' && (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>محاكاة الدفع الإلكتروني المباشر (Automated Webhook Ready)</span>
            </div>
            <p className="text-xs text-slate-300">
              عند الضغط على تأكيد الدفع بالفيزا / ماستركارد، سيتم محاكاة نجاح بوابة الدفع السحابية وتفعيل باقة متجرك وتجديد كوتة الذكاء الاصطناعي في نفس اللحظة تلقائياً!
            </p>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleUpgradeSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {paymentMethod === 'OnlineCard' ? 'الرقم المرجعي أو كود البطاقة' : 'رقم العملية / كود الحوالة التأكيدي *'}
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={paymentMethod === 'OnlineCard' ? 'TXN-CARD-2026' : 'مثال: 9482710385 أو 01027150xxx'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                ملاحظات إضافية (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اسم المحول، اسم البنك، أو أي تفاصيل أخرى..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>جاري تأكيد وتسجيل الطلب...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>
                  {paymentMethod === 'OnlineCard'
                    ? `دفع ${currentAmount} ج.م وتفعيل الباقة فورياً ⚡`
                    : `إرسال إيصال التحويل وتأكيد الترقية (${currentAmount} ج.م)`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 5. Invoices & Previous Requests History Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">سجل الفواتير وطلبات الاشتراك السابقة</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {status?.invoiceHistory.length || 0} طلبات مسجلة
          </span>
        </div>

        {status?.invoiceHistory && status.invoiceHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-bold">تاريخ الطلب</th>
                  <th className="py-3 px-4 font-bold">الباقة</th>
                  <th className="py-3 px-4 font-bold">دورة الفوترة</th>
                  <th className="py-3 px-4 font-bold">المبلغ</th>
                  <th className="py-3 px-4 font-bold">طريقة الدفع</th>
                  <th className="py-3 px-4 font-bold">رقم العملية</th>
                  <th className="py-3 px-4 font-bold">حالة الطلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {status.invoiceHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(item.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.planType === 'VIP' ? 'كبار التجار (VIP 👑)' : 'المحترفين (Pro ⭐)'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {item.billingCycle === 'Annual' ? 'سنوي' : 'شهري'}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">
                      {item.amount} ج.م
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 max-w-[150px] truncate" title={item.transactionId}>
                      {item.transactionId}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم التفعيل بنجاح</span>
                        </span>
                      ) : item.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]" title={item.adminNotes || 'مرفوض'}>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>مرفوض ({item.adminNotes || 'تحقق من الحوالة'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>قيد المراجعة</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            لا توجد أي طلبات ترقية أو فواتير مسجلة حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
