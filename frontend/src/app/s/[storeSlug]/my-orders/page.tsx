'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { readDeviceOrders, removeDeviceOrder, type SavedOrder } from '@/lib/customer-orders';
import { commerceApi, type TrackingOrder } from '@/lib/commerce-api';
import { Bell, ClipboardList, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';

export default function CustomerOrdersPage() {
  const params = useParams<{storeSlug:string}>();
  const slug = params.storeSlug;
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  useEffect(() => {if (slug) setOrders(readDeviceOrders(slug));},[slug]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');
  const lastStatuses = useRef<Record<string, string>>({});
  const [notifications, setNotifications] = useState(false);
  const statusNames: Record<string,string> = {Pending:'تم استلام الطلب',Confirmed:'تم تأكيد الطلب',Preparing:'جاري التجهيز',Shipped:'خرج للتوصيل',Delivered:'تم التسليم',Cancelled:'تم إلغاء الطلب',Rejected:'تم رفض الطلب'};

  const checkStatuses = useCallback(async () => {
    if (!slug || document.visibilityState !== 'visible' || checking) return;
    const saved = readDeviceOrders(slug).slice(0, 10);
    if (!saved.length) return;
    setChecking(true);
    const results = await Promise.all(saved.map(async o => {
      try {
        const next = await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(slug)}/orders/track/${o.token}`);
        return { token:o.token, status:next.status, number:o.number };
      } catch { return null; }
    }));
    const updated:Record<string,string> = {};
    const changed:Record<string,boolean> = {};
    for (const item of results) {
      if (!item) continue;
      updated[item.token] = item.status;
      const previous = lastStatuses.current[item.token];
      if (previous && previous !== item.status) {
        changed[item.token] = true;
        if (notifications && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification('تحديث طلب من WatsStore', {body:`طلب #${item.number}: ${statusNames[item.status] || item.status}`}); } catch { /* optional */ }
        }
      }
    }
    lastStatuses.current = {...lastStatuses.current,...updated};
    setStatuses(prev => ({...prev,...updated}));
    if (Object.keys(changed).length) {setChanges(prev => ({...prev,...changed})); setNotice('فيه تحديث جديد على حالة أحد طلباتك.');}
    setChecking(false);
  }, [slug, checking, notifications]);

  useEffect(() => {
    if (!orders.length) return;
    void checkStatuses();
    const timer = window.setInterval(() => {void checkStatuses();}, 60000);
    return () => window.clearInterval(timer);
  }, [orders.length, checkStatuses]);

  async function enableNotifications() {
    if (!('Notification' in window)) {setNotice('المتصفح ده مش بيدعم إشعارات سطح المكتب. هتفضل تحديثات الحالة ظاهرة هنا.'); return;}
    const permission = await Notification.requestPermission();
    setNotifications(permission === 'granted');
    setNotice(permission === 'granted' ? 'تم تفعيل تنبيهات الحالة أثناء فتح صفحة طلباتي.' : 'مش هنرسل إشعارات؛ تقدر تتابع الطلبات من الصفحة.');
  }
  const remove = (token:string) => {
    removeDeviceOrder(slug,token);
    setOrders(readDeviceOrders(slug));
  };
  return <main dir="rtl" className="min-h-screen bg-stone-50 text-stone-900 p-4 sm:p-8">
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-3"><Link href={`/s/${encodeURIComponent(slug)}`} className="underline text-sm font-semibold">العودة للمتجر</Link><span className="text-xs text-stone-500">WatsStore</span></div>
      <header className="rounded-2xl bg-white border border-stone-200 p-6">
        <h1 className="text-3xl font-black flex items-center gap-3"><ClipboardList size={28}/> طلباتي</h1>
        <p className="text-stone-600 mt-3 text-sm leading-7">طلباتك المحفوظة على هذا الجهاز والمتصفح فقط. اضغط على أي طلب لمتابعة حالته الحالية.</p>
      </header>
      <section className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-950 text-sm leading-7 flex gap-3"><ShieldCheck className="shrink-0" size={23}/>
        <p>دي مش قائمة طلبات مرتبطة بحساب مسجّل. لو فتحت المتجر من جهاز تاني أو مسحت بيانات المتصفح، الطلبات هنا مش هتظهر. احتفظ بروابط المتابعة في مكان آمن، لأن أي شخص معاه الرابط يقدر يشوف تفاصيل الطلب غير الحساسة.</p>
      </section>
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-stone-600">حالة طلباتك بتتحدّث كل دقيقة طالما الصفحة مفتوحة.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={checking} onClick={()=>void checkStatuses()} className="min-h-11 inline-flex items-center gap-2 px-4 rounded-lg border text-sm"><RefreshCcw size={16}/>{checking?'جاري التحديث':'تحديث الآن'}</button>
          <button type="button" onClick={()=>void enableNotifications()} className="min-h-11 inline-flex items-center gap-2 px-4 rounded-lg border text-sm"><Bell size={16}/>{notifications?'الإشعارات مفعلة':'تفعيل تنبيهات المتصفح'}</button>
        </div>
      </div>
      {notice && <p role="status" className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 text-sm">{notice}</p>}
      {orders.length ? <ul className="space-y-3">{orders.map(o=><li key={o.token} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-wrap gap-4 justify-between items-center">
        <div><p className="font-bold text-xl" dir="ltr">#{o.number}</p>{statuses[o.token] && <p className="text-sm font-semibold mt-1">{statusNames[statuses[o.token]] || statuses[o.token]} {changes[o.token] && <span className="text-emerald-700">· جديد</span>}</p>}<time className="text-xs text-stone-500" dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleString('ar-EG',{timeZone:'Africa/Cairo'})}</time></div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/s/${encodeURIComponent(slug)}/orders/${o.token}`} className="min-h-11 inline-flex items-center px-4 rounded-xl bg-stone-900 text-white text-sm font-bold">متابعة الطلب</Link>
          <button type="button" onClick={()=>remove(o.token)} className="min-h-11 inline-flex items-center gap-2 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs" aria-label={`حذف الطلب ${o.number} من هذا الجهاز`}><Trash2 size={16}/> إزالة</button>
        </div>
      </li>)}</ul> : <div className="bg-white border border-stone-200 p-10 text-center rounded-2xl"><ClipboardList className="mx-auto text-stone-400 mb-3" size={40}/><p className="font-bold">لسه مفيش طلبات محفوظة على الجهاز ده.</p><Link className="mt-5 inline-flex bg-stone-900 text-white px-5 py-3 rounded-xl" href={`/s/${encodeURIComponent(slug)}`}>ابدأ التسوق</Link></div>}
    </div>
  </main>;
}
