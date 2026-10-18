'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { 
  Store as StoreIcon, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Power, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  LogOut, 
  Key, 
  Lock, 
  Mail, 
  Phone, 
  TrendingUp, 
  Package, 
  Star, 
  Eye, 
  Sparkles,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminPlatformStats, AdminStoreSummary } from '@/types';

export default function SuperAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Login Form States
  const [loginMethod, setLoginMethod] = useState<'key' | 'credentials'>('key');
  const [secretKey, setSecretKey] = useState('WatsStore_SuperAdmin_SecretKey_2026_Secure!');
  const [email, setEmail] = useState('admin@watsstore.com');
  const [password, setPassword] = useState('Admin@WatsStore2026!');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data States
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [stores, setStores] = useState<AdminStoreSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const savedToken = localStorage.getItem('watsstore_admin_token');
    const savedUser = localStorage.getItem('watsstore_admin_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setAdminUser(JSON.parse(savedUser));
        } catch {}
      }
    }
    setIsInitializing(false);
  }, []);

  // Fetch Dashboard Data
  const loadDashboardData = useCallback(async (activeToken: string) => {
    setIsLoadingData(true);
    try {
      const [statsRes, storesRes] = await Promise.all([
        api.getAdminPlatformStats(activeToken),
        api.getAdminStores(activeToken)
      ]);
      setStats(statsRes);
      setStores(storesRes);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.message && err.message.includes('401')) {
        handleLogout();
        Swal.fire({
          icon: 'error',
          title: 'جلسة منتهية',
          text: 'انتهت صلاحية مفتاح الإدارة، يرجى تسجيل الدخول مجدداً.',
          confirmButtonColor: '#10B981',
          background: '#0f172a',
          color: '#f8fafc',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'خطأ في جلب البيانات',
          text: err.message || 'تعذر تحميل بيانات لوحة الإدارة',
          confirmButtonColor: '#10B981',
          background: '#0f172a',
          color: '#f8fafc',
        });
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // When token is set, load data
  useEffect(() => {
    if (token) {
      loadDashboardData(token);
    }
  }, [token, loadDashboardData]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const payload = loginMethod === 'key' 
        ? { secretKey }
        : { email, password };

      const res = await api.adminLogin(payload);
      setToken(res.token);
      setAdminUser({ email: res.email, name: res.name, role: res.role });

      localStorage.setItem('watsstore_admin_token', res.token);
      localStorage.setItem('watsstore_admin_user', JSON.stringify({
        email: res.email,
        name: res.name,
        role: res.role
      }));

      Swal.fire({
        icon: 'success',
        title: 'مرحباً بك يا مدير المنصة!',
        text: 'تم تسجيل الدخول بنجاح إلى لوحة الإدارة العليا',
        timer: 1600,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
    } catch (err: any) {
      setLoginError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('watsstore_admin_token');
    localStorage.removeItem('watsstore_admin_user');
    setToken(null);
    setAdminUser(null);
    setStats(null);
    setStores([]);
  };

  // Toggle Store Active Status
  const handleToggleStatus = async (store: AdminStoreSummary) => {
    if (!token) return;

    const actionText = store.isActive ? 'إيقاف هذا المتجر' : 'تفعيل هذا المتجر';
    const confirmResult = await Swal.fire({
      title: `هل أنت متأكد من ${actionText}؟`,
      text: `متجر "${store.storeName}" (${store.slug})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `نعم، ${store.isActive ? 'إيقاف' : 'تفعيل'}`,
      cancelButtonText: 'إلغاء',
      confirmButtonColor: store.isActive ? '#ef4444' : '#10B981',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (!confirmResult.isConfirmed) return;

    const storeId = store.id;
    setActionLoadingId(storeId);
    try {
      const res = await api.toggleStoreStatus(token, storeId);
      
      // Update local state
      setStores(prev => prev.map(s => {
        if (s.id === storeId) {
          return { ...s, isActive: res.isActive };
        }
        return s;
      }));

      // Update stats if present
      if (stats) {
        setStats({
          ...stats,
          activeStores: res.isActive ? stats.activeStores + 1 : Math.max(0, stats.activeStores - 1),
          suspendedStores: !res.isActive ? stats.suspendedStores + 1 : Math.max(0, stats.suspendedStores - 1),
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'تم التحديث بنجاح',
        text: res.message,
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ أثناء تغيير الحالة',
        text: err.message || 'فشل تحديث حالة المتجر',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Store Permanently
  const handleDeleteStore = async (store: AdminStoreSummary) => {
    if (!token) return;

    const storeName = store.storeName;
    const storeId = store.id;

    const confirmResult = await Swal.fire({
      title: `⚠️ حذف نهائي لمتجر "${storeName}"؟`,
      html: `
        <div style="direction: rtl; text-align: right; font-size: 14px; line-height: 1.6;">
          <p style="color: #f87171; font-weight: bold; margin-bottom: 8px;">تنبيه شديد الخطورة:</p>
          <p>سيتم حذف المتجر وجميع المنتجات والأقسام والطلبات والتقييمات وأكواد الخصم التابعة له نهائياً ولا يمكن التراجع عن هذا الإجراء!</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف المتجر بالكامل 🗑️',
      cancelButtonText: 'تراجع',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (!confirmResult.isConfirmed) return;

    setActionLoadingId(storeId);
    try {
      const res = await api.deleteStore(token, storeId);
      
      // Remove from local stores
      setStores(prev => prev.filter(s => s.id !== storeId));

      // Refresh stats
      if (stats) {
        setStats({
          ...stats,
          totalStores: Math.max(0, stats.totalStores - 1),
          activeStores: store.isActive ? Math.max(0, stats.activeStores - 1) : stats.activeStores,
          suspendedStores: !store.isActive ? Math.max(0, stats.suspendedStores - 1) : stats.suspendedStores,
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'تم حذف المتجر نهائياً',
        text: res.message || 'تمت إزالة المتجر وجميع بياناته بنجاح',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'فشل حذف المتجر',
        text: err.message || 'حدث خطأ أثناء محاولة حذف المتجر',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Stores List
  const filteredStores = stores.filter(store => {
    const name = (store.storeName || '').toLowerCase();
    const owner = (store.ownerName || '').toLowerCase();
    const sEmail = (store.email || '').toLowerCase();
    const phone = (store.whatsAppNumber || '');
    const slug = (store.slug || '').toLowerCase();
    const city = (store.city || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || owner.includes(q) || sEmail.includes(q) || phone.includes(q) || slug.includes(q) || city.includes(q);

    if (statusFilter === 'active') return matchesSearch && store.isActive;
    if (statusFilter === 'suspended') return matchesSearch && !store.isActive;
    return matchesSearch;
  });

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">جاري تهيئة لوحة التحكم العليا...</p>
        </div>
      </div>
    );
  }

  // 1. Security Gate: Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-emerald-950/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 mb-4">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">لوحة الإدارة العليا</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
              <span>WatsStore Platform Master Control</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Masar Tech</span>
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod('key'); setLoginError(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === 'key'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>المفتاح السري للإدارة</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('credentials'); setLoginError(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === 'credentials'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>بيانات المسؤول</span>
            </button>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginMethod === 'key' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Master Admin Secret Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="أدخل المفتاح السري لمنصة WatsStore"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left font-mono"
                    required
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500">
                  المفتاح الافتراضي محفوظ للأمان العالي الخاص بمالك النظام.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">بريد المسؤول العام</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@watsstore.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">كلمة المرور السرية</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة التحكم العليا</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link 
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
            >
              <span>العودة إلى الصفحة الرئيسية للمنصة</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Super Admin Dashboard
  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">لوحة الإدارة المركزية</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>WatsStore SaaS</span>
              <span>•</span>
              <span className="text-slate-500">Masar Tech Engine</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px]">MonsterASP API Live</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => token && loadDashboardData(token)}
            disabled={isLoadingData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>نظام السيطرة والتحكم المركزي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              مرحباً بك في لوحة تحكم مالك المنصة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              راقب حركة المبيعات، الطلبات، المتاجر النشطة والموقوفة عبر منصة WatsStore في كافة محافظات مصر بنقرة واحدة.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <span>معاينة الهبوط الرئيسية</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Platform Overview Metrics Cards */}
        {stats && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>مؤشرات أداء المنصة الإجمالية</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Stores */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">إجمالي المتاجر</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalStores}</span>
                  <span className="text-xs text-slate-500 font-medium">متجر مسجل</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold">{stats.activeStores} نشط</span>
                  <span className="text-slate-500">{stats.suspendedStores} موقوف</span>
                </div>
              </div>

              {/* Card 2: Active Stores */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">المتاجر النشطة</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.activeStores}</span>
                  <span className="text-xs text-slate-500 font-medium">متجر يعمل</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>تستقبل طلبات ومبيعات حالياً</span>
                </div>
              </div>

              {/* Card 3: Total Orders */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">إجمالي الطلبات</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalOrders}</span>
                  <span className="text-xs text-slate-500 font-medium">طلب تم تسجيله</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>طلب واتساب مسجل</span>
                  <span className="text-blue-400 font-bold">100% نجاح</span>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">إجمالي مبيعات المنصة</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">
                    {stats.totalRevenue.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">ج.م</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>إجمالي قيمة سلات الشراء (GMV)</span>
                </div>
              </div>
            </div>

            {/* Secondary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 text-xs">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">المنتجات بالمنصة</span>
                  <span className="font-bold text-white text-sm">{stats.totalProducts} منتج</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">تقييمات المشترين</span>
                  <span className="font-bold text-white text-sm">{stats.totalReviews} تقييم</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">زيارات واجهات المتاجر</span>
                  <span className="font-bold text-white text-sm">{stats.totalViews.toLocaleString()} زيارة</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">متاجر بالنطاقات الفرعية</span>
                  <span className="font-bold text-white text-sm">{stats.activeStores} نطاق فعال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stores Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-emerald-400" />
                <span>إدارة جميع متاجر المنصة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {filteredStores.length} متجر
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                يمكنك البحث، مراقبة المبيعات، إيقاف أي متجر مؤقتاً أو حذفه بالكامل مع كافة ملحقاته.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({stores.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                نشطة ({stores.filter(s => s.isActive).length})
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'suspended'
                    ? 'bg-rose-500 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                موقوفة ({stores.filter(s => !s.isActive).length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المتجر، المالك، البريد، رقم الواتساب، المدينة أو النطاق..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
          </div>

          {/* Stores Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredStores.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <StoreIcon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-300">لم يتم العثور على أي متاجر</h4>
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'لا توجد نتائج تطابق معايير البحث الحالية.' : 'لا توجد متاجر مسجلة في هذا التبويب.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">المتجر والرابط</th>
                      <th className="py-3.5 px-4">المالك والتواصل</th>
                      <th className="py-3.5 px-4">المدينة والتصنيف</th>
                      <th className="py-3.5 px-4">الباقة</th>
                      <th className="py-3.5 px-4">المبيعات والطلبات</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredStores.map((store) => {
                      const storeId = store.id;
                      const storeName = store.storeName;
                      const ownerName = store.ownerName;
                      const slug = store.slug;
                      const emailVal = store.email;
                      const phone = store.whatsAppNumber;
                      const city = store.city;
                      const category = store.businessCategory;
                      const plan = store.planType || 'Free';
                      const isActive = store.isActive;
                      const ordersCount = store.ordersCount;
                      const productsCount = store.productsCount;
                      const revenue = store.totalRevenue;
                      const isActionPending = actionLoadingId === storeId;

                      return (
                        <tr key={storeId} className="hover:bg-slate-800/30 transition-colors">
                          {/* Store Name & Slug */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white text-sm block">
                                {storeName}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                                <span className="text-emerald-400">/{slug}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-sans">{store.publicCode}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                تم التسجيل: {new Date(store.createdAt).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          </td>

                          {/* Owner & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-200 block">
                                {ownerName}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                <a 
                                  href={`https://wa.me/${phone}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{phone}</span>
                                </a>
                              </div>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[160px]" title={emailVal}>
                                {emailVal}
                              </span>
                            </div>
                          </td>

                          {/* City & Category */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-200 block">
                                {city}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {category}
                              </span>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${
                              plan === 'VIP'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : plan === 'Pro'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {plan}
                            </span>
                          </td>

                          {/* Orders & Revenue */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-black text-white text-xs block">
                                {(revenue || 0).toLocaleString('ar-EG')} ج.م
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="text-blue-400 font-bold">{ordersCount || 0} طلب</span>
                                <span>•</span>
                                <span>{productsCount || 0} منتج</span>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>نشط ومتاح</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>موقوف مؤقتاً</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Visit Store Button */}
                              <Link
                                href={`/s/${slug}`}
                                target="_blank"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                                title="زيارة المتجر"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* Toggle Active Status Button */}
                              <button
                                onClick={() => handleToggleStatus(store)}
                                disabled={isActionPending}
                                className={`p-2 rounded-lg transition-colors border ${
                                  isActive
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                } disabled:opacity-50`}
                                title={isActive ? 'إيقاف المتجر مؤقتاً' : 'تفعيل المتجر'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Store Button */}
                              <button
                                onClick={() => handleDeleteStore(store)}
                                disabled={isActionPending}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg transition-colors disabled:opacity-50"
                                title="حذف المتجر نهائياً"
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
