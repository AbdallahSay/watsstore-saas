'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, Copy, RefreshCcw, Truck } from 'lucide-react';
import { commerceApi, type TrackingOrder } from '@/lib/commerce-api';

const stages = [
  { id: 'Pending', label: 'تم استلام الطلب', desc: 'الطلب اتسجل في المتجر' },
  { id: 'Confirmed', label: 'تم تأكيد الطلب', desc: 'التاجر أكد طلبك' },
  { id: 'Preparing', label: 'جاري التجهيز', desc: 'طلبك بيتجهز للشحن' },
  { id: 'Shipped', label: 'خرج للتوصيل', desc: 'الطلب في طريقه إليك' },
  { id: 'Delivered', label: 'تم التسليم', desc: 'استلمت طلبك بنجاح' },
] as const;
const statusLabels: Record<string,string> = {Pending:'بانتظار تأكيد المتجر',Confirmed:'تم تأكيد الطلب',Preparing:'جاري تجهيز الطلب',Shipped:'في الطريق إليك',Delivered:'تم التسليم',Cancelled:'تم إلغاء الطلب',Rejected:'تم رفض الطلب'};
const paymentLabels: Record<string,string> = {Unpaid:'الدفع عند الاستلام / غير مدفوع',Paid:'تم الدفع',AwaitingVerification:'بانتظار تأكيد التحويل'};
const terminal = new Set(['Delivered','Cancelled','Rejected']);

export default function LiveTracking({ initialOrder, storeSlug, token }: {initialOrder: TrackingOrder; storeSlug: string; token: string}) {
  const [order, setOrder] = useState(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    setRefreshing(true);
    try {
      const next = await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(storeSlug)}/orders/track/${encodeURIComponent(token)}`);
      setOrder(next);
      setLastChecked(new Date());
      setMessage('');
    } catch {
      setMessage('تعذر تحديث الحالة حاليًا. آخر حالة معروضة ما زالت محفوظة، ويمكنك المحاولة مرة أخرى.');
    } finally { setRefreshing(false); }
  }, [storeSlug, token]);

  useEffect(() => {
    if (terminal.has(order.status)) return;
    const id = window.setInterval(() => { void refresh(); }, 30000);
    return () => window.clearInterval(id);
  }, [order.status, refresh]);

  const active = stages.findIndex(x => x.id === order.status);
  const ended = order.status === 'Cancelled' || order.status === 'Rejected';

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setMessage('انسخ رابط الصفحة من شريط العنوان للاحتفاظ به.'); }
  }

  return <main dir="rtl" className="min-h-screen bg-[#f6f5f2] text-stone-900 px-4 py-8 sm:py-12">
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-4">
        <Link href={`/s/${encodeURIComponent(storeSlug)}`} className="text-sm font-semibold underline underline-offset-4">العودة للمتجر</Link>
        <p className="text-xs text-stone-500">WatsStore · متابعة الطلب</p>
      </div>
      <header className="rounded-2xl bg-white border border-stone-200 p-5 sm:p-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div><p className="text-sm text-stone-500">رقم طلبك</p><h1 className="text-3xl sm:text-4xl font-black mt-1" dir="ltr">#{order.orderNumber}</h1></div>
          <span className={`h-fit rounded-full px-4 py-2 text-sm font-bold ${ended ? 'bg-red-100 text-red-800' : order.status==='Delivered' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{statusLabels[order.status] || order.status}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => void refresh()} disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-semibold disabled:opacity-50"><RefreshCcw size={16} className={refreshing?'animate-spin':''}/>{refreshing?'جاري التحديث':'تحديث حالة الطلب'}</button>
          <button onClick={() => void copyLink()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-semibold"><Copy size={16}/>{copied?'تم نسخ الرابط':'حفظ رابط المتابعة'}</button>
        </div>
        <p className="mt-3 text-xs text-stone-500">{lastChecked ? `آخر تحديث: ${lastChecked.toLocaleTimeString('ar-EG')}` : 'يتم التحقق تلقائيًا كل 30 ثانية أثناء فتح الصفحة'}</p>
        {message && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
      </header>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8" aria-label="مراحل وصول الطلب">
        <h2 className="text-xl font-bold mb-6 flex gap-2 items-center"><Truck size={20}/> رحلة طلبك</h2>
        {ended ? <p role="status" className="mb-6 rounded-xl bg-red-50 p-4 text-red-800">{order.status === 'Cancelled' ? 'تم إلغاء هذا الطلب.' : 'المتجر رفض هذا الطلب.'} يمكنك التواصل مع المتجر للتفاصيل.</p> : null}
        <ol className="space-y-0">
          {stages.map((step,i) => {
            const complete = !ended && active >= i;
            return <li key={step.id} className="flex gap-4 min-h-20">
              <div className="flex flex-col items-center">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 ${complete?'bg-emerald-700 border-emerald-700 text-white':'border-stone-300 text-stone-400'}`}>{complete?<Check size={18}/>:<Circle size={14}/>}</span>
                {i < stages.length-1 && <span className={`w-0.5 flex-1 my-1 ${complete && active>i ? 'bg-emerald-700':'bg-stone-200'}`}/>}
              </div>
              <div className="pt-1 pb-6"><p className={`font-bold ${complete?'text-stone-900':'text-stone-500'}`}>{step.label}</p><p className="text-xs text-stone-500 mt-1">{step.desc}</p></div>
            </li>;
          })}
        </ol>
      </section>
      <section className="rounded-2xl bg-white border border-stone-200 p-5 sm:p-8 space-y-5">
        <h2 className="font-bold text-xl">تفاصيل الطلب</h2>
        <ul className="space-y-3">{order.items.map((item,i)=><li key={i} className="flex justify-between gap-4 border-b border-stone-100 pb-3"><div><p className="font-semibold">{item.productName}</p><p className="text-xs text-stone-500">{Object.values(item.selectedVariants||{}).join(' / ')}</p><p className="text-sm mt-1">{item.quantity} × {item.unitPrice.toFixed(2)}</p></div><strong>{item.subtotal.toFixed(2)} ج.م</strong></li>)}</ul>
        <dl className="space-y-2 text-sm">{[['المنتجات',order.subtotal],['الخصم',-order.discountAmount],['الشحن',order.deliveryFee],['الإجمالي',order.totalAmount]].map(([k,v])=><div key={k} className="flex justify-between gap-4"><dt>{k}</dt><dd className="font-semibold">{Number(v).toFixed(2)} ج.م</dd></div>)}</dl>
        <p className="text-sm border-t pt-3">حالة الدفع: <strong>{paymentLabels[order.paymentStatus] || order.paymentStatus}</strong></p>
        {order.shippingSummary && <p className="text-sm text-stone-600">{order.shippingSummary}</p>}
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8"><h2 className="font-bold text-lg mb-4">سجل تحديثات الطلب</h2><ol className="space-y-4">{order.history.map((entry,i)=><li className="flex justify-between gap-3 border-b border-stone-100 pb-3 text-sm" key={i}><span>{statusLabels[entry.status] || entry.status}</span><time className="text-stone-500 text-xs" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('ar-EG',{timeZone:'Africa/Cairo'})}</time></li>)}</ol></section>
      <p className="text-xs text-stone-500 text-center">احتفظ بالرابط بشكل خاص؛ الوصول إليه يسمح بعرض تفاصيل الطلب غير الحساسة. لا يتم عرض رقم موبايلك أو عنوانك.</p>
    </div>
  </main>;
}
