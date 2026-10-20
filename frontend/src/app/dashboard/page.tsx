'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/types';
import { appSwal } from '@/lib/sweetalert';
import { useLanguage } from '@/context/LanguageContext';
import { 
  ShoppingBag, 
  Receipt, 
  TrendingUp, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Check, 
  Clock, 
  User, 
  Sparkles, 
  Download, 
  Crown, 
  Wallet, 
  MessageCircle, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Circle, 
  ArrowLeft, 
  ArrowRight,
  Globe 
} from 'lucide-react';
import { platformConfig } from '@/config/platformConfig';

export default function DashboardOverviewPage() {
  const { t, language, dir } = useLanguage();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'vip'>('pro');
  const [isExporting, setIsExporting] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  const [isLinkShared, setIsLinkShared] = useState(false);

  // Body scroll lock when upgrade modal is open
  useEffect(() => {
    if (isUpgradeModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isUpgradeModalOpen]);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token');
      if (!token) return;

      try {
        const data = await api.getDashboardSummary(token);
        setSummary(data);

        // Check onboarding flags in localStorage
        if (data?.storeInfo?.id) {
          const isDismissed = localStorage.getItem(`watsstore_onboarding_dismissed_${data.storeInfo.id}`) === 'true';
          const isShared = localStorage.getItem(`watsstore_shared_${data.storeInfo.id}`) === 'true';
          setIsOnboardingDismissed(isDismissed);
          setIsLinkShared(isShared);
        }
      } catch (err: any) {
        appSwal.fire({
          icon: 'error',
          title: t('swal.error', undefined, 'خطأ'),
          text: err.message || 'فشل في تحميل بيانات لوحة التحكم',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [t]);

  const handleExportCsv = async () => {
    const token = localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token');
    if (!token) return;

    setIsExporting(true);
    try {
      await api.exportOrdersCsv(token);
      appSwal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'success',
        title: 'تم تصدير ملف الإكسل (CSV) بنجاح!',
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: t('swal.error', undefined, 'خطأ في التصدير'),
        text: err.message || 'حدث خطأ أثناء تحميل ملف الإكسل',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareOnWhatsApp = (storeUrl: string, storeName: string) => {
    if (summary?.storeInfo?.id) {
      localStorage.setItem(`watsstore_shared_${summary.storeInfo.id}`, 'true');
      setIsLinkShared(true);
    }

    const text = encodeURIComponent(
      `مرحباً بكم! يسعدنا زيارتكم لمتجرنا الإلكتروني الرسمي على الواتساب [${storeName}]:\n${storeUrl}\nتصفحوا المنتجات واطلبوا مباشرة بأسرع خدمة وتوصيل! 🛍️✨`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleToggleOnboardingDismiss = () => {
    if (!summary?.storeInfo?.id) return;
    const newState = !isOnboardingDismissed;
    setIsOnboardingDismissed(newState);
    if (newState) {
      localStorage.setItem(`watsstore_onboarding_dismissed_${summary.storeInfo.id}`, 'true');
    } else {
      localStorage.removeItem(`watsstore_onboarding_dismissed_${summary.storeInfo.id}`);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'qr' | 'wallet' | 'subdomain') => {
    navigator.clipboard.writeText(text);

    if (type === 'qr') {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
      appSwal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1600, icon: 'success', title: 'تم نسخ رابط الـ QR الدائم' });
    } else if (type === 'subdomain') {
      setCopiedSubdomain(true);
      setTimeout(() => setCopiedSubdomain(false), 2000);
      appSwal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1600, icon: 'success', title: 'تم نسخ رابط النطاق الفرعي المباشر' });
    } else if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
      appSwal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1600, icon: 'success', title: 'تم نسخ رقم فودافون كاش / إنستاباي' });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      appSwal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1600, icon: 'success', title: 'تم نسخ رابط المتجر' });
    }
  };

  const handleDownloadQr = (qrCodeUrl: string, storeName: string) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-${storeName.replace(/\s+/g, '-')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    appSwal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'success',
      title: 'جاري تحميل كود QR للطباعة...',
    });
  };

  const openWhatsAppUpgrade = (plan: 'pro' | 'vip') => {
    const planName = plan === 'vip' ? 'باقة النخبة VIP (599 ج.م/شهر)' : 'باقة المحترفين Pro (299 ج.م/شهر)';
    const text = encodeURIComponent(
      `مرحباً Masar Tech، قمت بتحويل الرسوم وأرغب في تفعيل [${planName}] لمتجري:\n• اسم المتجر: ${summary?.storeInfo.storeName}\n• الرابط: ${summary?.storeInfo.slug}\n(مرفق صورة إشعار التحويل)`
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

  if (!summary) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        تعذر تحميل بيانات المتجر. يرجى إعادة تسجيل الدخول.
      </div>
    );
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const storeUrl = `${appUrl}/s/${summary.storeInfo.slug}`;
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const subdomainUrl = host.includes('localhost')
    ? `http://${summary.storeInfo.slug}.localhost:3000`
    : `https://${summary.storeInfo.slug}.watsstore.com`;
  const qrUrl = `${appUrl}/m/${summary.storeInfo.publicCode}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&format=png`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 transition-colors">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('dash.plan_badge', { plan: summary.storeInfo.planType }, `باقة المتجر: ${summary.storeInfo.planType}`)}</span>
              </span>
              {summary.storeInfo.planType === 'Free' && (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-full shadow transition-all"
                >
                  {t('dash.upgrade_btn', undefined, 'ترقية الباقة')} 💎
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {t('dash.welcome', { name: summary.storeInfo.ownerName }, `أهلاً بك، ${summary.storeInfo.ownerName}! 👋`)}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              {t('dash.welcome_sub', { store: summary.storeInfo.storeName, city: summary.storeInfo.city }, `إليك أحدث مؤشرات مبيعات متجر "${summary.storeInfo.storeName}" في ${summary.storeInfo.city}.`)}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2.5 min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105"
            >
              <Crown className="w-4 h-4 text-amber-900" />
              <span>{t('dash.upgrade_btn', undefined, 'ترقية الباقة')}</span>
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 min-h-[44px] bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <span>{t('dash.live_store_btn', undefined, 'زيارة المتجر الحي')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Merchant Onboarding Wizard (First-Time Experience) */}
      {(() => {
        const step1Done = true;
        const step2Done = Boolean(summary.storeInfo.logoUrl || summary.storeInfo.vodafoneCashNumber || summary.storeInfo.instaPayAddress);
        const step3Done = summary.totalProducts >= 3;
        const step4Done = isLinkShared;

        const completedStepsCount = 1 + (step2Done ? 1 : 0) + (step3Done ? 1 : 0) + (step4Done ? 1 : 0);
        const progressPercent = Math.round((completedStepsCount / 4) * 100);

        if (isOnboardingDismissed) {
          return (
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 px-5 flex items-center justify-between shadow-sm transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('dash.onboarding_title', undefined, 'دليل تجهيز المتجر')} ({completedStepsCount}/4)
                </span>
                <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>
              <button
                onClick={handleToggleOnboardingDismiss}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors min-h-[44px] px-2"
              >
                <span>{dir === 'rtl' ? 'إظهار خطوات الدليل' : 'Show Guide Steps'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          );
        }

        return (
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-emerald-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden transition-colors">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    🚀
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('dash.onboarding_title', undefined, 'دليل إطلاق متجرك السريع (خطوات التجهيز الأولى)')}
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {progressPercent}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dash.onboarding_desc', undefined, 'أكمل هذه الخطوات البسيطة لتبدأ باستقبال الزبائن والطلبات الفورية عبر الواتساب بأعلى فاعلية')}
                </p>
              </div>

              <button
                onClick={handleToggleOnboardingDismiss}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 self-end sm:self-center flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
                title="إخفاء مؤقت"
              >
                <span>{dir === 'rtl' ? 'تخطّي المؤقت' : 'Hide Guide'}</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <span>{dir === 'rtl' ? 'تأسيس المتجر' : 'Store Setup'}</span>
                <span>{completedStepsCount}/4</span>
                <span>{dir === 'rtl' ? 'جاهز للبيع 100%' : '100% Ready'}</span>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {dir === 'rtl' ? 'الخطوة 1' : 'Step 1'}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {t('dash.step1_title', undefined, 'تسجيل وتأسيس المتجر')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t('dash.step1_desc', undefined, 'تم إنشاء رابط متجرك وكود الـ QR الدائم بنجاح.')}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('dash.step_completed', undefined, 'مكتمل بنجاح')}</span>
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-sm flex flex-col justify-between space-y-3 ${step2Done ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${step2Done ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'}`}>
                      {dir === 'rtl' ? 'الخطوة 2' : 'Step 2'}
                    </span>
                    {step2Done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {t('dash.step2_title', undefined, 'الشعار ووسائل الدفع')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {step2Done
                      ? t('dash.step2_done', undefined, 'تم تجهيز الشعار وتفعيل وسائل الدفع.')
                      : t('dash.step2_desc', undefined, 'ارفع لوجو متجرك وأضف رقم فودافون كاش أو إنستاباي.')}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {step2Done ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('dash.step_completed', undefined, 'مكتمل بنجاح')}</span>
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    >
                      <span>{t('dash.step2_btn', undefined, 'ضبط الإعدادات الآن')}</span>
                      {dir === 'rtl' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </Link>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-sm flex flex-col justify-between space-y-3 ${step3Done ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${step3Done ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'}`}>
                      {dir === 'rtl' ? 'الخطوة 3' : 'Step 3'}
                    </span>
                    {step3Done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {t('dash.step3_title', undefined, 'إضافة أول 3 منتجات')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {step3Done
                      ? t('dash.step3_done', { count: summary.totalProducts }, `رائع! أضفت ${summary.totalProducts} منتجات في الكتالوج.`)
                      : t('dash.step3_desc', { count: summary.totalProducts }, `أضف صور وأسعار منتجاتك (مضاف حالياً ${summary.totalProducts}/3).`)}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {step3Done ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('dash.step_completed', undefined, 'مكتمل بنجاح')}</span>
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/products"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    >
                      <span>{t('dash.step3_btn', undefined, 'إضافة منتجات')}</span>
                      {dir === 'rtl' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </Link>
                  )}
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-sm flex flex-col justify-between space-y-3 ${step4Done ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${step4Done ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60'}`}>
                      {dir === 'rtl' ? 'الخطوة 4' : 'Step 4'}
                    </span>
                    {step4Done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {t('dash.step4_title', undefined, 'مشاركة الرابط على الواتساب')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {step4Done
                      ? t('dash.step4_done', undefined, 'تمت مشاركة المتجر مع الزبائن بنجاح.')
                      : t('dash.step4_desc', undefined, 'شارك رابط متجرك في الحالات والجروبات لتصل لأول زبون.')}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {step4Done ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('dash.step_completed', undefined, 'تمت المشاركة')}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleShareOnWhatsApp(storeUrl, summary.storeInfo.storeName)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    >
                      <span>{t('dash.step4_btn', undefined, 'مشاركة عبر WhatsApp')}</span>
                      <Share2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              {t('dash.total_products', undefined, 'إجمالي المنتجات')}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {summary.totalProducts}
              </span>
              {summary.storeInfo.planType === 'Free' && (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t('dash.of_available', { limit: 10 }, '/ 10 متاح')}
                </span>
              )}
              {summary.storeInfo.planType === 'Pro' && (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t('dash.of_available', { limit: 100 }, '/ 100 متاح')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              {t('dash.total_orders', undefined, 'إجمالي الطلبات المسجلة')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block mt-0.5">
              {summary.totalOrders}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              {t('dash.total_revenue', undefined, 'إجمالي قيمة المبيعات')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block mt-0.5">
              {summary.totalRevenue.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{summary.storeInfo.currency}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Downloadable Store QR Code Card & Sharing Links */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('dash.qr_card_title', undefined, 'رمز QR الدائم وبطاقة المطبوعات')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('dash.qr_card_desc', undefined, 'الرمز الدائم لا يتغير أبداً حتى لو قمت بتغيير اسم المتجر أو رابطه مستقبلاً.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadQr(qrImageSrc, summary.storeInfo.storeName)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>{t('dash.qr_download_btn', undefined, 'تحميل رمز الـ QR للطباعة')}</span>
            </button>
            <button
              onClick={() => copyToClipboard(storeUrl, 'link')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? t('dash.copied', undefined, 'تم النسخ') : t('dash.copy_store_link', undefined, 'نسخ رابط المتجر')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          {/* QR Visual Preview */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <img
                src={qrImageSrc}
                alt="Store QR Code"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{summary.storeInfo.storeName}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                {t('dash.permanent_code', { code: summary.storeInfo.publicCode }, `كود دائم: ${summary.storeInfo.publicCode}`)}
              </span>
            </div>
          </div>

          {/* Links Inputs */}
          <div className="md:col-span-2 space-y-4">
            {/* Wildcard Subdomain Link */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('dash.subdomain_title', undefined, 'رابط النطاق الفرعي لمتجرك (Subdomain URL):')}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                  {t('dash.direct_no_slug', undefined, 'مباشر بدون /s/ 🌐')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={subdomainUrl}
                  className="w-full text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 min-h-[44px]"
                />
                <button
                  onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shrink-0 flex items-center gap-1.5 transition-all shadow-sm min-h-[44px]"
                >
                  {copiedSubdomain ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSubdomain ? t('dash.copied', undefined, 'تم') : 'نسخ'}</span>
                </button>
                <a
                  href={subdomainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 shrink-0 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="فتح الرابط المباشر"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('dash.full_store_link', undefined, 'رابط المتجر الحي الكامل (Online Web Store):')}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={storeUrl}
                  className="w-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px]"
                />
                <button
                  onClick={() => copyToClipboard(storeUrl, 'link')}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shrink-0 flex items-center gap-1.5 min-h-[44px]"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? t('dash.copied', undefined, 'تم') : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('dash.permanent_link', undefined, 'رابط التحويل الدائم المختصر (للبطاقات والملصقات):')}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrUrl}
                  className="w-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px]"
                />
                <button
                  onClick={() => copyToClipboard(qrUrl, 'qr')}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 shrink-0 flex items-center gap-1.5 min-h-[44px]"
                >
                  {copiedQr ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedQr ? t('dash.copied', undefined, 'تم') : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('dash.recent_orders_title', undefined, 'سجل أحدث الطلبات (آخر 20 طلب)')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('dash.recent_orders_count', { count: summary.recentOrders.length }, `إجمالي الطلبات المسجلة: ${summary.recentOrders.length} طلب`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={isExporting || summary.recentOrders.length === 0}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 disabled:opacity-50 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60 transition-colors shadow-sm min-h-[44px]"
              title="تصدير الطلبات لملف Excel CSV"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExporting ? t('dash.exporting', undefined, 'جاري التحميل...') : t('dash.export_csv', undefined, '📥 تصدير الطلبات لإكسل (CSV)')}</span>
            </button>

            <Link
              href="/dashboard/orders"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <span>{t('dash.view_all_orders', undefined, 'عرض كل الطلبات')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {summary.recentOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dash.no_orders', undefined, 'لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات فور قيام زبائنك بالطلب من المتجر.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">{t('dash.th_order_number', undefined, 'رقم الطلب')}</th>
                  <th className="py-3 px-2">{t('dash.th_customer', undefined, 'العميل والهاتف')}</th>
                  <th className="py-3 px-2">{t('dash.th_payment_method', undefined, 'طريقة الدفع')}</th>
                  <th className="py-3 px-2">{t('dash.th_address', undefined, 'عنوان التوصيل')}</th>
                  <th className="py-3 px-2">{t('dash.th_items', undefined, 'المنتجات المطلوبة')}</th>
                  <th className="py-3 px-2">{t('dash.th_total', undefined, 'الإجمالي')}</th>
                  <th className="py-3 px-2">{t('dash.th_date', undefined, 'التاريخ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {summary.recentOrders.map((order) => {
                  let items: any[] = [];
                  try {
                    items = JSON.parse(order.itemsJson);
                  } catch {
                    items = [];
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 font-black text-emerald-600 dark:text-emerald-400">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                        <div className="text-slate-400 dir-ltr text-start">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {order.paymentMethod || t('dash.cod', undefined, 'الدفع عند الاستلام')}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-[160px] truncate">
                        {order.customerAddress}
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          {items.map((it: any, i: number) => (
                            <div key={i} className="text-[11px]">
                              <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-slate-400">({it.quantity}x)</span>
                              {it.selectedVariants && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] mx-1">
                                  [{Object.values(it.selectedVariants).join(', ')}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900 dark:text-white">
                        {order.totalAmount.toFixed(2)} {summary.storeInfo.currency}
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : language, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating WhatsApp Support Button */}
      <a
        href={`https://wa.me/${platformConfig.supportWhatsApp}?text=${encodeURIComponent(
          `مرحباً Masar Tech، أحتاج إلى دعم فني أو استفسار حول متجري (${summary.storeInfo.storeName}) على منصة WatsStore.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 rtl:left-6 ltr:right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border-2 border-white dark:border-slate-800"
      >
        <MessageCircle className="w-5 h-5 fill-white stroke-emerald-600" />
        <span className="font-black text-xs hidden sm:inline">{t('dash.support_whatsapp', undefined, '💬 دعم Masar Tech وتفعيل الباقات')}</span>
      </a>

      {/* Plan Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div 
          onClick={() => setIsUpgradeModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 transition-colors pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('dash.upgrade_modal_title', undefined, 'ترقية باقة المتجر — Masar Tech')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plans Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                className={`min-h-[44px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  selectedPlan === 'pro'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('dash.pro_plan', undefined, 'باقة Pro (299 ج.م/شهر) ⭐')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('vip')}
                className={`min-h-[44px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  selectedPlan === 'vip'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('dash.vip_plan', undefined, 'باقة VIP (599 ج.م/شهر) 👑')}
              </button>
            </div>

            {/* Plan Details Card */}
            {selectedPlan === 'pro' ? (
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-extrabold text-emerald-950 dark:text-emerald-300 text-base">
                    {t('dash.pro_title', undefined, 'باقة المحترفين (Pro)')}
                  </h4>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {t('dash.pro_price', undefined, '299 ج.م')} <span className="text-xs font-semibold">{t('dash.pro_cycle', undefined, '/ شهرياً (أو 2,499 سنوياً)')}</span>
                  </span>
                </div>
                <ul className="text-xs text-emerald-900 dark:text-emerald-200 space-y-2 pt-2">
                  {platformConfig.pricing.pro.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-extrabold text-amber-950 dark:text-amber-300 text-base">
                    {t('dash.vip_title', undefined, 'باقة النخبة (VIP)')}
                  </h4>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                    {t('dash.vip_price', undefined, '599 ج.م')} <span className="text-xs font-semibold">{t('dash.vip_cycle', undefined, '/ شهرياً (أو 4,999 سنوياً)')}</span>
                  </span>
                </div>
                <ul className="text-xs text-amber-900 dark:text-amber-200 space-y-2 pt-2">
                  {platformConfig.pricing.vip.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment Details Box */}
            <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white space-y-3">
              <span className="text-xs font-bold text-slate-400 block">
                {t('dash.payment_method_label', undefined, 'طريقة الدفع والتفعيل المباشر:')}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                يرجى تحويل مبلغ الاشتراك عبر <b>فودافون كاش أو إنستاباي</b> إلى الرقم الرسمي التالي التابع لإدارة <b>Masar Tech</b>:
              </p>
              
              <div className="p-3 bg-white/10 dark:bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {t('dash.unified_wallet_label', undefined, 'رقم فودافون كاش وإنستاباي الموحد:')}
                    </span>
                    <span className="font-mono font-black text-base tracking-wider text-amber-300">
                      {platformConfig.subscriptionWalletNumber}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(platformConfig.subscriptionWalletNumber, 'wallet')}
                  className="px-3.5 py-2 min-h-[38px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWallet ? t('dash.copied', undefined, 'تم النسخ') : t('dash.copy_number', undefined, 'نسخ الرقم')}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => openWhatsAppUpgrade(selectedPlan)}
                className="w-full py-3.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{t('dash.send_receipt_btn', undefined, 'إرسال إيصال التحويل لتفعيل الباقة فوراً عبر واتساب')}</span>
              </button>
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                {t('dash.support_note', undefined, 'فريق Masar Tech متواجد على مدار اليوم لتأكيد وتفعيل باقتك خلال 15 دقيقة.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
