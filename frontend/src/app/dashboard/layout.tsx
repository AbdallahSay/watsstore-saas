'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, 
  LayoutDashboard, 
  ShoppingBag, 
  FolderTree, 
  Settings, 
  ExternalLink, 
  LogOut, 
  User, 
  Receipt,
  Star,
  Tag,
  BarChart3,
  Menu,
  X,
  AlertTriangle,
  Clock,
  Crown,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { api } from '@/lib/api';
import { platformConfig } from '@/config/platformConfig';
import ThemeLanguageBar from '@/components/ThemeLanguageBar';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, dir } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [trialInfo, setTrialInfo] = useState<{
    isTrialExpired: boolean;
    remainingDays: number;
    planType: string;
    trialEndsAt?: string | null;
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token');
    const storedUser = localStorage.getItem('watsstore_user');

    if (!token || !storedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Fetch fresh summary to get exact trial status from backend
        api.getDashboardSummary(token)
          .then((res) => {
            setTrialInfo({
              isTrialExpired: !!res.isTrialExpired,
              remainingDays: res.remainingTrialDays ?? 14,
              planType: res.storeInfo?.planType || parsed.planType || 'Free',
              trialEndsAt: res.trialEndsAt,
            });
          })
          .catch(() => {
            setTrialInfo({
              isTrialExpired: false,
              remainingDays: 14,
              planType: parsed.planType || 'Free',
            });
          });
      } catch {
        router.push('/login');
      }
      setIsLoading(false);
    }
  }, [router]);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('watsstore_merchant_token');
    localStorage.removeItem('watsstore_token');
    localStorage.removeItem('watsstore_user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {t('dash.merchant_panel', undefined, 'جاري تحميل لوحة التحكم...')}
          </span>
        </div>
      </div>
    );
  }

  const navLinks = [
    {name:"إشعارات الطلبات",href:"/dashboard/notifications",icon:Receipt},
    { name: "القوالب والتجارة", href: "/dashboard/themes", icon: Sparkles },
    { name: "المخزون", href: "/dashboard/inventory", icon: ShoppingBag },
    { name: t('dash.overview', undefined, 'نظرة عامة للمتجر'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('dash.orders', undefined, 'الطلبات والمبيعات'), href: '/dashboard/orders', icon: Receipt },
    { name: t('dash.analytics', undefined, 'الإحصائيات والتقارير'), href: '/dashboard/analytics', icon: BarChart3 },
    { name: t('dash.products', undefined, 'المنتجات والكتالوج'), href: '/dashboard/products', icon: ShoppingBag },
    { name: t('dash.categories', undefined, 'الأقسام والتصنيفات'), href: '/dashboard/categories', icon: FolderTree },
    { name: t('dash.reviews', undefined, 'آراء العملاء والتقييمات'), href: '/dashboard/reviews', icon: Star },
    { name: t('dash.coupons', undefined, 'الخصومات وكوبونات التخفيض'), href: '/dashboard/coupons', icon: Tag },
    { name: t('dash.billing', undefined, 'الفواتير والاشتراك'), href: '/dashboard/billing', icon: CreditCard },
    { name: t('dash.settings', undefined, 'إعدادات المتجر والدفع'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 border-r md:border-r-0 md:border-inline-end border-slate-800">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-white block">WatsStore</span>
                <span className="text-[11px] text-emerald-400 font-bold block -mt-0.5">
                  {t('dash.merchant_panel', undefined, 'لوحة تحكم التاجر')}
                </span>
              </div>
            </div>
          </div>

          {/* Store Info snippet */}
          {user && (
            <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.storeName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  trialInfo?.isTrialExpired
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : trialInfo?.planType === 'Pro' || trialInfo?.planType === 'VIP'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {trialInfo?.isTrialExpired
                    ? t('dash.trial_expired_badge', undefined, 'منتهي التجربة ⛔')
                    : trialInfo?.planType === 'Free'
                    ? t('dash.trial_badge', { days: trialInfo.remainingDays }, `تجربة (${trialInfo.remainingDays} يوم)`)
                    : `${trialInfo?.planType || user?.planType || 'Free'} 👑`}
                </span>
              </div>
              <Link
                href={`/s/${user.slug}`}
                target="_blank"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold pt-1 border-t border-slate-700/60"
              >
                <span>{t('dash.view_store', undefined, 'معاينة المتجر الحي')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info, Theme/Language & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Quick Theme & Language switch in sidebar */}
          <div className="px-1 flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-400">
              {t('lang.select', undefined, 'اللغة والمظهر')}
            </span>
            <ThemeLanguageBar variant="dashboard" />
          </div>

          <div className="flex items-center gap-2.5 px-2 pt-2 border-t border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.ownerName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('dash.logout', undefined, 'تسجيل الخروج')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
            <StoreIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white">WatsStore</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeLanguageBar variant="compact" />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer (Off-Canvas) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 rtl:right-0 ltr:left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-300 p-5 flex flex-col justify-between overflow-y-auto rtl:border-l ltr:border-r border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Header with Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base text-white">WatsStore</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center min-w-[44px] min-h-[44px]"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info Card */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.ownerName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.storeName}</p>
                </div>
              </div>

              {/* Nav Links with 44px min touch target */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold min-h-[44px] transition-colors ${
                        isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2 pb-safe">
              {user && (
                <Link
                  href={`/s/${user.slug}`}
                  target="_blank"
                  className="w-full py-3 px-3 rounded-xl bg-emerald-950/60 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-800/60 min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t('dash.view_store', undefined, 'معاينة متجرك الحي')}</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('dash.logout', undefined, 'تسجيل الخروج')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-between px-5 py-3 mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {user?.storeName ? `${user.storeName} • ` : ''}{t('dash.merchant_panel', undefined, 'لوحة تحكم التاجر')}
            </span>
          </div>
          <ThemeLanguageBar variant="dashboard" />
        </div>

        {/* Trial Countdown or Expiration Sticky Banner */}
        {trialInfo && trialInfo.isTrialExpired ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-rose-400">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base">
                  ⛔ {t('dash.trial_expired', undefined, 'انتهت فترتك التجريبية المجانية (14 يوماً)')}
                </h4>
                <p className="text-xs text-rose-100 mt-0.5">
                  {t('dash.trial_expired_desc', undefined, 'تم إيقاف استقبال الطلبات وإضافة أو تعديل المنتجات مؤقتاً. لتفعيل متجرك فوراً وفتح المميزات غير المحدودة، يرجى الترقية إلى باقة Pro أو VIP.')}
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${platformConfig.supportWhatsApp}?text=${encodeURIComponent(
                `مرحباً Masar Tech، انتهت الفترة التجريبية لمتجري (${user?.storeName || ''}) وأرغب في ترقية باقتي للاستمرار في استقبال الطلبات وتفعيل المتجر فوراً.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shrink-0 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('dash.upgrade_now', undefined, 'ترقية الباقة وتفعيل المتجر فوراً')}</span>
            </a>
          </div>
        ) : trialInfo && trialInfo.planType === 'Free' ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30 dark:border-emerald-500/20 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    ⏳ {t('dash.trial_days', { days: trialInfo.remainingDays }, `متبقي في فترتك التجريبية المجانية: ${trialInfo.remainingDays} أيام`)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    14-Day Free Trial
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('dash.trial_free_desc', undefined, 'فترة تجربة مجانية تشمل حتى 10 منتجات وكوبون خصم واحد. رقِّ إلى باقة Pro أو VIP للحصول على وصف الذكاء الاصطناعي وتقارير Excel ومنتجات غير محدودة!')}
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${platformConfig.supportWhatsApp}?text=${encodeURIComponent(
                `مرحباً Masar Tech، أرغب في ترقية متجري (${user?.storeName || ''}) من التجربة المجانية إلى باقة Pro للاستفادة من المنتجات غير المحدودة والبيكسل.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-md shadow-emerald-600/25 transition-all hover:scale-105 flex items-center gap-1.5"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{t('dash.upgrade_whatsapp', undefined, 'ترقية الباقة عبر واتساب الإدارة')}</span>
            </a>
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
