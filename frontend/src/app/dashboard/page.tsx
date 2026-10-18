'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/types';
import Swal from 'sweetalert2';
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
  Phone, 
  MapPin,
  Sparkles
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem('watsstore_token');
      if (!token) return;

      try {
        const data = await api.getDashboardSummary(token);
        setSummary(data);
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.message || 'فشل في تحميل بيانات لوحة التحكم',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const copyToClipboard = (text: string, isQr: boolean) => {
    navigator.clipboard.writeText(text);
    if (isQr) {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
      <div className="text-center py-20 text-slate-500">
        تعذر تحميل بيانات المتجر. يرجى إعادة تسجيل الدخول.
      </div>
    );
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const storeUrl = `${appUrl}/s/${summary.storeInfo.slug}`;
  const qrUrl = `${appUrl}/m/${summary.storeInfo.publicCode}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full inline-block mb-2">
              باقة المتجر: {summary.storeInfo.planType} ⚡
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              أهلاً بك، {summary.storeInfo.ownerName}! 👋
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              إليك أحدث مؤشرات مبيعات متجر &quot;{summary.storeInfo.storeName}&quot; في {summary.storeInfo.city}.
            </p>
          </div>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105"
          >
            <span>زيارة المتجر الحي</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي المنتجات</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
              {summary.totalProducts}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي الطلبات المسجلة</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
              {summary.totalOrders}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي قيمة المبيعات</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
              {summary.totalRevenue.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{summary.storeInfo.currency}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Permanent QR Code & Sharing Links */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">روابط المتجر ورمز QR الدائم</h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          شارك هذا الرابط مع زبائنك في إعلاناتك أو اطبعه على كروت ومطبوعات متجرك. الرمز القصير لا يتغير حتى لو غيرت اسم المتجر.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Canonical Link */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-600 block">رابط المتجر الأساسي (Web Link):</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={storeUrl}
                className="w-full text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200"
              />
              <button
                onClick={() => copyToClipboard(storeUrl, false)}
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shrink-0 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Permanent QR Link */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-600 block">رابط QR القصير الدائم (للمطبوعات):</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={qrUrl}
                className="w-full text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200"
              />
              <button
                onClick={() => copyToClipboard(qrUrl, true)}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0 flex items-center gap-1"
              >
                {copiedQr ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedQr ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">سجل أحدث الطلبات (آخر 20 طلب)</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {summary.recentOrders.length} طلب
          </span>
        </div>

        {summary.recentOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-xs text-slate-500">لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات فور قيام زبائنك بالطلب من المتجر.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-3 px-2">رقم الطلب</th>
                  <th className="py-3 px-2">العميل والهاتف</th>
                  <th className="py-3 px-2">عنوان التوصيل</th>
                  <th className="py-3 px-2">المنتجات المطلوبة</th>
                  <th className="py-3 px-2">الإجمالي</th>
                  <th className="py-3 px-2">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.recentOrders.map((order) => {
                  let items: any[] = [];
                  try {
                    items = JSON.parse(order.itemsJson);
                  } catch {
                    items = [];
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-black text-emerald-600">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-slate-400 dir-ltr text-right">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-2 max-w-[180px] truncate">
                        {order.customerAddress}
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          {items.map((it: any, i: number) => (
                            <div key={i} className="text-[11px]">
                              <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-slate-400">({it.quantity}x)</span>
                              {it.selectedVariants && (
                                <span className="text-emerald-600 text-[10px] mr-1">
                                  [{Object.values(it.selectedVariants).join(', ')}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900">
                        {order.totalAmount.toFixed(2)} {summary.storeInfo.currency}
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
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
    </div>
  );
}
