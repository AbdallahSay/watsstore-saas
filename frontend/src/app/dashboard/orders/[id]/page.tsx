'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { commerceApi, merchantToken, OrderSnapshot } from '@/lib/commerce-api';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  Phone,
  User,
  MapPin,
  CreditCard,
  History as HistoryIcon,
  ShoppingBag,
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transferReference?: string;
  itemsJson: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  shippingSummary?: string;
  createdAt: string;
}

interface History {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
}

const transitions: Record<string, string[]> = {
  Pending: ['Confirmed', 'Cancelled', 'Rejected'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
};

const labels: Record<string, string> = {
  Pending: 'بانتظار التأكيد',
  Confirmed: 'مؤكد',
  Preparing: 'قيد التجهيز',
  Shipped: 'تم الشحن',
  Delivered: 'تم التسليم',
  Cancelled: 'ملغي',
  Rejected: 'مرفوض',
  PaymentVerified: 'تم التحقق من الدفع',
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function load() {
    const token = merchantToken();
    const [o, h] = await Promise.all([
      commerceApi<Order>(`/merchant/orders/${params.id}`, token),
      commerceApi<History[]>(`/merchant/commerce/orders/${params.id}/history`, token),
    ]);
    setOrder(o);
    setHistory(h);
  }

  useEffect(() => {
    load().catch((e) => setMessage({ text: (e as Error).message, type: 'error' }));
  }, [params.id]);

  async function action(status?: string) {
    setBusy(true);
    setMessage(null);
    try {
      await commerceApi(
        `/merchant/commerce/orders/${params.id}/${status ? 'status' : 'verify-payment'}`,
        merchantToken(),
        status ? 'PATCH' : 'POST',
        status ? { status, note } : { note }
      );
      await load();
      setMessage({
        text: status ? `تم تحديث حالة الطلب إلى «${labels[status] || status}» بنجاح.` : 'تم التحقق من الدفع وتسجيله.',
        type: 'success',
      });
      setNote('');
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  let items: OrderSnapshot[] = [];
  try {
    items = JSON.parse(order?.itemsJson || '[]');
  } catch {
    /* legacy snapshot */
  }

  if (!order) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">جاري تحميل بيانات الطلب...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          <span>العودة لقائمة الطلبات</span>
        </Link>
      </div>

      {/* Status Alerts */}
      {message && (
        <div
          role="status"
          className={`p-4 rounded-xl text-xs font-bold border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header Info Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              طلب #{order.orderNumber}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                order.status === 'Delivered'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : order.status === 'Cancelled' || order.status === 'Rejected'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
              }`}
            >
              {labels[order.status] || order.status}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              الدفع: {order.paymentStatus === 'Paid' ? 'مدفوع ✅' : 'قيد التحقق ⏳'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تاريخ الإنشاء: {new Date(order.createdAt).toLocaleString('ar-EG')}
          </p>
        </div>

        <div className="text-start sm:text-end">
          <span className="text-xs text-slate-500 block">إجمالي القيمة المطلوب تحصيلها</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {order.totalAmount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </span>
        </div>
      </div>

      {/* Main Grid: Customer info & Payment info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Shipping Card */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            <span>بيانات العميل والتوصيل</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">الاسم:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{order.customerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">الهاتف:</span>
              <a
                href={`tel:${order.customerPhone}`}
                dir="ltr"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {order.customerPhone}
              </a>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">العنوان:</span>
              <span className="text-slate-700 dark:text-slate-300">{order.customerAddress}</span>
            </div>

            {order.shippingSummary && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold min-w-[70px]">منطقة الشحن:</span>
                <span className="text-slate-700 dark:text-slate-300">{order.shippingSummary}</span>
              </div>
            )}

            {order.customerNotes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">ملاحظات العميل:</span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 italic">
                  “{order.customerNotes}”
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Payment & Totals Card */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>بيانات الدفع والملخص المالي</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">طريقة الدفع:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.paymentMethod === 'cod'
                  ? 'الدفع عند الاستلام'
                  : order.paymentMethod === 'instapay'
                  ? 'إنستاباي'
                  : order.paymentMethod === 'wallet'
                  ? 'محفظة إلكترونية'
                  : order.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">مرجع التحويل:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {order.transferReference || '—'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">إجمالي المنتجات</span>
                <span className="font-bold">{order.subtotal.toFixed(2)} ج.م</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>الخصم المطبق</span>
                  <span className="font-bold">-{order.discountAmount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">رسوم الشحن</span>
                <span className="font-bold">{order.deliveryFee.toFixed(2)} ج.م</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                <span>الإجمالي النهائي</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {order.totalAmount.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Products Table Card */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-500" />
          <span>المنتجات المطلوبة ({items.length})</span>
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">{item.productName}</h3>
                  {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      {Object.entries(item.selectedVariants)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {item.quantity} × {item.unitPrice.toFixed(2)} ج.م
                  </p>
                </div>
              </div>
              <span className="font-black text-xs text-slate-900 dark:text-white">
                {item.subtotal.toFixed(2)} ج.م
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Merchant Order Actions Card */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white">إجراءات المتجر وتحديث الحالة</h2>

        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          ملاحظة الإجراء / سبب الرفض أو مرجع التحقق
          <textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="أدخل ملاحظة تظهر في سجل الطلب..."
            className="w-full min-h-[80px] p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {(transitions[order.status] || []).map((status) => (
            <button
              key={status}
              disabled={busy}
              onClick={() => action(status)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50"
            >
              تحويل إلى: {labels[status] || status}
            </button>
          ))}

          {!['Paid', 'Cancelled'].includes(order.paymentStatus) &&
            !['Cancelled', 'Rejected'].includes(order.status) && (
              <button
                disabled={
                  busy ||
                  note.trim().length < 3 ||
                  (order.paymentMethod === 'cod' && order.status !== 'Delivered')
                }
                onClick={() => action()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50 shadow-sm"
              >
                تأكيد استلام الدفع بعد المراجعة
              </button>
            )}
        </div>

        <p className="text-[11px] text-slate-400">
          تحقق من وصول التحويل إلى حسابك قبل تأكيده. تأكيد النقد يتطلب تسليم الطلب أولاً.
        </p>
      </section>

      {/* History Timeline */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-emerald-500" />
          <span>سجل تحديثات الطلب ({history.length})</span>
        </h2>

        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {labels[h.status] || h.status}
                </span>
                {h.note && <p className="text-slate-500 mt-0.5">{h.note}</p>}
              </div>
              <time className="text-[11px] text-slate-400 shrink-0 font-mono">
                {new Date(h.createdAt).toLocaleString('ar-EG')}
              </time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
