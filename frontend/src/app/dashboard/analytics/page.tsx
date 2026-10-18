'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MerchantAnalyticsResponse, DailySalesDataPoint } from '@/types';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Coins, 
  Eye, 
  RefreshCw, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ExternalLink, 
  CreditCard, 
  Wallet, 
  Building2, 
  Tag, 
  Sparkles,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DashboardAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MerchantAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredPoint, setHoveredPoint] = useState<DailySalesDataPoint | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    try {
      const data = await api.getMerchantAnalytics(token);
      setAnalytics(data);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل بيانات الإحصائيات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = async () => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    setIsExporting(true);
    try {
      await api.exportOrdersCsv(token);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'تم تنزيل ملف الإكسل بنجاح 📊',
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ في التصدير',
        text: err.message || 'حدث خطأ أثناء تصدير ملف الإكسل',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-700">جاري تجميع وتحليل بيانات المبيعات...</h3>
        <p className="text-xs text-slate-400">نستخرج مؤشرات الإيرادات والمنتجات الأكثر طلباً في الوقت الفعلي</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">تعذر تحميل بيانات الإحصائيات</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          تأكد من اتصالك بالإنترنت ثم حاول إعادة التحديث مجدداً.
        </p>
        <button
          onClick={() => { setIsLoading(true); fetchAnalytics(); }}
          className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  // Calculations for Chart
  const maxRevenue = Math.max(...analytics.dailySales.map(d => d.revenue), 100);
  const maxOrders = Math.max(...analytics.dailySales.map(d => d.ordersCount), 5);
  const highestSalesDay = [...analytics.dailySales].sort((a, b) => b.revenue - a.revenue)[0];
  const conversionRate = analytics.totalViews > 0 
    ? Math.min(100, Math.round((analytics.totalOrdersCount / analytics.totalViews) * 1000) / 10) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            <span>لوحة الإحصائيات والأرباح</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            متابعة شاملة وفورية لحجم الإيرادات، نمو المبيعات، ومعدلات الطلب عبر متجرك
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setIsLoading(true); fetchAnalytics(); }}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="تحديث الأرقام"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير إكسل (CSV)'}</span>
          </button>

          <Link
            href="/dashboard/coupons"
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Tag className="w-4 h-4" />
            <span>كوبونات الخصم</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي المبيعات والأرباح</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs font-bold text-slate-500">{analytics.currency}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{analytics.growthPercentage >= 0 ? `+${analytics.growthPercentage}%` : `${analytics.growthPercentage}%`} نمو</span>
              </span>
              <span className="text-[11px] text-slate-400">مبيعات الشهر: {analytics.thisMonthRevenue.toLocaleString()} {analytics.currency}</span>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي عدد الطلبات</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">
              {analytics.totalOrdersCount}{' '}
              <span className="text-xs font-bold text-slate-500">طلب ناجح</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {analytics.thisMonthOrdersCount} طلب هذا الشهر
              </span>
              <span className="text-[11px] text-slate-400">عبر الواتساب</span>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
        </div>

        {/* Metric 3: Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">متوسط قيمة الطلب (AOV)</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{analytics.averageOrderValue.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-500">{analytics.currency}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                معدل السلة
              </span>
              <span className="text-[11px] text-slate-400">لكل زبون مشتري</span>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors" />
        </div>

        {/* Metric 4: Traffic & Estimated Conversion */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الزيارات ومعدل التحويل</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">
              {analytics.totalViews.toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-500">زيارة متجر</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {conversionRate}% تحويل
              </span>
              <span className="text-[11px] text-slate-400">إلى محادثة واتساب</span>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
        </div>
      </div>

      {/* Main Chart Section: Sales Trend */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>مخطط نمو المبيعات اليومي (خلال آخر 14 يوماً)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تتبع تدفق الإيرادات اليومية وتوزيع كمية الطلبات لحظة بلحظة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setChartMode('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'revenue'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💵 الإيرادات ({analytics.currency})
              </button>
              <button
                onClick={() => setChartMode('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'orders'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 عدد الطلبات
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas / SVG Container */}
        <div className="relative pt-6 pb-2">
          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div className="absolute top-0 right-4 z-20 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs shadow-xl pointer-events-none animate-fadeIn flex items-center gap-3">
              <span className="font-bold text-slate-300">{hoveredPoint.formattedDate}</span>
              <span className="w-1 h-3 bg-slate-700 rounded-full" />
              <span className="font-bold text-emerald-400">
                {hoveredPoint.revenue.toFixed(2)} {analytics.currency}
              </span>
              <span className="w-1 h-3 bg-slate-700 rounded-full" />
              <span className="text-slate-300 font-medium">{hoveredPoint.ordersCount} طلبات</span>
            </div>
          )}

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-100">
            {analytics.dailySales.map((day, idx) => {
              const value = chartMode === 'revenue' ? day.revenue : day.ordersCount;
              const maxVal = chartMode === 'revenue' ? maxRevenue : maxOrders;
              const percentage = Math.max(8, Math.round((value / maxVal) * 100));
              const isHovered = hoveredPoint?.date === day.date;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(day)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Top value badge on hover */}
                  <span className={`text-[10px] font-bold mb-1 transition-opacity ${
                    isHovered ? 'opacity-100 text-slate-900' : 'opacity-0'
                  }`}>
                    {chartMode === 'revenue' ? `${Math.round(value)}` : value}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all h-full">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        chartMode === 'revenue'
                          ? isHovered
                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                            : value > 0 ? 'bg-emerald-600' : 'bg-slate-200'
                          : isHovered
                            ? 'bg-blue-500 shadow-lg shadow-blue-500/40'
                            : value > 0 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                      style={{ height: `${percentage}%` }}
                    />
                  </div>

                  {/* Date label */}
                  <span className={`text-[10px] mt-2 block truncate w-full text-center font-medium ${
                    isHovered ? 'font-bold text-slate-900' : 'text-slate-400'
                  }`}>
                    {day.formattedDate.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Insights Footer */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>أعلى يوم مبيعات: <strong>{highestSalesDay?.formattedDate || 'اليوم'} ({highestSalesDay?.revenue.toFixed(2) || 0} {analytics.currency})</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>إجمالي طلبات الفترة: <strong>{analytics.dailySales.reduce((acc, d) => acc + d.ordersCount, 0)} طلب</strong></span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">يتم التحديث تلقائياً مع كل طلب شراء جديد</span>
          </div>
        </div>
      </div>

      {/* Grid: Top Products + Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Products Leaderboard (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>المنتجات الأكثر مبيعاً والأعلى عائداً</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">ترتيب المنتجات وفق عدد القطع المباعة وإجمالي الإيراد المحقق</p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>إدارة المنتجات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.topProducts.map((prod, idx) => {
              const rankMedals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div key={prod.productId} className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg font-black w-6 text-center">{rankMedals[idx]}</span>

                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        السعر: {prod.price.toFixed(2)} {analytics.currency}
                      </span>
                    </div>
                  </div>

                  <div className="text-left flex-shrink-0">
                    <div className="text-xs font-black text-emerald-700">
                      {prod.totalRevenue.toLocaleString()} {analytics.currency}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {prod.unitsSold} {prod.unitsSold === 1 ? 'قطعة' : 'قطع مباعة'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Distribution (1 col on lg) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>توزيع طرق الدفع المفضلة</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">خيارات السداد التي يفضلها عملاؤك عند الشراء</p>

            <div className="space-y-3">
              {analytics.paymentMethodsBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لا توجد طلبات مسجلة بعد لعرض توزيع طرق الدفع.
                </div>
              ) : (
                analytics.paymentMethodsBreakdown.map((pm) => {
                  const isVodafone = pm.method.includes('محفظة') || pm.method.includes('كاش');
                  const isInstaPay = pm.method.includes('إنستاباي') || pm.method.includes('InstaPay');

                  return (
                    <div key={pm.method} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          {isVodafone ? <Wallet className="w-3.5 h-3.5 text-emerald-600" /> : isInstaPay ? <Building2 className="w-3.5 h-3.5 text-purple-600" /> : <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                          <span>{pm.method}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">{pm.percentage}%</span>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            isVodafone ? 'bg-emerald-500' : isInstaPay ? 'bg-purple-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pm.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                        <span>{pm.count} طلبات</span>
                        <span className="font-bold text-slate-700">{pm.totalAmount.toLocaleString()} {analytics.currency}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Tip Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>نصيحة لمضاعفة التحويل</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              تفعيل المحافظ الإلكترونية وإنستاباي في إعدادات المتجر يقلل من نسبة إلغاء الطلبات ويزيد من سرعة تحصيل المبيعات.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
