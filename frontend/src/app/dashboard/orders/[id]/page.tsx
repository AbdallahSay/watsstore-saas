'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { commerceApi, merchantToken, OrderSnapshot } from '@/lib/commerce-api';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowRight,
  Package,
  User,
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
  const { language } = useLanguage();
  const tr = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const statusLabel = (status: string) =>
    language === 'ar'
      ? labels[status] || status
      : ({
          Pending: 'Awaiting confirmation',
          Confirmed: 'Confirmed',
          Preparing: 'Preparing',
          Shipped: 'Shipped',
          Delivered: 'Delivered',
          Cancelled: 'Cancelled',
          Rejected: 'Rejected',
          PaymentVerified: 'Payment verified',
        }[status] || status);

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
        text: status ? tr(`تم تحديث حالة الطلب إلى «${statusLabel(status)}».`, `Order updated to ${statusLabel(status)}.`) : tr('تم التحقق من الدفع.', 'Payment verified.'),
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
    const parsed: unknown = JSON.parse(order?.itemsJson || '[]');
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    /* legacy snapshot */
  }

  if (!order) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">{tr('جاري تحميل بيانات الطلب...', 'Loading order details...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          <span>{tr('العودة لقائمة الطلبات', 'Back to orders')}</span>
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
              {tr('طلب', 'Order')} #{order.orderNumber}
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
              {statusLabel(order.status)}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {tr('الدفع', 'Payment')}: {order.paymentStatus === 'Paid' ? tr('مدفوع ✅', 'Paid ✅') : tr('قيد التحقق ⏳', 'Pending ⏳')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {tr('تاريخ الإنشاء', 'Created at')}: {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')}
          </p>
        </div>

        <div className="text-start sm:text-end">
          <span className="text-xs text-slate-500 block">{tr('إجمالي القيمة المطلوب تحصيلها', 'Total Amount')}</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {order.totalAmount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', { minimumFractionDigits: 2 })} ج.م
          </span>
        </div>
      </div>

      {/* Main Grid: Customer info & Payment info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Shipping Card */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            <span>{tr('بيانات العميل والتوصيل', 'Customer & Delivery')}</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">{tr('الاسم', 'Name')}:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{order.customerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">{tr('الهاتف', 'Phone')}:</span>
              <a
                href={`tel:${order.customerPhone}`}
                dir="ltr"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {order.customerPhone}
              </a>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold min-w-[70px]">{tr('العنوان', 'Address')}:</span>
              <span className="text-slate-700 dark:text-slate-300">{order.customerAddress}</span>
            </div>

            {order.shippingSummary && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold min-w-[70px]">{tr('منطقة الشحن', 'Shipping Zone')}:</span>
                <span className="text-slate-700 dark:text-slate-300">{order.shippingSummary}</span>
              </div>
            )}

            {order.customerNotes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">{tr('ملاحظات العميل', 'Customer notes')}:</span>
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
            <span>{tr('بيانات الدفع والملخص المالي', 'Payment & Financial Summary')}</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">{tr('طريقة الدفع', 'Payment method')}:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.paymentMethod === 'cod'
                  ? tr('الدفع عند الاستلام', 'Cash on delivery')
                  : order.paymentMethod === 'instapay'
                  ? 'InstaPay'
                  : order.paymentMethod === 'wallet'
                  ? tr('محفظة إلكترونية', 'Mobile wallet')
                  : order.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">{tr('مرجع التحويل', 'Transfer reference')}:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {order.transferReference || '—'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('إجمالي المنتجات', 'Subtotal')}</span>
                <span className="font-bold">{order.subtotal.toFixed(2)} ج.م</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>{tr('الخصم المطبق', 'Discount')}</span>
                  <span className="font-bold">-{order.discountAmount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('رسوم الشحن', 'Delivery fee')}</span>
                <span className="font-bold">{order.deliveryFee.toFixed(2)} ج.م</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                <span>{tr('الإجمالي النهائي', 'Total')}</span>
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
          <span>{tr('المنتجات المطلوبة', 'Items')} ({items.length})</span>
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
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white">{tr('إجراءات المتجر وتحديث الحالة', 'Order actions')}</h2>

        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {tr('ملاحظة الإجراء / سبب الرفض أو مرجع التحقق', 'Action note / payment verification reference')}
          <textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tr('أدخل ملاحظة تظهر في سجل الطلب...', 'Enter note for order history...')}
            className="w-full min-h-[80px] p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {(transitions[order.status] || []).map((status) => (
            <button
              key={status}
              data-status={status}
              disabled={busy}
              onClick={() => action(status)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50"
            >
              {tr(`تحويل إلى: ${statusLabel(status)}`, `Move to: ${statusLabel(status)}`)}
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
                {tr('تأكيد استلام الدفع بعد المراجعة', 'Confirm payment after verification')}
              </button>
            )}
        </div>

        <p className="text-[11px] text-slate-400">
          {tr(
            'تحقق من وصول التحويل إلى حسابك قبل تأكيده. تأكيد النقد يتطلب تسليم الطلب أولاً.',
            'Verify that the transfer reached your account before confirming payment. Cash requires delivery.'
          )}
        </p>
      </section>

      {/* History Timeline */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-emerald-500" />
          <span>{tr('سجل تحديثات الطلب', 'Order history')} ({history.length})</span>
        </h2>

        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {statusLabel(h.status)}
                </span>
                {h.note && <p className="text-slate-500 mt-0.5">{h.note}</p>}
              </div>
              <time className="text-[11px] text-slate-400 shrink-0 font-mono">
                {new Date(h.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')}
              </time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
