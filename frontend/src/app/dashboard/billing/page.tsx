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
  ArrowLeft,
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
  HelpCircle,
  Ban,
  ChevronRight,
  ChevronLeft,
  Info,
  Wallet
} from 'lucide-react';
import { api } from '@/lib/api';
import { 
  MerchantBillingStatus, 
  SubscriptionRequestItem, 
  PlatformPricingSettings,
  PaymentGatewayItem,
  GatewayAccountItem
} from '@/types';

export default function MerchantBillingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<MerchantBillingStatus | null>(null);
  const [pricing, setPricing] = useState<PlatformPricingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard state: 1 = Plan & Cycle, 2 = Payment Method & Account Info, 3 = Transfer Details
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Upgrade Plan selection states
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Annual'>('Annual');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'VIP'>('Pro');
  const [paymentMethod, setPaymentMethod] = useState<string>('VodafoneCash');
  const [destinationAccount, setDestinationAccount] = useState<string>('');
  const [destinationAccountName, setDestinationAccountName] = useState<string>('');
  const [senderIdentifier, setSenderIdentifier] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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

  // Synchronize dynamic payment gateways
  const dynamicGateways: PaymentGatewayItem[] = (status?.activePaymentGateways && status.activePaymentGateways.length > 0)
    ? status.activePaymentGateways.filter(g => g.isEnabled)
    : [
        {
          id: 1,
          gatewayKey: 'VodafoneCash',
          displayName: 'فودافون كاش (Vodafone Cash)',
          isEnabled: true,
          instructions: 'افتح تطبيق Ana Vodafone أو اطلب كود التحويل المباشر للمحفظة المحددة.',
          sortOrder: 1,
          accounts: [
            {
              accountNumber: status?.vodafoneCashWallet || pricing?.vodafoneCashWallet || '01027150123',
              accountName: 'شركة مسار تك',
              isActive: true
            }
          ]
        },
        {
          id: 2,
          gatewayKey: 'InstaPay',
          displayName: 'إنستاباي (InstaPay IPN)',
          isEnabled: true,
          instructions: 'افتح تطبيق InstaPay واختر إرسال نقود إلى عنوان دفع (IPA) أو رقم هاتف.',
          sortOrder: 2,
          accounts: [
            {
              accountNumber: status?.instaPayHandle || pricing?.instaPayHandle || 'watsstore@instapay',
              accountName: 'شركة مسار تك - WatsStore',
              isActive: true
            }
          ]
        }
      ];

  // Auto-select valid payment method if current is not in active gateways
  useEffect(() => {
    if (dynamicGateways.length > 0) {
      const isCurrentValid = dynamicGateways.some(g => g.gatewayKey === paymentMethod);
      if (!isCurrentValid) {
        setPaymentMethod(dynamicGateways[0].gatewayKey);
      }
    }
  }, [dynamicGateways, paymentMethod]);

  // Auto-select destination account for selected gateway
  useEffect(() => {
    const currentGw = dynamicGateways.find(g => g.gatewayKey === paymentMethod) || dynamicGateways[0];
    if (currentGw) {
      const activeAccs = (currentGw.accounts || []).filter(a => a.isActive !== false);
      if (activeAccs.length > 0) {
        const isCurrentAccValid = activeAccs.some(a => a.accountNumber === destinationAccount);
        if (!isCurrentAccValid) {
          setDestinationAccount(activeAccs[0].accountNumber);
          setDestinationAccountName(activeAccs[0].accountName || '');
        }
      } else {
        setDestinationAccount('');
        setDestinationAccountName('');
      }
    }
  }, [dynamicGateways, paymentMethod, destinationAccount]);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(text);
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
        title: `تم نسخ ${label} بنجاح!`,
      });
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (status?.activePendingRequest) {
      Swal.fire({
        icon: 'warning',
        title: 'لديك طلب قيد المراجعة بالفعل!',
        text: 'يوجد طلب ترقية سابق قيد المراجعة المالية. يمكنك انتظار تفعيله أو إلغاؤه لتقديم طلب جديد.',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const trimmedTx = transactionId.trim();
    if (!trimmedTx) {
      Swal.fire({
        icon: 'warning',
        title: 'رقم العملية مطلوب',
        text: 'يرجى إدخال رقم العملية أو كود الحوالة التأكيدي (من 6 إلى 30 حرف ورقم).',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (trimmedTx.length < 6 || trimmedTx.length > 30) {
      Swal.fire({
        icon: 'warning',
        title: 'صيغة رقم العملية غير صالحة',
        text: 'رقم العملية يجب أن يتراوح طوله بين 6 و 30 حرفاً أو رقماً.',
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
        destinationAccount: destinationAccount.trim() || undefined,
        senderIdentifier: senderIdentifier.trim() || undefined,
        transactionId: trimmedTx,
        notes: notes.trim() || undefined
      });

      Swal.fire({
        icon: 'success',
        title: 'تم إرسال طلب الترقية بنجاح! ⏳',
        html: `تم تسجيل طلبك بنجاح وهو الآن <b>قيد المراجعة المالية</b> من قبل الإدارة.<br/><br/>رقم العملية: <code style="font-family: monospace; color: #10B981;">${trimmedTx}</code><br/>سيتم تفعيل باقة <b>${selectedPlan === 'VIP' ? 'VIP 👑' : 'Pro ⭐'}</b> فور مطابقة الإيصال خلال دقائق.`,
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });

      setTransactionId('');
      setSenderIdentifier('');
      setNotes('');
      setWizardStep(1);
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

  const handleCancelPendingRequest = async () => {
    if (!token || !status?.activePendingRequest) return;

    const confirm = await Swal.fire({
      title: 'إلغاء طلب الترقية المعلق؟',
      html: `هل تريد إلغاء طلب الترقية الحالي لباقة <b>${status.activePendingRequest.planType}</b>؟<br/>ستتمكن فور الإلغاء من تقديم طلب جديد بوسيلة دفع أو باقة أخرى.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، إلغاء الطلب 🗑️',
      cancelButtonText: 'تراجع',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (!confirm.isConfirmed) return;

    setIsCancelling(true);
    try {
      const res = await api.cancelMerchantUpgradeRequest(token, status.activePendingRequest.id);
      Swal.fire({
        icon: 'success',
        title: 'تم إلغاء الطلب بنجاح',
        text: res.message || 'تم إلغاء طلب الاشتراك المعلق. يمكنك الآن تقديم طلب جديد.',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
      await loadBillingData(token);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'تعذر إلغاء الطلب',
        text: err.message || 'حدث خطأ أثناء إلغاء طلب الترقية',
        confirmButtonColor: '#10B981',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsCancelling(false);
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
            تابع حالة باقتك الحالية، استهلك كوتة الذكاء الاصطناعي، وقم بالترقية المباشرة عبر فودافون كاش أو إنستاباي.
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

      {/* 1. Active Pending Request 3-Stage Progress Tracker & Card (If Any) */}
      {status?.activePendingRequest && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-amber-950 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    طلب ترقية معلق قيد المراجعة
                  </span>
                  <span className="text-xs text-amber-800 font-mono">
                    {new Date(status.activePendingRequest.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-slate-900">
                  ترقية إلى باقة {status.activePendingRequest.planType === 'VIP' ? 'كبار التجار (VIP 👑)' : 'المحترفين (Pro ⭐)'} ({status.activePendingRequest.billingCycle === 'Annual' ? 'دفع سنوي 365 يوم' : 'دفع شهري 30 يوم'})
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelPendingRequest}
              disabled={isCancelling}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-sm disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب الحالي'}</span>
            </button>
          </div>

          {/* 3-Stage Visual Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Stage 1: Submitted */}
            <div className="bg-white/80 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 font-black" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block">المرحلة 1: تم الإرسال ✅</span>
                <span className="text-xs font-black text-slate-900">تسجيل بيانات الإيصال والحوالة</span>
              </div>
            </div>

            {/* Stage 2: Financial Review (Active) */}
            <div className="bg-amber-100/90 border-2 border-amber-400 rounded-2xl p-4 flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900 block">المرحلة 2: قيد التنفيذ ⏳</span>
                <span className="text-xs font-black text-amber-950">المراجعة والتحقق المالي</span>
              </div>
            </div>

            {/* Stage 3: Instant Activation */}
            <div className="bg-white/50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 opacity-70">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">المرحلة 3: الخطوة القادمة</span>
                <span className="text-xs font-black text-slate-700">تفعيل الباقة فور مطابقة الدفعة</span>
              </div>
            </div>
          </div>

          {/* Detailed Metadata Pill Bar */}
          <div className="bg-white/80 border border-amber-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">طريقة الدفع المحول بها</span>
              <span className="font-bold text-slate-900">
                {status.activePendingRequest.paymentMethod === 'VodafoneCash' ? 'فودافون كاش' : status.activePendingRequest.paymentMethod === 'InstaPay' ? 'إنستاباي (InstaPay)' : status.activePendingRequest.paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">المبلغ الإجمالي المحول</span>
              <span className="font-black text-emerald-700 font-mono text-sm">{status.activePendingRequest.amount} ج.م</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">رقم العملية التأكيدي</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 inline-block">
                {status.activePendingRequest.transactionId}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">المحول منه (المحفظة / الحساب)</span>
              <span className="font-mono font-bold text-slate-800">
                {status.activePendingRequest.senderIdentifier || 'غير مسجل'}
              </span>
            </div>
            {status.activePendingRequest.destinationAccount && (
              <div>
                <span className="text-[11px] text-slate-500 block">الحساب المحول إليه</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  {status.activePendingRequest.destinationAccount}
                </span>
              </div>
            )}
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

      {/* 3. 3-Step Guided Upgrade Wizard */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Wizard Header & Stepper Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>معالج الترقية السريع (Stripe/Shopify Grade)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                ترقية وتجديد باقة المتجر في 3 خطوات بسيطة
              </h2>
            </div>

            {status?.activePendingRequest && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                ⚠️ لديك طلب معلق بالفعل قيد المراجعة
              </span>
            )}
          </div>

          {/* Stepper Navigation Indicator */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={`p-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                wizardStep === 1
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
              <span>اختيار الباقة والدورة</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className={`p-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                wizardStep === 2
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
              <span>وسيلة الدفع وبيانات الحساب</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className={`p-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                wizardStep === 3
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
              <span>تأكيد الحوالة ورقم العملية</span>
            </button>
          </div>
        </div>

        {/* STEP 1: Select Plan & Cycle */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Billing Cycle Switcher */}
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-500">اختر دورة الفوترة المفضلة لك:</p>
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
              <div 
                onClick={() => setSelectedPlan('Pro')}
                className={`cursor-pointer bg-white border-2 rounded-3xl p-6 sm:p-8 space-y-6 transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'Pro' 
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      الأكثر طلباً للتجار ⭐ (Pro)
                    </span>
                    {selectedPlan === 'Pro' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">باقة المحترفين</h3>
                    <p className="text-xs text-slate-500 mt-1">المثالية للمتاجر المتنامية وحملات إعلانات السوشيال ميديا</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
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

                <div className="pt-4">
                  <span className={`block w-full text-center py-3 rounded-xl font-bold text-xs ${
                    selectedPlan === 'Pro' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedPlan === 'Pro' ? 'تم اختيار باقة المحترفين ✓' : 'انقر للاختيار'}
                  </span>
                </div>
              </div>

              {/* Card 2: VIP Plan */}
              <div 
                onClick={() => setSelectedPlan('VIP')}
                className={`cursor-pointer bg-white border-2 rounded-3xl p-6 sm:p-8 space-y-6 transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'VIP' 
                    ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20 bg-amber-50/20' 
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                      كبار التجار والبراندات 👑 (VIP)
                    </span>
                    {selectedPlan === 'VIP' && (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">باقة كبار التجار</h3>
                    <p className="text-xs text-slate-500 mt-1">سعة مطلقة بدون قيود للشركات والعلامات التجارية الكبرى</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
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

                <div className="pt-4">
                  <span className={`block w-full text-center py-3 rounded-xl font-bold text-xs ${
                    selectedPlan === 'VIP' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedPlan === 'VIP' ? 'تم اختيار باقة VIP ✓' : 'انقر للاختيار'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>المتابعة إلى وسيلة الدفع ({currentAmount} ج.م)</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Method & Dynamic Account Details */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>الخطوة 2: تحديد وسيلة الدفع المعتمدة في مصر</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    بيانات التحويل للباقة المحددة ({selectedPlan === 'VIP' ? 'VIP 👑' : 'Pro ⭐'} - {billingCycle === 'Annual' ? 'سنوي' : 'شهري'})
                  </h3>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">المبلغ المطلوب تحويله:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{currentAmount} ج.م</span>
                </div>
              </div>

              {/* Dynamic Payment Method Selector Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">اختر وسيلة الدفع للتحويل:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dynamicGateways.map((gw) => {
                    const isVodafone = gw.gatewayKey === 'VodafoneCash';
                    const isInstapay = gw.gatewayKey === 'InstaPay';
                    const isCard = gw.gatewayKey === 'OnlineCard';
                    const isSelected = paymentMethod === gw.gatewayKey;

                    return (
                      <button
                        key={gw.gatewayKey}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(gw.gatewayKey);
                          const firstAcc = (gw.accounts || []).find((a) => a.isActive !== false);
                          if (firstAcc) {
                            setDestinationAccount(firstAcc.accountNumber);
                            setDestinationAccountName(firstAcc.accountName || '');
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? isVodafone
                              ? 'border-rose-500 bg-rose-500/10 text-white shadow-md'
                              : isInstapay
                              ? 'border-purple-500 bg-purple-500/10 text-white shadow-md'
                              : 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{gw.displayName}</span>
                          {isVodafone && <Smartphone className="w-5 h-5 text-rose-500" />}
                          {isInstapay && <Building2 className="w-5 h-5 text-purple-400" />}
                          {isCard && <CreditCard className="w-5 h-5 text-emerald-400" />}
                          {!isVodafone && !isInstapay && !isCard && <Wallet className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isVodafone && 'تحويل كاش فوري عبر محفظة الهاتف المحمول'}
                          {isInstapay && 'تحويل بنكي لحظي عبر المعرف أو الحساب'}
                          {isCard && 'دفع إلكتروني آمن'}
                          {!isVodafone && !isInstapay && !isCard && 'تحويل مباشر للحساب'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Account Info Cards with 1-click copy */}
              {(() => {
                const selectedGw = dynamicGateways.find((g) => g.gatewayKey === paymentMethod) || dynamicGateways[0];
                const activeAccs = (selectedGw?.accounts || []).filter((a) => a.isActive !== false);
                const isVodafone = selectedGw?.gatewayKey === 'VodafoneCash';
                const isInstapay = selectedGw?.gatewayKey === 'InstaPay';

                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${isVodafone ? 'text-rose-400' : isInstapay ? 'text-purple-400' : 'text-emerald-400'}`}>
                        تعليمات وأرقام التحويل المعتمدة لـ {selectedGw?.displayName}:
                      </span>
                      {activeAccs.length > 1 && (
                        <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                          انقر على الرقم لاختياره للحوالة
                        </span>
                      )}
                    </div>

                    {/* Account selection cards */}
                    {activeAccs.length === 0 ? (
                      <div className="p-4 bg-slate-900 rounded-xl text-center text-xs text-slate-400">
                        لا توجد أرقام مسجلة حالياً لهذه الوسيلة، يرجى التواصل مع الدعم الفني.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeAccs.map((acc, idx) => {
                          const isAccSelected = destinationAccount === acc.accountNumber;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setDestinationAccount(acc.accountNumber);
                                setDestinationAccountName(acc.accountName || '');
                              }}
                              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                                isAccSelected
                                  ? isVodafone
                                    ? 'border-rose-500 bg-rose-500/10 shadow-md ring-1 ring-rose-500/30'
                                    : isInstapay
                                    ? 'border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500/30'
                                    : 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30'
                                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isAccSelected
                                      ? isVodafone ? 'bg-rose-500 text-white' : isInstapay ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {isAccSelected ? '✓' : idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    {acc.accountName || (isVodafone ? 'محفظة كاش معتمدة' : isInstapay ? 'معرف إنستاباي' : 'حساب معتمد')}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(acc.accountNumber, isVodafone ? 'رقم محفظة فودافون كاش' : isInstapay ? 'عنوان إنستاباي' : 'رقم الحساب');
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                    isVodafone
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                      : isInstapay
                                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{isCopied === acc.accountNumber ? 'تم النسخ!' : 'نسخ'}</span>
                                </button>
                              </div>

                              <div className="font-mono text-base sm:text-lg font-black text-white tracking-wider text-left bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                                {acc.accountNumber}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="text-xs text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      {selectedGw?.instructions ? (
                        <p className="leading-relaxed whitespace-pre-line">{selectedGw.instructions}</p>
                      ) : (
                        <p className="leading-relaxed">
                          {isVodafone && `افتح تطبيق Ana Vodafone أو اطلب كود التحويل المباشر: *9*7*${destinationAccount || vodafoneWallet}*${currentAmount}#`}
                          {isInstapay && `افتح تطبيق InstaPay واختر إرسال نقود إلى العنوان أو الرقم: ${destinationAccount || instapayHandle}`}
                        </p>
                      )}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
                        <span>المبلغ الدقيق المطلوب تحويله:</span>
                        <strong className="text-emerald-400 font-mono text-sm">{currentAmount} ج.م</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                <span>رجوع لتغيير الباقة</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>المتابعة لإدخال رقم العملية والإيصال</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Transfer Details & Final Submission */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>الخطوة 3 والأخيرة: تسجيل إيصال التحويل</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    تأكيد بيانات الحوالة وترقية المتجر
                  </h3>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">المبلغ المسجل:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{currentAmount} ج.م</span>
                </div>
              </div>

              {/* Order Summary Recap Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">الباقة المحددة</span>
                  <span className="font-bold text-white">{selectedPlan === 'VIP' ? 'كبار التجار (VIP 👑)' : 'المحترفين (Pro ⭐)'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">دورة الفوترة</span>
                  <span className="font-bold text-white">{billingCycle === 'Annual' ? 'دفع سنوي (365 يوم)' : 'دفع شهري (30 يوم)'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">وسيلة الدفع</span>
                  <span className="font-bold text-emerald-400">
                    {dynamicGateways.find((g) => g.gatewayKey === paymentMethod)?.displayName || paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">الحساب المحول إليه</span>
                  <span className="font-mono font-bold text-white">
                    {destinationAccount || 'الافتراضي'}
                    {destinationAccountName ? ` (${destinationAccountName})` : ''}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleUpgradeSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      رقم العملية / كود الحوالة التأكيدي (Transaction ID) *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="مثال: 9482710385 أو IPN-2026-X891"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      من 6 إلى 30 حرف ورقم كما يظهر في رسالة تأكيد التحويل
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      رقم المحفظة / معرف الحساب المحول منه (Sender)
                    </label>
                    <input
                      type="text"
                      value={senderIdentifier}
                      onChange={(e) => setSenderIdentifier(e.target.value)}
                      placeholder="مثال: 010xxxxxxxx أو name@instapay"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      لتسريع مطابقة الحوالة وتفعيل متجرك فورياً
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اسم المحول، البنك، أو أي تفاصيل إضافية للتحقق..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !!status?.activePendingRequest}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال الإيصال وتسجيل الطلب...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>
                          {status?.activePendingRequest
                            ? 'لديك طلب معلق سابق قيد المراجعة'
                            : `إرسال إيصال التحويل وتأكيد الترقية (${currentAmount} ج.م)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                <span>رجوع لتفاصيل وسيلة الدفع</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Invoices & Previous Requests History Table */}
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
                  <th className="py-3 px-4 font-bold">المحول منه</th>
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
                      {item.paymentMethod === 'VodafoneCash' ? 'فودافون كاش' : item.paymentMethod === 'InstaPay' ? 'إنستاباي' : item.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.senderIdentifier || '-'}
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
                      ) : item.status === 'Cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px]">
                          <Ban className="w-3.5 h-3.5" />
                          <span>تم الإلغاء</span>
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
