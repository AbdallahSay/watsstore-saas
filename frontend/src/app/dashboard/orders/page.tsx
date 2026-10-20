'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { appSwal } from '@/lib/sweetalert';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Receipt, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function MerchantOrdersPage() {
  const { t, language, dir } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const fetchOrders = async () => {
    const token = (localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token'));
    if (!token) return;

    try {
      const data = await api.getOrders(token, 1, 100);
      setOrders(data.orders || []);
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل سجل الطلبات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleExportCsv = async () => {
    const token = (localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token'));
    if (!token) return;

    setIsExporting(true);
    try {
      await api.exportOrdersCsv(token);
      const toast = appSwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
      });
      toast.fire({
        icon: 'success',
        title: 'تم تصدير ملف الإكسل (CSV) بنجاح!',
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ في التصدير',
        text: err.message || 'حدث خطأ أثناء تحميل ملف الإكسل',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone?.includes(searchQuery) ||
      o.orderNumber?.toString().includes(searchQuery) ||
      o.customerAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment = 
      paymentFilter === 'ALL' ||
      (paymentFilter === 'CASH' && (!o.paymentMethod || o.paymentMethod.includes('الاستلام'))) ||
      (paymentFilter === 'WALLET' && o.paymentMethod?.includes('محفظة')) ||
      (paymentFilter === 'INSTAPAY' && o.paymentMethod?.includes('إنستاباي'));

    return matchesSearch && matchesPayment;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600">جاري تحميل سجل الطلبات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">سجل الطلبات والمبيعات</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">إدارة ومتابعة طلبات متجرك وتصديرها لبرامج المحاسبة والإكسل</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting || orders.length === 0}
          className="w-full sm:w-auto px-5 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>{isExporting ? 'جاري تجهيز الملف...' : '📥 تصدير الطلبات لإكسل (CSV)'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">إجمالي عدد الطلبات</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{orders.length} طلب</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الطلبات المعروضة حالياً</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{filteredOrders.length} طلب</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">إجمالي قيمة المبيعات</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalRevenue.toFixed(2)} ج.م</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="بحث بالاسم، الهاتف، أو رقم الطلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setPaymentFilter('ALL')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            جميع طرق الدفع
          </button>
          <button
            onClick={() => setPaymentFilter('CASH')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'CASH'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            الدفع عند الاستلام
          </button>
          <button
            onClick={() => setPaymentFilter('WALLET')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'WALLET'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            محافظ إلكترونية
          </button>
          <button
            onClick={() => setPaymentFilter('INSTAPAY')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              paymentFilter === 'INSTAPAY'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            إنستاباي
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد طلبات تطابق معايير البحث</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">ستظهر الطلبات الجديدة فور قيام الزبائن بإرسال سلة المشتريات.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3.5 px-4">رقم الطلب</th>
                  <th className="py-3.5 px-4">بيانات العميل</th>
                  <th className="py-3.5 px-4">طريقة الدفع</th>
                  <th className="py-3.5 px-4">العنوان</th>
                  <th className="py-3.5 px-4">تفاصيل المنتجات</th>
                  <th className="py-3.5 px-4">المبلغ المستحق</th>
                  <th className="py-3.5 px-4">تاريخ الطلب</th>
                  <th className="py-3.5 px-4 text-center">مراسلة العميل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredOrders.map((order) => {
                  let items: any[] = [];
                  try {
                    items = JSON.parse(order.itemsJson);
                  } catch {
                    items = [];
                  }

                  const cleanPhone = order.customerPhone?.replace(/\D/g, '') || '';
                  const waLink = `https://wa.me/${cleanPhone.startsWith('2') ? cleanPhone : '20' + cleanPhone.replace(/^0+/, '')}`;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        #{order.orderNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                        <div className="text-slate-400 dark:text-slate-500 font-mono text-[11px] dir-ltr text-right">{order.customerPhone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {order.paymentMethod || 'الدفع عند الاستلام'}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-[200px] truncate" title={order.customerAddress}>
                        {order.customerAddress}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 max-w-[240px]">
                          {items.map((it: any, i: number) => (
                            <div key={i} className="text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{it.productName}</span>{' '}
                              <span className="text-slate-400 dark:text-slate-500">({it.quantity}x)</span>
                              {it.selectedVariants && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] mr-1 block">
                                  [{Object.values(it.selectedVariants).join(', ')}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                        {order.totalAmount?.toFixed(2)} ج.م
                      </td>
                      <td className="py-4 px-4 text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[36px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-[11px] border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>واتساب</span>
                        </a>
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
