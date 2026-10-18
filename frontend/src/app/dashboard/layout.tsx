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
  ShieldCheck,
  Receipt,
  Star,
  Tag,
  BarChart3,
  Menu,
  X,
  AlertTriangle,
  Clock,
  Crown,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { platformConfig } from '@/config/platformConfig';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
    const token = localStorage.getItem('watsstore_token');
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

  const handleLogout = () => {
    localStorage.removeItem('watsstore_token');
    localStorage.removeItem('watsstore_user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600">جاري تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'نظرة عامة للمتجر', href: '/dashboard', icon: LayoutDashboard },
    { name: 'الطلبات والمبيعات', href: '/dashboard/orders', icon: Receipt },
    { name: 'الإحصائيات والتقارير', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'المنتجات والكتالوج', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'الأقسام والتصنيفات', href: '/dashboard/categories', icon: FolderTree },
    { name: 'آراء العملاء والتقييمات', href: '/dashboard/reviews', icon: Star },
    { name: 'الخصومات وكوبونات التخفيض', href: '/dashboard/coupons', icon: Tag },
    { name: 'إعدادات المتجر والدفع', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 border-l border-slate-800">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-white block">WatsStore</span>
              <span className="text-[11px] text-emerald-400 font-bold block -mt-0.5">لوحة تحكم التاجر</span>
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
                    ? 'منتهي التجربة ⛔'
                    : trialInfo?.planType === 'Free'
                    ? `تجربة (${trialInfo.remainingDays} يوم)`
                    : `${trialInfo?.planType || user?.planType || 'Free'} 👑`}
                </span>
              </div>
              <Link
                href={`/s/${user.slug}`}
                target="_blank"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold pt-1 border-t border-slate-700/60"
              >
                <span>معاينة المتجر الحي</span>
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
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
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
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
            <StoreIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-base">WatsStore</span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
          aria-label="القائمة"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-slate-300 p-4 border-b border-slate-800 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {user && (
              <Link
                href={`/s/${user.slug}`}
                target="_blank"
                className="text-xs text-emerald-400 font-bold flex items-center gap-1"
              >
                <span>معاينة المتجر</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Trial Countdown or Expiration Sticky Banner */}
        {trialInfo && trialInfo.isTrialExpired ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-rose-400">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base">⛔ انتهت فترتك التجريبية المجانية (14 يوماً)</h4>
                <p className="text-xs text-rose-100 mt-0.5">
                  تم إيقاف استقبال الطلبات وإضافة أو تعديل المنتجات مؤقتاً. لتفعيل متجرك فوراً وفتح المميزات غير المحدودة، يرجى الترقية إلى باقة Pro أو VIP.
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
              <span>ترقية الباقة وتفعيل المتجر فوراً</span>
            </a>
          </div>
        ) : trialInfo && trialInfo.planType === 'Free' ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    ⏳ متبقي في فترتك التجريبية المجانية: {trialInfo.remainingDays} {trialInfo.remainingDays === 1 ? 'يوم واحد' : trialInfo.remainingDays === 2 ? 'يومان' : 'أيام'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    14-Day Free Trial
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  استمتع بتجربة كافة مميزات المنصة مجاناً. يمكنك الترقية في أي وقت للاستفادة من منتجات غير محدودة والبيكسل.
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
              <span>ترقية الباقة عبر واتساب الإدارة</span>
            </a>
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
