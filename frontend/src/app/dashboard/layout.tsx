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
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('watsstore_token');
    const storedUser = localStorage.getItem('watsstore_user');

    if (!token || !storedUser) {
      router.push('/login');
    } else {
      try {
        setUser(JSON.parse(storedUser));
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {user.planType || 'Free'}
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
        {children}
      </main>
    </div>
  );
}
